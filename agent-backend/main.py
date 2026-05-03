"""FastAPI service for Foodie's advisory shopping assistant."""

from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field

load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.2")
INVENTORY_API_URL = os.getenv("INVENTORY_API_URL", "http://127.0.0.1:8000/items")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("AGENT_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app = FastAPI(title="Foodie AI Assistant API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class InventoryItem(BaseModel):
    id: int | str | None = None
    name: str
    category: str | None = None
    description: str | None = None
    identifiers: list[str] = Field(default_factory=list)
    price: str | float | None = None
    availability: int | bool | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1500)
    inventory: list[InventoryItem] = Field(default_factory=list)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=12)


class ChatResponse(BaseModel):
    reply: str


def _normalize_inventory(raw_inventory: Any) -> list[InventoryItem]:
    if isinstance(raw_inventory, dict):
        raw_inventory = raw_inventory.get("items", [])

    normalized: list[InventoryItem] = []
    for item in raw_inventory if isinstance(raw_inventory, list) else []:
        if not isinstance(item, dict):
            continue

        name = item.get("name") or item.get("title")
        if not name:
            continue

        availability = item.get("availability", item.get("in_stock", item.get("stock")))
        normalized.append(
            InventoryItem(
                id=item.get("id"),
                name=name,
                category=item.get("category"),
                description=item.get("description"),
                identifiers=item.get("identifiers") or [],
                price=item.get("price"),
                availability=availability,
            )
        )
    return normalized


async def fetch_inventory() -> list[InventoryItem]:
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.get(INVENTORY_API_URL)
        response.raise_for_status()
        return _normalize_inventory(response.json())


def _inventory_for_prompt(inventory: list[InventoryItem]) -> str:
    lines = []
    for item in inventory[:180]:
        stock = item.availability
        in_stock = stock is True or (isinstance(stock, int) and stock > 0) or stock is None
        if not in_stock:
            continue

        details = [
            f"name={item.name}",
            f"category={item.category or 'uncategorized'}",
            f"description={item.description or 'none'}",
            f"tags={', '.join(item.identifiers) if item.identifiers else 'none'}",
            f"price={item.price if item.price is not None else 'unknown'}",
            f"availability={stock if stock is not None else 'available'}",
        ]
        lines.append("; ".join(details))
    return "\n".join(lines) or "No in-stock inventory was provided."


def _fallback_reply(message: str, inventory: list[InventoryItem]) -> str:
    terms = {word.lower().strip(".,!?") for word in message.split() if len(word) > 2}
    matches = []
    for item in inventory:
        stock = item.availability
        if stock is False or (isinstance(stock, int) and stock <= 0):
            continue
        searchable = " ".join(
            [
                item.name,
                item.category or "",
                item.description or "",
                " ".join(item.identifiers),
            ]
        ).lower()
        if any(term in searchable for term in terms):
            matches.append(item)
        if len(matches) == 5:
            break

    if not matches:
        return (
            "I can help with that, but I need the AI connection before I can give a full answer.\n\n"
            "Try asking for a specific product or recipe after OPENAI_API_KEY is set."
        )

    items = "\n".join(
        f"- {item.name}: {item.description or item.category or 'Available item'}"
        for item in matches
    )
    return (
        "I found a few simple inventory matches while the AI connection is offline:\n\n"
        f"{items}\n\nWould you like to pick any of these for your cart?"
    )


ASSISTANT_INSTRUCTIONS = (
    "You are Foodie AI, a warm, concise grocery shopping assistant inside the Foodie store. "
    "Sound natural and helpful, like a knowledgeable store teammate. Use friendly plain text. "
    "Do not sound corporate, robotic, overly formal, or salesy.\n\n"
    "Hard rules:\n"
    "- Never add, remove, or modify cart items.\n"
    "- Never claim a cart action was completed.\n"
    "- Only suggest in-stock inventory items from the provided inventory.\n"
    "- Ask a clarifying question when the request is ambiguous.\n"
    "- Do not assume dietary preferences, budget, brand loyalty, or household size.\n\n"
    "Formatting rules:\n"
    "- For quick answers, use 1 short paragraph plus a clear next question.\n"
    "- For product matches, use short bullets with product name, useful detail, and price when available.\n"
    "- For recipes, use these sections exactly when relevant: Available items, Missing items, Suggested substitutions.\n"
    "- If the user asks for another format, adapt to it: checklist, meal plan, table-style text, or grouped list.\n"
    "- Keep responses scannable. Avoid long explanations.\n"
    "- End shopping-list or recipe responses by asking whether they want the list prepared for their cart."
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Foodie AI Assistant API is running"}


@app.get("/inventory", response_model=list[InventoryItem])
async def inventory() -> list[InventoryItem]:
    try:
        return await fetch_inventory()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Inventory service is unavailable") from exc


@app.post("/assistant/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        current_inventory = request.inventory or await fetch_inventory()
    except httpx.HTTPError:
        return ChatResponse(
            reply=(
                "I could not reach the current inventory service. "
                "Please try again after the main backend is running."
            )
        )

    if not os.getenv("OPENAI_API_KEY"):
        return ChatResponse(reply=_fallback_reply(request.message, current_inventory))

    client = AsyncOpenAI()
    conversation = [
        {"role": entry.get("role", "user"), "content": entry.get("content", "")}
        for entry in request.history
        if entry.get("content")
    ]
    conversation.append({"role": "user", "content": request.message})

    try:
        response = await client.responses.create(
            model=OPENAI_MODEL,
            instructions=f"{ASSISTANT_INSTRUCTIONS}\n\nCurrent in-stock inventory:\n{_inventory_for_prompt(current_inventory)}",
            input=conversation,
        )
    except OpenAIError:
        return ChatResponse(
            reply=(
                "I could not get an AI response right now. Please check the OpenAI API key, "
                "model access, and network connection, then try again."
            )
        )

    return ChatResponse(reply=response.output_text)
