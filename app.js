(() => {
  "use strict";

  const keys = {
    cart: "buyfarm_cart",
    session: "buyfarm_session",
    delivery: "buyfarm_delivery",
    orders: "buyfarm_orders"
  };

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const cart = () => read(keys.cart, []);
  const saveCart = value => write(keys.cart, value);
  const rupees = value => `₹${Number(value).toLocaleString("en-IN")}`;

  let toastTimer;
  const showToast = message => {
    let toast = document.getElementById("buyfarm-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "buyfarm-toast";
      toast.setAttribute("role", "status");
      toast.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;" +
        "background:#1d2b1d;color:#fff;padding:12px 18px;border-radius:8px;" +
        "box-shadow:0 8px 24px rgba(0,0,0,.22);font-family:Arial,sans-serif";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = "none"; }, 2600);
  };

  const normalizeLinks = () => {
    const targets = {
      "home page.html": "index.html",
      "loginpage.html": "login page",
      "activitycontact.html": "contactus.html",
      "pages/products.html": "products.html",
      "pages/order.html": "buyonline.html",
      "pages/contact.html": "contactus.html"
    };

    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      if (targets[href]) link.setAttribute("href", targets[href]);
    });
  };
  normalizeLinks();

  document.addEventListener("click", event => {
    const action = event.target.closest(".add-to-cart, .buy-now");
    if (!action) return;
    event.preventDefault();

    const card = action.closest(".cocoa, .brownrice, .apples");
    const name = card?.querySelector("h2")?.textContent.trim();
    const priceText = card?.querySelector("p")?.textContent || "";
    const price = Number(priceText.match(/(\d+)/)?.[1] || 0);
    if (!name || !price) return;

    const items = cart();
    const existing = items.find(item => item.name === name);
    if (existing) existing.quantity += 1;
    else items.push({ name, price, quantity: 1 });
    saveCart(items);
    showToast(action.classList.contains("buy-now")
      ? `${name} added. Continue to delivery.`
      : `${name} added to cart.`);

    if (action.classList.contains("buy-now")) {
      window.location.href = "buyonline.html";
    }
  });

  const deliveryForm = document.getElementById("delivery-form");
  if (deliveryForm) {
    deliveryForm.addEventListener("submit", event => {
      event.preventDefault();

      const fields = deliveryForm.querySelectorAll("#phonenum");
      const delivery = {
        name: deliveryForm.querySelector("#name")?.value.trim(),
        mobile: deliveryForm.querySelector("#mobilenumber")?.value.trim(),
        email: deliveryForm.querySelector("#email")?.value.trim(),
        address: fields[0]?.value.trim(),
        area: fields[1]?.value.trim(),
        pincode: fields[2]?.value.trim(),
        products: fields[3]?.value.trim(),
        instructions: deliveryForm.querySelector("#comment")?.value.trim()
      };

      if (!delivery.name || !delivery.mobile || !delivery.email || !delivery.address || !delivery.pincode) {
        showToast("Please complete the required delivery details.");
        return;
      }
      if (!/^\d{10}$/.test(delivery.mobile)) {
        showToast("Enter a valid 10-digit mobile number.");
        return;
      }
      if (!/^\d{6}$/.test(delivery.pincode)) {
        showToast("Enter a valid 6-digit pincode.");
        return;
      }

      write(keys.delivery, delivery);
      window.location.href = "payment.html";
    });
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", event => {
      event.preventDefault();
      const email = loginForm.querySelector('input[type="email"]')?.value.trim();
      const password = loginForm.querySelector('input[type="password"]')?.value || "";

      if (!email || !password) {
        showToast("Enter your email and password.");
        return;
      }
      if (password.length < 6) {
        showToast("Password must contain at least 6 characters.");
        return;
      }

      write(keys.session, { email, signedInAt: new Date().toISOString() });
      showToast("Signed in successfully.");
    });
  }

  const forgotPassword = loginForm?.querySelector('a[href="#"]');
  if (forgotPassword) {
    forgotPassword.addEventListener("click", event => {
      event.preventDefault();
      const email = loginForm.querySelector('input[type="email"]')?.value.trim();
      if (!email) {
        showToast("Enter your email to reset the password.");
        return;
      }
      showToast("Password reset instructions would be sent to your email.");
    });
  }

  const makePayment = document.getElementById("make-payment");
  if (makePayment) {
    makePayment.addEventListener("click", event => {
      event.preventDefault();
      const selected = document.querySelector('input[name="payment"]:checked');
      if (!selected) {
        showToast("Please select a payment method.");
        return;
      }

      const method = selected.parentElement?.querySelector("h4")?.textContent.trim() || "Payment";
      const orderId = `BF-${Math.floor(100000 + Math.random() * 900000)}`;
      const orders = read(keys.orders, []);
      const items = cart();

      orders.push({
        id: orderId,
        method,
        status: "Confirmed",
        date: new Date().toISOString(),
        delivery: read(keys.delivery, null),
        items
      });

      write(keys.orders, orders);
      saveCart([]);
      window.location.href =
        `payend.html?order=${encodeURIComponent(orderId)}&method=${encodeURIComponent(method)}`;
    });
  }

  if (window.location.pathname.endsWith("payend.html")) {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order");
    const heading = document.querySelector("h3");
    if (orderId && heading) {
      heading.textContent = `Order ${orderId} confirmed`;
      showToast("Payment completed successfully.");
    }
  }
})();
