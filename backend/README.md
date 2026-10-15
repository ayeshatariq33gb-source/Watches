# Maison Aurel API

Express and MongoDB API for the Maison Aurel storefront. The API is mounted at `/api/v1`; catalog responses use the same product fields as the React sample catalog.

## Configuration

Copy `.env.example` to `.env` if needed and provide a MongoDB connection string in `MONGODB_URI`. The current workspace already has a configured MongoDB connection. Generate a strong JWT signing key without printing it with:

```powershell
npm run setup:jwt
```

The script adds a random 48-byte `JWT_SECRET` to the existing ignored `.env` and does not change other values. `FRONTEND_URL` defaults to `http://localhost:5173`.

To create a new administrator through the seed script, configure `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters. Seeding never changes an existing user's role or password. If the configured email is not already an administrator and the password is too short, the seed skips admin creation and prints a warning.

## Run

```powershell
npm run seed
npm run dev
```

The seed command inserts the five sample categories and six watches only when their slugs do not already exist. It preserves existing catalog and administrator records. The API listens on port 5000 by default. The frontend reads `VITE_API_BASE_URL` from `frontend/.env` and defaults to `http://localhost:5000/api/v1`.

## Test

```powershell
npm test
npm audit
```

The integration suite uses MongoDB Memory Server and covers auth, roles, catalog search, cart/wishlist, stock reservation, COD, demo-card approval, review moderation, and logout/session revocation. The test binary is downloaded on its first run.

## API Surface

- `GET /health`: API and database readiness.
- `/auth`: register, login, current session, logout.
- `/users`: protected profile, dashboard, and order history.
- `/products` and `/categories`: public catalog, category filters, price filters/sorting, and reviews.
- `/cart`, `/wishlist`, `/orders`: authenticated shopping and order APIs.
- `/admin`: admin-only overview, products, categories, inventory, customers, orders, payments, and review moderation.

Orders use server-side product prices and stock checks. Demo card data is Luhn-validated but never stored or charged; only brand, last four digits, and a generated reference are retained. Card payment and order approval remain pending until an administrator decides. Cash-on-delivery orders also require admin order approval.
