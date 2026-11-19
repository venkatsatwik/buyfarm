# BuyFarm

BuyFarm is a responsive farm-products storefront with shared HTML, CSS, cart, checkout, login, and order functionality.

## Pages

- `index.html` and `homepage`: storefront home
- `products.html`: searchable product catalog
- `productsvegetables.html`, `productsfruits.html`, `productsgrains.html`: category pages
- `buyonline.html`: delivery details
- `payment.html`: payment selection
- `payend.html`: order confirmation
- `login page`: sign-in demo
- `contactus.html`: contact details

## Cart

The shared `app.js` stores cart items and quantities in browser local storage. The cart drawer shows product names, prices, quantities, and the live total.

## Run locally

Open `index.html` in a browser, or serve the folder with:

```text
python -m http.server 4173
```

Then open `http://127.0.0.1:4173`.
