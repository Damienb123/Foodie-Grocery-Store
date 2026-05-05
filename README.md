# Online Shopping System

Online Shopping System is a grocery-style e-commerce app with a React storefront, a FastAPI and MariaDB backend, and an optional AI shopping assistant called Foodie AI. The storefront lets shoppers browse categories, search the catalog, manage a cart, review checkout totals, and ask the assistant for product or recipe-based shopping suggestions.

Foodie AI runs as a separate FastAPI service. The React widget sends the user's message, recent chat history, and current frontend catalog data to the assistant service. The assistant can also fetch inventory from the main backend API. When an OpenAI API key is configured, it uses the OpenAI Responses API; without a key, it falls back to simple inventory keyword matching so the UI remains testable.

## Features

- Category browsing for grocery, household, baby, pet, seasonal, sale, and specialty product groups
- Shared search across product names, descriptions, and identifiers
- Search results with sorting by price and availability
- Product cards with images, prices, stock counts, identifiers, and add-to-cart actions
- React cart context with quantity-aware add and remove behavior
- Checkout summary with subtotal, discount, tax, and total calculations
- FastAPI routes for users, items, discount codes, sales items, current orders, and order history
- Foodie AI chat drawer for grocery suggestions, product matches, and recipe shopping help
- Assistant guardrails that keep cart changes in the application layer instead of the AI model
- Multi-stage frontend Docker build served by Nginx

## Architecture

```text
React + Vite storefront
  |
  |-- browsing, search, cart, checkout
  |
  |-- FoodieAI.jsx chat widget
        |
        | POST /assistant/chat
        v
Foodie AI assistant API, port 8011
  |
  |-- uses frontend-provided inventory when available
  |-- can fetch GET /items from the main backend
  |-- calls OpenAI when OPENAI_API_KEY is set
        |
        v
Main FastAPI backend, port 8000
  |
  v
MariaDB
```

The assistant is advisory only. It can recommend items, substitutions, and shopping lists, but it does not add, remove, or modify cart contents. Cart actions remain explicit user actions in the React app.

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- daisyUI
- Font Awesome and React Icons
- Nginx for the production frontend container

### Backend

- Python 3.11
- FastAPI
- SQLModel
- Pydantic
- Uvicorn
- MariaDB connector
- Passlib
- PDM

### AI Assistant

- FastAPI assistant service in `agent-backend/`
- OpenAI Python SDK
- `httpx` for inventory fetches
- `python-dotenv` for local configuration
- CORS configured for local Vite origins

## Project Structure

```text
.
+-- app.py                         # Main FastAPI application entry point
+-- back_end/                      # API routes, database setup, models, and security helpers
+-- agent-backend/
|   +-- main.py                    # Foodie AI assistant API
|   +-- AGENTS.md                  # Assistant behavior and safety rules
+-- front-end/
|   +-- Dockerfile                 # Multi-stage frontend container build
|   +-- src/App.jsx                # React routes and global app shell
|   +-- src/components/FoodieAI.jsx # Chat assistant drawer
|   +-- src/components/Stock.jsx   # Frontend product catalog aggregation
|   +-- src/components/            # Product, search, cart, checkout, and category components
|   +-- src/layouts/               # Navigation, page layout, login, and register views
+-- pyproject.toml                 # Python dependencies and PDM scripts
+-- .env.template                  # Local environment variable template
+-- README.md
```

## Reproduce the Full App Locally

Run these commands from the project root unless a step says otherwise.

### 1. Prerequisites

- Node.js 18 or newer
- npm
- Python 3.11
- PDM
- MariaDB
- An OpenAI API key for full assistant responses
- Docker, only if you want to run the frontend container

### 2. Install Python Dependencies

```bash
pdm install
```

This installs dependencies for both FastAPI services: the main backend and the Foodie AI assistant backend.

### 3. Configure Environment Variables

Create `.env` in the project root. You can start from `.env.template`, but replace secrets with your own values.

```env
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=online_shopping_system

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.2
INVENTORY_API_URL=http://127.0.0.1:8000/items
AGENT_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
VITE_AGENT_API_URL=http://127.0.0.1:8011
```

