(() => {
  "use strict";
  const keyName = "buyfarm_owner_key";
  const gate = document.getElementById("ownerGate");
  const form = document.getElementById("ownerKeyForm");
  const errorTarget = document.getElementById("ownerGateError");
  const messageTarget = document.getElementById("ownerGateMessage");
  const dashboard = document.getElementById("ownerDashboard");
  const orderList = document.getElementById("ownerOrderList");
  const statusFilter = document.getElementById("ownerStatusFilter");
  const searchInput = document.getElementById("ownerSearch");
  const money = value => `₹${Number(value || 0).toLocaleString("en-IN")}`;
  const dateText = value => new Date(value).toLocaleString("en-IN", {day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"});
  let ownerKey = sessionStorage.getItem(keyName) || "";
  let orders = [];
  let statuses = [];

  function showGate(message="") {
    gate.hidden = false;
    dashboard.hidden = true;
    errorTarget.textContent = message;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  async function adminRequest(url, options={}) {
    const requestedUrl = new URL(url, location.origin);
    const functionUrl = new URL("/api/handler", location.origin);
    functionUrl.searchParams.set("__path", requestedUrl.pathname);
    requestedUrl.searchParams.forEach((value,key) => functionUrl.searchParams.append(key,value));
    const response = await fetch(functionUrl, {
      credentials:"same-origin",
      ...options,
      headers:{"Content-Type":"application/json","X-BuyFarm-Admin-Key":ownerKey,...(options.headers||{})}
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "BuyFarm could not complete that request.");
      error.status = response.status;
      throw error;
    }
    return data;
  }
  async function unlock(key) {
    ownerKey = key;
    errorTarget.textContent = "Checking access…";
    try {
      const data = await adminRequest("/api/admin/orders");
      sessionStorage.setItem(keyName, ownerKey);
      orders = data.orders || [];
      statuses = data.statuses || [];
      gate.hidden = true;
      dashboard.hidden = false;
      fillStatusOptions();
      document.querySelector("#ownerEmailNotice p").textContent = data.emailAlertsConfigured
        ? "Resend is configured. New-order messages are sent to the owner email; this dashboard remains the full order record."
        : "Email alerts are off until RESEND_API_KEY and RESEND_FROM_EMAIL are added to the server environment. New orders are still saved here.";
      paintDashboard();
    } catch (error) {
      ownerKey = "";
      sessionStorage.removeItem(keyName);
      showGate(error.status === 401 ? "Sign in to the owner account first. Redirecting to sign in…" : error.message);
      if (error.status === 401) {
        sessionStorage.setItem("buyfarm_return", "admin.html");
        location.replace("login.html");
      } else {
        document.getElementById("ownerKey").focus();
      }
    }
  }
  function fillStatusOptions() {
    statusFilter.replaceChildren(new Option("All statuses", "all"));
    statuses.forEach(status => statusFilter.add(new Option(status, status)));
  }
  function makeOrderCard(order) {
    const card = element("article", "owner-order-card");
    const head = element("div", "owner-order-head");
    const summary = element("div", "owner-order-summary");
    summary.append(element("span", "owner-order-ref", `ORDER ${String(order.id).slice(0,8).toUpperCase()}`));
    summary.append(element("h3", "", order.customer_name || "BuyFarm customer"));
    summary.append(element("p", "owner-customer-email", order.customer_email || ""));
    head.append(summary);
    const total = element("div", "owner-order-total");
    total.append(element("strong", "", money(order.total)));
    total.append(element("span", "", dateText(order.created_at)));
    head.append(total);
    card.append(head);

    const detailGrid = element("div", "owner-order-details");
    const itemPanel = element("section", "owner-detail-panel");
    itemPanel.append(element("h4", "", "Basket"));
    const itemList = element("ul", "owner-items");
    (Array.isArray(order.items) ? order.items : []).forEach(item => {
      itemList.append(element("li", "", `${item.name} × ${item.quantity} · ${money((Number(item.price)||0)*(Number(item.quantity)||0))}`));
    });
    itemPanel.append(itemList);
    itemPanel.append(element("small", "owner-payment", `Payment · ${order.payment_method}`));
    detailGrid.append(itemPanel);

    const delivery = order.delivery || {};
    const deliveryPanel = element("section", "owner-detail-panel");
    deliveryPanel.append(element("h4", "", "Delivery"));
    deliveryPanel.append(element("p", "", delivery.name || "Name not provided"));
    deliveryPanel.append(element("p", "", delivery.phone || "Phone not provided"));
    deliveryPanel.append(element("p", "", `${delivery.address || "Address not provided"}${delivery.pincode ? ` · ${delivery.pincode}` : ""}`));
    detailGrid.append(deliveryPanel);
    card.append(detailGrid);

    const actions = element("form", "owner-status-form");
    const label = element("label", "", "Order status");
    const select = document.createElement("select");
    select.name = "status";
    statuses.forEach(status => select.add(new Option(status, status)));
    select.value = order.status;
    label.append(select);
    actions.append(label);
    const save = element("button", "button primary", "Save status");
    save.type = "submit";
    actions.append(save);
    actions.addEventListener("submit", async event => {
      event.preventDefault();
      save.disabled = true;
      save.textContent = "Saving…";
      try {
        await adminRequest(`/api/admin/orders/${encodeURIComponent(order.id)}`, {method:"PATCH",body:JSON.stringify({status:select.value})});
        order.status = select.value;
        paintDashboard();
      } catch (error) {
        save.disabled = false;
        save.textContent = "Save status";
        showGate(error.message);
      }
    });
    card.append(actions);
    return card;
  }
  function paintDashboard() {
    const pending = orders.filter(order => ["Placed","Confirmed"].includes(order.status)).length;
    document.getElementById("ownerOrderCount").textContent = orders.length.toLocaleString("en-IN");
    document.getElementById("ownerPendingCount").textContent = pending.toLocaleString("en-IN");
    document.getElementById("ownerOrderValue").textContent = money(orders.reduce((sum, order) => sum + Number(order.total || 0), 0));
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filter = statusFilter.value;
    const visible = orders.filter(order => {
      if (filter !== "all" && order.status !== filter) return false;
      const delivery = order.delivery || {};
      const haystack = [order.id,order.customer_name,order.customer_email,...(Array.isArray(order.items)?order.items.map(item=>item.name):[]),delivery.address].join(" ").toLocaleLowerCase();
      return haystack.includes(query);
    });
    orderList.replaceChildren();
    if (!visible.length) {
      const empty = element("div", "owner-empty");
      empty.append(element("span", "", orders.length ? "⌕" : "🌱"));
      empty.append(element("h3", "", orders.length ? "No orders match those filters" : "Your first order will show up here"));
      empty.append(element("p", "", orders.length ? "Try another search or status." : "Orders placed by customers will appear in this dashboard and can trigger an email alert."));
      orderList.append(empty);
      return;
    }
    visible.forEach(order => orderList.append(makeOrderCard(order)));
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const key = String(new FormData(form).get("key") || "").trim();
    if (key.length < 32) return showGate("Owner access keys must be at least 32 characters.");
    unlock(key);
  });
  document.getElementById("refreshOwnerOrders").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const data = await adminRequest("/api/admin/orders");
      orders = data.orders || [];
      paintDashboard();
    } catch (error) { showGate(error.message); }
    finally { button.disabled = false; }
  });
  statusFilter.addEventListener("change", paintDashboard);
  searchInput.addEventListener("input", paintDashboard);
  if (ownerKey) unlock(ownerKey);
})();
