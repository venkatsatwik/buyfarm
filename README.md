# BuyFarm

BuyFarm is a responsive farm-produce shop with customer accounts, saved addresses, wishlists, order history, and a local cart.

## Project layout

```text
public/              Storefront pages, CSS, browser JavaScript, and images
api/                 Vercel serverless API entry point and request handlers
db/                  PostgreSQL schema
tests/               API smoke checks
server.js            Local Node.js development server
package.json         Runtime dependencies and commands
vercel.json          Vercel static output configuration
```

## Pages

- `public/index.html`: storefront and featured products
- `public/products.html` and the three `public/products*.html` pages: search, categories, and product cards
- `public/login.html` and `public/register.html`: server-backed customer accounts
- `public/account.html`: customer profile and saved delivery addresses
- `public/wishlist.html`: saved products
- `public/buyonline.html`, `public/payment.html`, and `public/payend.html`: delivery and order flow
- `public/orders.html`: account order history
- `public/admin.html`: owner-only order dashboard with delivery information and status updates
- `public/contactus.html`: saves support messages with a reference number

## Account and data storage

Customer accounts, password hashes, sessions, saved addresses, wishlists, orders, and contact messages are stored in a persistent local SQLite database during development, or PostgreSQL when `DATABASE_URL` is set. Passwords are hashed with Node's `scrypt`; the plain password is never stored in the browser or database. A random session token is stored in an `HttpOnly`, `SameSite=Lax` cookie, while only its hash is stored in the database. The cart remains on the current device in local storage.

Orders currently accept cash on delivery only. The order is saved to the customer's history and the owner dashboard; no card or UPI details are collected or processed.

## Receiving and managing orders

Every order is stored in PostgreSQL in production (or local SQLite during development) with its customer, product snapshot, total, payment choice, delivery details, and status. Customers can only read their own order history. The owner dashboard at `/admin.html` can read all orders and update their status.

Owner access requires both a signed-in account whose email matches `BUYFARM_ADMIN_EMAIL` and a private `BUYFARM_ADMIN_KEY` of at least 32 random bytes. The key is entered in the dashboard and stays in the current browser tab's session storage. This second check is needed because BuyFarm account registration does not verify email ownership. Generate a key with `node -p "require('node:crypto').randomBytes(32).toString('base64url')"`. Keep it out of source control and never put it in frontend code.

New-order email alerts are optional. Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `BUYFARM_ADMIN_EMAIL` on the server. Resend requires a permitted sender; for production, use an address on a domain verified with Resend. The email contains the customer name/email, items, amount, and payment choice, while delivery address and phone remain in the protected dashboard. If sending fails, the order still stays saved and visible in the dashboard. The order total is not proof of payment settlement; payments are currently demo choices.

## Run locally

1. Install Node.js 22.13 or newer. Copy `.env.example` to `.env`, set the owner email, and generate a private `BUYFARM_ADMIN_KEY` using the command in that file.
2. For a quick local run, leave `DATABASE_URL` commented out. BuyFarm creates `.data/buyfarm.sqlite` and keeps account data across server restarts. To use PostgreSQL locally, set `DATABASE_URL` to its connection string and set `DATABASE_SSL=true` if your database requires verified TLS.
3. Install dependencies and start the site:

```text
pnpm install
pnpm start
```

Open `http://localhost:4173`. The API creates its tables on first use. `db/init.sql` is provided for PostgreSQL schema review or pre-creation.

## Deployment plan

For Vercel, connect a PostgreSQL database and configure `DATABASE_URL` in the project's environment settings before deploying. `vercel.json` publishes the `public/` directory as the site while the root `api/` directory contains the serverless API. Vercel's serverless filesystem is temporary, so the local `.data/buyfarm.sqlite` database is for development only. Also set `BUYFARM_ADMIN_EMAIL`, `BUYFARM_ADMIN_KEY`, and (when ready for notifications) `RESEND_API_KEY` plus `RESEND_FROM_EMAIL` in Vercel's server-side environment settings. Do not commit `.env` or add these secrets to browser JavaScript. The `api/[...path].js` handler serves the account, customer order, and owner order APIs; `db/init.sql` describes its PostgreSQL tables. A Docker image is optional for local or self-hosted runs and is not required for Vercel.

## Checks

Run the API smoke checks with `pnpm test`. They exercise registration, password hashing, login, sessions across a process restart, wishlists, addresses, orders, and support messages using a temporary SQLite database.
