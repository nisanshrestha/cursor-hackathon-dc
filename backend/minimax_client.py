"""
Minimax API client using the Anthropic Python SDK.

Minimax exposes an Anthropic-compatible API. Set MINIMAX_API_KEY in your
environment (or .env) to authenticate.
"""

import os

import anthropic

# Minimax Anthropic-compatible base URL
MINIMAX_BASE_URL = "https://api.minimax.io/anthropic"

# Supported models via Anthropic-compatible API
DEFAULT_MODEL = "MiniMax-M2.1"


def get_client() -> anthropic.Anthropic:
    """Build an Anthropic client configured for Minimax."""
    api_key = os.environ.get("MINIMAX_API_KEY")
    if not api_key:
        raise ValueError(
            "MINIMAX_API_KEY environment variable is required. "
            "Set it to your Minimax API key from https://platform.minimax.io"
        )
    return anthropic.Anthropic(
        api_key=api_key,
        base_url=MINIMAX_BASE_URL,
    )


def create_message(
    *,
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    max_tokens: int = 5000, #TODO: Might need to adjust this
    system: str | None = None,
    stream: bool = False,
    **kwargs,
):
    """
    Send a chat request to Minimax via the Anthropic SDK.

    Args:
        messages: List of message dicts with "role" and "content".
                  content can be a list of blocks, e.g. [{"type": "text", "text": "Hello"}].
        model: Model name (MiniMax-M2.1, MiniMax-M2.1-lightning, or MiniMax-M2).
        max_tokens: Maximum tokens to generate.
        system: Optional system prompt.
        stream: If True, return a stream of events.
        **kwargs: Additional arguments passed to client.messages.create().

    Returns:
        Message response or stream, depending on stream=.
    """
    client = get_client()
    return client.messages.create(
        model=model,
        max_tokens=max_tokens,
        messages=messages,
        system=system or "You are a helpful assistant.",
        stream=stream,
        **kwargs,
    )


def chat(user_message: str, system: str | None = None, model: str = DEFAULT_MODEL):
    """
    Simple one-turn chat with Minimax.

    Args:
        user_message: The user's text message.
        system: Optional system prompt.
        model: Model name.

    Returns:
        Full message response; use .content for text blocks.
    """
    messages = [
        {
            "role": "user",
            "content": [{"type": "text", "text": user_message}],
        }
    ]
    return create_message(
        messages=messages,
        model=model,
        system=system,
    )


def chat_with_history(
    messages: list[dict],
    system: str | None = None,
    model: str = DEFAULT_MODEL,
):
    """
    Multi-turn chat with Minimax using conversation history.

    Args:
        messages: List of message dicts with "role" and "content".
                  content can be a list of blocks, e.g. [{"type": "text", "text": "Hello"}].
                  Include the full conversation history (user + assistant messages).
        system: Optional system prompt.
        model: Model name.

    Returns:
        Full message response; use .content for text blocks.
    """
    return create_message(
        messages=messages,
        model=model,
        system=system,
    )
