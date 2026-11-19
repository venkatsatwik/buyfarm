(() => {
  "use strict";

  const products = [
    {id:1,name:"Cocoa",category:"Grains",price:190,unit:"100 g",color:"#6c3d29"},
    {id:2,name:"Brown Rice",category:"Grains",price:130,unit:"1 kg",color:"#9f8357"},
    {id:3,name:"Red Apples",category:"Fruits",price:90,unit:"1 kg",color:"#c84d43"},
    {id:4,name:"Basmati Rice",category:"Grains",price:70,unit:"1 kg",color:"#b99b66"},
    {id:5,name:"Corn",category:"Vegetables",price:50,unit:"1 kg",color:"#dcb84b"},
    {id:6,name:"Oats",category:"Grains",price:170,unit:"1 kg",color:"#a88d68"},
    {id:7,name:"Soy Beans",category:"Grains",price:40,unit:"1 kg",color:"#dad0ad"},
    {id:8,name:"Quinoa",category:"Grains",price:170,unit:"1 kg",color:"#c7b78f"},
    {id:9,name:"Oranges",category:"Fruits",price:85,unit:"1 kg",color:"#e48b38"},
    {id:10,name:"Bananas",category:"Fruits",price:127,unit:"1 kg",color:"#dcb84b"},
    {id:11,name:"Strawberries",category:"Fruits",price:19,unit:"100 g",color:"#c94b45"},
    {id:12,name:"Blueberries",category:"Fruits",price:490,unit:"150 g",color:"#4d5f96"},
    {id:13,name:"Tomatoes",category:"Vegetables",price:45,unit:"1 kg",color:"#d85b43"},
    {id:14,name:"Potatoes",category:"Vegetables",price:127,unit:"1 kg",color:"#c79a63"},
    {id:15,name:"Carrots",category:"Vegetables",price:78,unit:"1 kg",color:"#e58a3b"},
    {id:16,name:"Onions",category:"Vegetables",price:55,unit:"1 kg",color:"#b87362"},
    {id:17,name:"Cabbage",category:"Vegetables",price:12,unit:"1 kg",color:"#91b86a"},
    {id:18,name:"Broccoli",category:"Vegetables",price:55,unit:"1 kg",color:"#4f8054"},
    {id:19,name:"Spinach",category:"Vegetables",price:24,unit:"1 kg",color:"#4a7d4e"},
    {id:20,name:"Cucumbers",category:"Vegetables",price:32,unit:"1 kg",color:"#78a66c"}
  ];

  const keys={cart:"buyfarm_cart",session:"buyfarm_session",delivery:"buyfarm_delivery",orders:"buyfarm_orders"};
  const read=(key,fallback)=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}catch{return fallback;}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const cart=()=>read(keys.cart,[]);
  const saveCart=value=>write(keys.cart,value);
  const money=value=>`₹${Number(value).toLocaleString("en-IN")}`;

  let toastTimer;
  const toast=message=>{
    let element=document.getElementById("buyfarm-toast");
    if(!element){element=document.createElement("div");element.id="buyfarm-toast";element.className="toast";element.setAttribute("role","status");document.body.appendChild(element);}
    element.textContent=message;element.classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove("show"),2400);
  };

  document.querySelectorAll("a[href]").forEach(link=>{
    const href=link.getAttribute("href");
    if(href==="home page.html")link.setAttribute("href","index.html");
    if(href==="loginpage.html")link.setAttribute("href","login page");
  });

  const renderProducts=(targetId,items)=>{
    const target=document.getElementById(targetId);
    if(!target)return;
    target.innerHTML=items.map(product=>`
      <article class="product-card" data-category="${product.category}">
        <div class="product-visual"><div class="product-dot" style="background:${product.color}" aria-hidden="true"></div></div>
        <div class="product-info">
          <span class="product-category">${product.category} · ${product.unit}</span>
          <h3>${product.name}</h3>
          <div class="product-row"><strong class="price">${money(product.price)}</strong>
            <button type="button" class="add-button" data-add="${product.id}" aria-label="Add ${product.name} to cart">+</button>
          </div>
        </div>
      </article>`).join("");
  };
  renderProducts("featuredProducts",products.slice(0,4));
  renderProducts("shopProducts",products);

  const categoryGrid=document.getElementById("categoryProducts");
  if(categoryGrid)renderProducts("categoryProducts",products.filter(product=>product.category===categoryGrid.dataset.category));

  const search=document.getElementById("searchInput");
  if(search){
    search.addEventListener("input",()=>{
      const query=search.value.trim().toLowerCase();
      const category=document.querySelector(".filter.active")?.dataset.category||"All";
      const filtered=products.filter(product=>(category==="All"||product.category===category)&&`${product.name} ${product.category}`.toLowerCase().includes(query));
      renderProducts("shopProducts",filtered);
    });
  }

  document.querySelectorAll(".filter").forEach(filter=>{
    filter.addEventListener("click",()=>{
      document.querySelectorAll(".filter").forEach(button=>button.classList.remove("active"));
      filter.classList.add("active");
      const category=filter.dataset.category;
      const filtered=category==="All"?products:products.filter(product=>product.category===category);
      renderProducts("shopProducts",filtered);
    });
  });

  document.addEventListener("click",event=>{
    const add=event.target.closest("[data-add]");
    if(add){
      const product=products.find(item=>item.id===Number(add.dataset.add));
      if(!product)return;
      const items=cart();
      const existing=items.find(item=>item.id===product.id||item.name===product.name);
      if(existing){Object.assign(existing,product,{quantity:(existing.quantity||1)+1});}else items.push({...product,quantity:1});
      saveCart(items);renderCart();toast(`${product.name} added to cart`);
    }
    const quantity=event.target.closest("[data-quantity]");
    if(quantity){
      const id=Number(quantity.dataset.id);
      const items=cart();
      const item=items.find(entry=>entry.id===id);
      if(!item)return;
      item.quantity+=Number(quantity.dataset.quantity);
      const updated=item.quantity>0?items:items.filter(entry=>entry.id!==id);
      saveCart(updated);renderCart();
    }
    if(event.target.closest("#cartButton"))document.getElementById("cartBackdrop").hidden=false;
  });

  const renderCart=()=>{
    const items=cart();
    const countElement=document.getElementById("cartCount");
    if(countElement)countElement.textContent=items.reduce((sum,item)=>sum+item.quantity,0);
    const target=document.getElementById("cartItems");
    if(target){
      target.innerHTML=items.length?items.map(item=>`
        <article class="cart-item">
          <div class="cart-thumb" style="background:${item.color}">×</div>
          <div><h3>${item.name}</h3><strong>${money(item.price)}</strong></div>
          <div class="quantity">
            <button type="button" data-quantity="-1" data-id="${item.id}" aria-label="Decrease ${item.name} quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-quantity="1" data-id="${item.id}" aria-label="Increase ${item.name} quantity">+</button>
          </div>
        </article>`).join(""):'<p class="empty-cart">Your cart is empty.</p>';
    }
    const total=document.getElementById("cartTotal");
    if(total)total.textContent=money(items.reduce((sum,item)=>sum+item.price*item.quantity,0));
  };
  renderCart();

  const backdrop=document.getElementById("cartBackdrop");
  if(backdrop)backdrop.addEventListener("click",event=>{if(event.target===backdrop)backdrop.hidden=true;});
  document.querySelectorAll("[data-close-cart]").forEach(button=>button.addEventListener("click",()=>{document.getElementById("cartBackdrop").hidden=true;}));

  const checkout=document.getElementById("checkoutButton");
  if(checkout)checkout.addEventListener("click",()=>{
    if(!cart().length){toast("Add a product to your cart first");return;}
    document.getElementById("cartBackdrop").hidden=true;
    window.location.href="buyonline.html";
  });

  const deliveryForm=document.getElementById("deliveryForm");
  if(deliveryForm)deliveryForm.addEventListener("submit",event=>{
    event.preventDefault();
    const data=new FormData(deliveryForm);
    const delivery={name:String(data.get("name")||"").trim(),phone:String(data.get("phone")||"").trim(),address:String(data.get("address")||"").trim(),pincode:String(data.get("pincode")||"").trim()};
    if(!delivery.name||!/^\d{10}$/.test(delivery.phone)||delivery.address.length<5||!/^\d{6}$/.test(delivery.pincode)){toast("Complete valid delivery details");return;}
    write(keys.delivery,delivery);window.location.href="payment.html";
  });

  const loginForm=document.getElementById("loginForm");
  if(loginForm)loginForm.addEventListener("submit",event=>{
    event.preventDefault();
    const data=new FormData(loginForm);
    const email=String(data.get("email")||"").trim();
    const password=String(data.get("password")||"");
    if(!email||password.length<6){toast("Enter a valid email and 6-character password");return;}
    write(keys.session,{email,signedInAt:new Date().toISOString()});toast("Signed in successfully");
  });

  const paymentForm=document.getElementById("paymentForm");
  if(paymentForm)paymentForm.addEventListener("submit",event=>{
    event.preventDefault();
    const data=new FormData(paymentForm);
    const method=String(data.get("payment")||"");
    if(!method){toast("Select a payment method");return;}
    const orderId=`BF-${Math.floor(100000+Math.random()*900000)}`;
    const orders=read(keys.orders,[]);
    orders.push({id:orderId,method,status:"Confirmed",date:new Date().toISOString(),delivery:read(keys.delivery,null),items:cart()});
    write(keys.orders,orders);saveCart([]);
    window.location.href=`payend.html?order=${encodeURIComponent(orderId)}&method=${encodeURIComponent(method)}`;
  });

  const ordersTarget=document.getElementById("ordersList");
  if(ordersTarget){
    const orders=read(keys.orders,[]);
    ordersTarget.innerHTML=orders.length?orders.slice().reverse().map(order=>`<article class="order-card"><div><strong>${order.id}</strong><p>${order.items.length} item(s) · ${order.date.slice(0,10)}</p></div><span class="order-status">${order.status}</span></article>`).join(""):'<div class="empty-state">No orders yet. Browse the shop to place an order.</div>';
  }

  if(window.location.pathname.endsWith("payend.html")){
    const params=new URLSearchParams(window.location.search);
    const heading=document.getElementById("confirmedOrder");
    if(heading&&params.get("order"))heading.textContent=`Order ${params.get("order")} confirmed`;
  }
})();
