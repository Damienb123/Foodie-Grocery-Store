# Foodie Grocery Store

## Overview

Online Shopping System is a full-stack e-commerce application for browsing grocery-style product categories, searching an item catalog, managing a shopping cart, and supporting administrative data operations for users, items, discounts, sales items, and orders.

The customer-facing frontend focuses on product discovery and cart management. Users can browse categories such as produce, dairy, pantry, bakery, household, pet, seasonal, and sale items. The shared search bar matches products by name, description, and identifiers, then routes users to a search results page where matching items can be sorted by price or availability.

The cart flow uses React context so cart state is shared across pages. When a user adds an item already in the cart, the quantity increases instead of creating duplicate rows. When a user removes an item, the quantity decreases until only one remains, then the item is removed from the cart entirely. The checkout summary calculates subtotal, discount, tax at 8.25%, and final total so the shopper can review the order before placement.

The backend is a FastAPI service using SQLModel and MariaDB. It exposes routes for retrieving and managing users, items, discount codes, sales items, current orders, and historical orders. This gives the project a database-backed foundation for e-commerce catalog management and administrative workflows.

## Key Features

- Category-based product browsing for grocery and household shopping flows
- Search suggestions that match product names, descriptions, and identifiers
- Search results with sorting by price and availability
- Product cards with images, descriptions, prices, identifiers, and add-to-cart actions
- Shared cart state across pages using React context
- Quantity-aware cart updates for adding and removing repeated items
- Checkout summary with subtotal, discount, tax, and total calculations
- Backend API routes for users, items, discount codes, sales items, and orders
- Multi-stage frontend container build that compiles the Vite app and serves it with Nginx

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- daisyUI
- Font Awesome and React Icons
- Nginx for serving the production frontend container

### Backend

- Python 3.11
- FastAPI
- SQLModel
- Pydantic
- Uvicorn
- MariaDB connector
- Passlib for password hashing
- PDM for Python dependency and script management

### Data and Configuration

- MariaDB database connection configured through environment variables
- SQLModel models for users, public users, items, public items, sales items, discount codes, and orders
- Frontend product data currently organized in React modules and category components

## Problems Solved

### Product Search and Discovery

The project solves a common e-commerce discovery problem: shoppers need to find products quickly without knowing the exact category path. Search checks product names, descriptions, and product identifiers, which allows users to find items through multiple types of input.

Search suggestions are deduplicated and prioritized so products whose names start with the query appear first. The results page also supports sorting by price from low to high, price from high to low, and availability. This helps users compare matching products and quickly identify affordable or in-stock options.

### Adding Items to a Cart

Product cards expose a direct add-to-cart action, making the shopping flow simple from category pages and search results. The cart logic checks whether the selected product already exists in the cart. If it does, the item quantity is incremented; if not, the product is added as a new cart line with a starting quantity of one.

This approach keeps the cart readable and avoids duplicate entries for the same item.

### Removing Items from a Cart

The checkout page gives users a clear way to remove items. Removal is quantity-aware: if the cart contains multiple units of the same item, removing it decrements the quantity by one. If only one unit remains, the item is removed from the cart entirely.

This mirrors expected shopping cart behavior and lets shoppers correct quantities without accidentally clearing unrelated cart data.

### Checkout Calculations

The checkout summary centralizes pricing calculations. It calculates the subtotal from item price and quantity, applies supported discount codes, computes tax at 8.25%, and displays the final total.

This solves the transparency problem for shoppers by showing how the order total is built before placement.

### Frontend Containerization

The frontend is containerized with a multi-stage Dockerfile:

1. A Node 18 build stage installs dependencies from `package.json` and `package-lock.json`.
2. Vite compiles the React application into static production assets.
3. A lightweight `nginx:stable-alpine` runtime image serves the compiled frontend from `/usr/share/nginx/html`.

This keeps the final image focused on serving the production build instead of shipping the full Node development environment. The result is a smaller and more reproducible frontend deployment path.

## Reproducibility Steps

These steps assume the repository has been cloned locally and that commands are run from the project root.

### Prerequisites

- Node.js 18 or newer
- npm
- Python 3.11
- PDM
- MariaDB
- Docker, if running the frontend container

### Backend Setup

1. Install Python dependencies:

   ```bash
   pdm install
   ```

2. Create a `.env` file in the project root with the database connection values expected by `back_end/core/config.py`:

   ```env
   DB_USERNAME=your_database_user
   DB_PASSWORD=your_database_password
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=online_shopping_system
   ```

3. Make sure the MariaDB database exists and is reachable with those credentials.

4. Start the FastAPI development server:

   ```bash
   pdm run fastapi-dev
   ```

5. Open the API locally:

   ```text
   http://127.0.0.1:8000
   ```

### Frontend Setup

1. Move into the frontend project:

   ```bash
   cd front-end
   ```

2. Install frontend dependencies:

   ```bash
   npm install
   ```

3. Start the Vite development server:

   ```bash
   npm run dev
   ```

4. Open the local Vite URL shown in the terminal, typically:

   ```text
   http://localhost:5173
   ```

### Build the Frontend Locally

From the `front-end` directory:

```bash
npm run build
```

The production build output is written to:

```text
front-end/dist
```

### Run the Frontend with Docker

From the `front-end` directory:

```bash
docker build -t online-shopping-frontend .
docker run --rm -p 8080:80 online-shopping-frontend
```

Then open:

```text
http://localhost:8080
```

## API Surface

The FastAPI backend currently includes routes for:

- `GET /` health-style root response
- `GET /users/` to retrieve users
- `POST /users/` to create users
- `PUT /users/{user_id}` to update users
- `GET /items` to retrieve items
- `POST /items/` to create items
- `PUT /items/{item_id}` to update items
- `POST /discount_codes/` to create discount codes
- `POST /sales_items/` to create sales items
- `GET /orders/current` to retrieve current orders
- `GET /orders/history` to retrieve completed orders with sorting options

## Project Structure

```text
.
+-- app.py                  # FastAPI application entry point
+-- back_end/               # API routes, database setup, models, and security helpers
+-- front-end/              # React + Vite frontend application
|   +-- Dockerfile          # Multi-stage frontend container build
|   +-- src/components/     # Product, search, cart, checkout, and category components
|   +-- src/hooks/          # Shared frontend hooks
|   +-- src/layouts/        # Navigation, page layout, login, and register views
+-- pyproject.toml          # Python project metadata and PDM scripts
+-- README.md
```
