from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import anthropic
import json
import re

from minimax_client import chat

app = FastAPI(title="Backend API")


def extract_json_from_text(text: str | None) -> dict:
    """
    Extract and parse JSON from text that may be wrapped in markdown code fences.
    Returns empty dict if parsing fails or text is empty.
    """
    if not text:
        return {}

    # Strip markdown code fences if present (e.g., ```json ... ```)
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        # Remove closing fence
        text = re.sub(r"\s*```\s*$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Return empty dict if parsing fails
        return {}

MERMAID_SYSTEM_PROMPT_DEVNOTES_GENERATION = (
    "You are a helpful assistant that generates Mermaid diagrams. "
    "The input will always be code that can be of any language, such as Python, Java, Javascript, etc."
    "Respond only with valid Mermaid diagram code based on the user's description."
    "The Mermaid diagram should be a sequenceDiagram. Clearly mark participants and use alt/else/end blocks to denote branching logic."
    "For REST endpoints, The 'Note over' blocks should represent the endpoint itself."
)

MERMAID_SYSTEM_PROMPT_CODEINSIGHTS_GENERATION = (
    "You are an expert at generating code insights for Mermaid diagrams. "
    "A Mermaid sequenceDiagram has already been generated for the source code. "
    "Your task is to map each section of the provided Mermaid diagram back to the source code by line numbers.\n\n"
    "For each significant section of the diagram (participants, interactions, decisions, alt/else blocks), "
    "identify the corresponding source code lines that implement it.\n\n"
    "Return your response as a JSON object with a single field:\n"
    "   - 'codeInsights': An array of objects, each containing:\n"
    "       * 'mermaidStartLine': The line number where this diagram section starts (1-based)\n"
    "       * 'codeStartLine': The line number in the source code where this logic begins\n"
    "       * 'codeEndLine': The line number in the source code where this logic ends\n\n"
    "Example response format:\n"
    "{\n"
    '  "codeInsights": [\n'
    "       {\"mermaidStartLine\": 1, \"codeStartLine\": 10, \"codeEndLine\": 15},\n"
    "       {\"mermaidStartLine\": 2, \"codeStartLine\": 20, \"codeEndLine\": 25},\n"
    "       {\"mermaidStartLine\": 4, \"codeStartLine\": 30, \"codeEndLine\": 35}\n"
    "   ]\n"
    "}\n\n"
    "Ensure each codeInsight accurately maps the diagram section to its corresponding source code implementation."
)

MERMAID_SYSTEM_PROMPT_SINGLE_REQUEST = (
    "You are a helpful assistant that generates Mermaid diagrams with code insights. "
    "The input will always be code that can be of any language, such as Python, Java, JavaScript, etc.\n\n"
    "Your task has two parts:\n\n"
    "1. Generate a Mermaid sequenceDiagram that visualizes the input code. "
    "Clearly mark participants and use alt/else/end blocks for branching logic. "
    "For REST endpoints, use 'Note over' blocks to represent the endpoint itself.\n\n"
    "2. Map each section of the Mermaid diagram back to the source code by line numbers. "
    "For each significant section of the diagram (participants, interactions, decisions, alt/else blocks), "
    "identify the corresponding source code lines that implement it.\n\n"
    "3. CRITICAL: You MUST return ONLY valid JSON. Do not include any markdown code fences, explanations, or any other text. "
    "Your entire response must be a valid JSON object with these exact two fields:\n"
    "   - 'mermaid_diagram': The complete Mermaid diagram as a string (escape newlines as \\n)\n"
    "   - 'codeInsights': An array of objects, each containing:\n"
    "       * 'mermaidStartLine': The line number where this diagram section starts (1-based)\n"
    "       * 'codeStartLine': The line number in the source code where this logic begins\n"
    "       * 'codeEndLine': The line number in the source code where this logic ends\n\n"
    "Example response (this is the ONLY format acceptable):\n"
    '{"mermaid_diagram": "sequenceDiagram\\\\n    Client->>Server: POST /login\\\\n    alt success\\\\n        Server->>Client: 200 OK\\\\n    else failure\\\\n        Server->>Client: 401 Unauthorized\\\\n    end", "codeInsights": [{"mermaidStartLine": 1, "codeStartLine": 10, "codeEndLine": 15}, {"mermaidStartLine": 2, "codeStartLine": 20, "codeEndLine": 25}]}\n\n'
    "Do not wrap the JSON in ```json ``` or any other formatting. "
    "Do not add any explanation before or after the JSON. "
    "Output only the JSON object."
)


@app.get("/")
def root():
    return {"message": "Backend API is running"}


@app.post(
    "/generate-mermaid-diagram",
    openapi_extra={
        "requestBody": {
            "content": {
                "text/plain": {
                    "schema": {
                        "type": "string",
                        "description": "Code or description to generate a Mermaid diagram from",
                    }
                }
            },
            "required": True,
        }
    },
)
async def generate_mermaid_diagram_and_codeinsights(request: Request):
    """Send the raw text body to Minimax and return both diagram and code insights in a single request."""
    raw_body = await request.body()
    prompt = raw_body.decode("utf-8")

    try:
        # Single call: get both mermaid diagram and code insights
        response = chat(user_message=prompt, system=MERMAID_SYSTEM_PROMPT_SINGLE_REQUEST)

        # Extract text content from the response
        raw_text = ""
        for block in response.content:
            if block.type == "text":
                raw_text = block.text or ""
                break

        # Log raw response for debugging
        print(f"Raw Minimax response: {raw_text[:500]}...")

        # Extract JSON from the response
        response_data = extract_json_from_text(raw_text)

        # Extract mermaid_diagram and code_insights from the response
        mermaid_diagram = response_data.get("mermaid_diagram", "")
        code_insights = response_data.get("codeInsights", [])

        # Store both in the result
        result = {
            "mermaid_diagram": mermaid_diagram,
            "code_insights": code_insights,
        }

        return JSONResponse(content=result)
    except anthropic.APIStatusError as e:
        # Return the provider's error JSON "as-is" (Minimax may return 500 with an error body)
        body = e.body if isinstance(e.body, dict) else {"error": str(e)}
        return JSONResponse(status_code=getattr(e, "status_code", 502) or 502, content=body)