Do not commit real API keys or database passwords. If `OPENAI_API_KEY` is omitted, the assistant API still runs, but it returns fallback inventory matches instead of model-generated responses.

### 4. Prepare MariaDB

Create a MariaDB database that matches `DB_NAME`:

```sql
CREATE DATABASE online_shopping_system;
```

Make sure the configured database user can connect to it. The main backend builds its SQLModel connection URL from the `DB_*` variables in `.env`.

### 5. Start the Main Backend API

```bash
pdm run fastapi-dev
```

The main backend runs at:

```text
http://127.0.0.1:8000
```

Useful checks:

```text
GET http://127.0.0.1:8000/
GET http://127.0.0.1:8000/items
```

### 6. Start the Foodie AI Assistant API

Open a second terminal in the project root:

```bash
pdm run agent-dev
```

The assistant backend runs at:

```text
http://127.0.0.1:8011
```

Useful checks:

```text
GET http://127.0.0.1:8011/
GET http://127.0.0.1:8011/inventory
POST http://127.0.0.1:8011/assistant/chat
```

The assistant endpoint expects a JSON body like:

```json
{
  "message": "Help me shop for chicken alfredo",
  "inventory": [],
  "history": []
}
```

If `inventory` is empty, the assistant service tries to fetch current inventory from `INVENTORY_API_URL`.

### 7. Start the React Frontend

Open a third terminal:

```bash
cd front-end
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

The Foodie AI button appears as a floating assistant control on the storefront. Open it and try:

```text
Help me shop for chicken alfredo
Suggest snacks for a movie night
I need milk and eggs
```

For the full assistant experience, keep all three services running:

- Main backend: `http://127.0.0.1:8000`
- Assistant backend: `http://127.0.0.1:8011`
- Frontend: `http://localhost:5173`

## Build and Run the Frontend Container

From the `front-end` directory:

```bash
docker build -t online-shopping-frontend .
docker run --rm -p 8080:80 online-shopping-frontend
```

Then open:

```text
http://localhost:8080
```

If the containerized frontend needs to talk to the local assistant service, set the appropriate Vite environment value before building so `VITE_AGENT_API_URL` points to a reachable assistant API URL from the browser.

## API Surface

### Main Backend

- `GET /` health-style root response
- `GET /users/` retrieves users
- `POST /users/` creates a user
- `PUT /users/{user_id}` updates a user
- `GET /items` retrieves items
- `POST /items/` creates an item
- `PUT /items/{item_id}` updates an item
- `POST /discount_codes/` creates a discount code
- `POST /sales_items/` creates a sales item
- `GET /orders/current` retrieves current orders
- `GET /orders/history?sort_by=date|customer|amount` retrieves completed orders

### Assistant Backend

- `GET /` confirms the assistant API is running
- `GET /inventory` fetches and normalizes inventory from the main backend
- `POST /assistant/chat` returns a Foodie AI chat response

## Assistant Behavior

Foodie AI is designed to help shoppers make decisions without taking direct action for them.

- It can suggest in-stock products from the provided inventory.
- It can turn recipes or meal ideas into shopping suggestions.
- It can identify likely missing ingredients and substitutions.
- It asks clarifying questions when the request is ambiguous.
- It never claims to add, remove, purchase, or reserve cart items.
- It keeps final cart changes under explicit user control in the frontend.

## Troubleshooting

If the frontend says it cannot reach Foodie AI, make sure `pdm run agent-dev` is running on port `8011` and that `VITE_AGENT_API_URL` matches that URL.

If the assistant says the inventory service is unavailable, make sure `pdm run fastapi-dev` is running on port `8000` and that `INVENTORY_API_URL` points to `http://127.0.0.1:8000/items`.

If the assistant returns fallback matches instead of richer AI responses, confirm `OPENAI_API_KEY` is set in `.env` and that `OPENAI_MODEL` is a model available to your OpenAI account.

If database-backed routes fail, confirm MariaDB is running, the database exists, and all `DB_*` values in `.env` are populated.
