from fastapi import Body, FastAPI
from fastapi.responses import JSONResponse
import anthropic

from minimax_client import chat

app = FastAPI(title="Backend API")

MERMAID_SYSTEM_PROMPT = (
    "You are a helpful assistant that generates Mermaid diagrams. "
    "The input will always be code that can be of any language, such as Python, Java, Javascript, etc."
    "Respond only with valid Mermaid diagram code based on the user's description."
    "The Mermaid diagram should be a sequenceDiagram. Clearly mark participants and use alt/else/end blocks to denote branching logic."
    "For REST endpoints, The 'Note over' blocks should represent the endpoint itself."
)


@app.get("/")
def root():
    return {"message": "Backend API is running"}


@app.post("/generate-mermaid-diagram")
def generate_mermaid_diagram(prompt: str = Body(..., embed=True)):
    """Send the prompt to Minimax and return the raw Minimax API response as JSON."""
    try:
        response = chat(user_message=prompt, system=MERMAID_SYSTEM_PROMPT)
        # Anthropic SDK responses are pydantic models; return as plain JSON
        return response.model_dump()
    except anthropic.APIStatusError as e:
        # Return the provider's error JSON "as-is" (Minimax may return 500 with an error body)
        body = e.body if isinstance(e.body, dict) else {"error": str(e)}
        return JSONResponse(status_code=getattr(e, "status_code", 502) or 502, content=body)
