(() => {
  "use strict";

  const products = [
    {id:1,name:"Cocoa",category:"Grains",price:190,unit:"100 g",color:"#6c3d29",image:"https://images.unsplash.com/photo-1575377744071-61a7f1a9c4a3?auto=format&fit=crop&w=600&q=85"},
    {id:2,name:"Brown Rice",category:"Grains",price:130,unit:"1 kg",color:"#9f8357",image:"https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=85"},
    {id:3,name:"Red Apples",category:"Fruits",price:90,unit:"1 kg",color:"#c84d43",image:"https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=85"},
    {id:4,name:"Basmati Rice",category:"Grains",price:70,unit:"1 kg",color:"#b99b66",image:"https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=85"},
    {id:5,name:"Corn",category:"Vegetables",price:50,unit:"1 kg",color:"#dcb84b",image:"https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=85"},
    {id:6,name:"Oats",category:"Grains",price:170,unit:"1 kg",color:"#a88d68",image:"https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?auto=format&fit=crop&w=600&q=85"},
    {id:7,name:"Soy Beans",category:"Grains",price:40,unit:"1 kg",color:"#dad0ad",image:"https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?auto=format&fit=crop&w=600&q=85"},
    {id:8,name:"Quinoa",category:"Grains",price:170,unit:"1 kg",color:"#c7b78f",image:"https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=85"},
    {id:9,name:"Oranges",category:"Fruits",price:85,unit:"1 kg",color:"#e48b38",image:"https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=85"},
    {id:10,name:"Bananas",category:"Fruits",price:127,unit:"1 kg",color:"#dcb84b",image:"https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=85"},
    {id:11,name:"Strawberries",category:"Fruits",price:19,unit:"100 g",color:"#c94b45",image:"https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=85"},
    {id:12,name:"Blueberries",category:"Fruits",price:490,unit:"150 g",color:"#4d5f96",image:"https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=85"},
    {id:13,name:"Tomatoes",category:"Vegetables",price:45,unit:"1 kg",color:"#d85b43",image:"https://images.unsplash.com/photo-1546470427-e5ac89d40ba8?auto=format&fit=crop&w=600&q=85"},
    {id:14,name:"Potatoes",category:"Vegetables",price:127,unit:"1 kg",color:"#c79a63",image:"https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=85"},
    {id:15,name:"Carrots",category:"Vegetables",price:78,unit:"1 kg",color:"#e58a3b",image:"https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=600&q=85"},
    {id:16,name:"Onions",category:"Vegetables",price:55,unit:"1 kg",color:"#b87362",image:"https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=85"},
    {id:17,name:"Cabbage",category:"Vegetables",price:12,unit:"1 kg",color:"#91b86a",image:"https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=85"},
    {id:18,name:"Broccoli",category:"Vegetables",price:55,unit:"1 kg",color:"#4f8054",image:"https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=85"},
    {id:19,name:"Spinach",category:"Vegetables",price:24,unit:"1 kg",color:"#4a7d4e",image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=85"},
    {id:20,name:"Cucumbers",category:"Vegetables",price:32,unit:"1 kg",color:"#78a66c",image:"https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=85"}
  ];

  const keys={cart:"buyfarm_cart",session:"buyfarm_session",delivery:"buyfarm_delivery",orders:"buyfarm_orders"};
  const read=(key,fallback)=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}catch{return fallback;}};
  if(window.location.pathname.endsWith("payment.html")&&!read(keys.session,null)){
    sessionStorage.setItem("buyfarm_return","buyonline.html");
    window.location.replace("login.html");
  }
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const cart=()=>read(keys.cart,[]);
  const saveCart=value=>write(keys.cart,value);
  const money=value=>`₹${Number(value).toLocaleString("en-IN")}`;

  const productFallback=(product)=>{
    const emoji={Fruits:"🍎",Vegetables:"🥬",Grains:"🌾"}[product.category]||"🌱";
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380"><rect width="600" height="380" fill="${product.category==="Fruits"?"#fff4df":product.category==="Vegetables"?"#edf6ef":"#f4efd9"}"/><circle cx="300" cy="155" r="88" fill="${product.color}" opacity=".95"/><text x="300" y="175" text-anchor="middle" font-size="82">${emoji}</text><text x="300" y="300" text-anchor="middle" font-family="Arial" font-size="34" fill="#173f27">${product.name}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

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

  const cartButton=document.getElementById("cartButton");
  if(cartButton){
    const count=cartButton.querySelector(".count");
    cartButton.innerHTML=`<span class="cart-symbol" aria-hidden="true">🛒</span> Cart ${count?`<span class="count" id="cartCount">${count.textContent}</span>`:"<span class=\"count\" id=\"cartCount\">0</span>"}`;
  }

  const signInLink=document.querySelector(".nav-button.primary");
  const session=read(keys.session,null);
  if(signInLink&&session){
    signInLink.textContent=session.email.split("@")[0];
  }

  document.querySelectorAll(".main-nav a").forEach(link=>{
    if(link.pathname===location.pathname||link.getAttribute("href")===decodeURIComponent(location.pathname.split("/").pop())){
      link.classList.add("active");
    }
  });

  const renderProducts=(targetId,items)=>{
    const target=document.getElementById(targetId);
    if(!target)return;
    target.innerHTML=items.map(product=>`
      <article class="product-card" data-category="${product.category}">
        <div class="product-visual"><img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='${productFallback(product)}'"></div>
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
          <div class="cart-thumb"><img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='${productFallback(item)}'"></div>
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
  if(deliveryForm){
    const savedContainer=document.getElementById("savedAddresses");
    if(savedContainer){
      const saved=read("buyfarm_saved_addresses",[]);
      if(saved.length){
        savedContainer.innerHTML=saved.map((address,index)=>`<button class="saved-address" type="button" data-saved="${index}">${address.name||"Saved"} · ${address.pincode}</button>`).join("");
        savedContainer.querySelectorAll("[data-saved]").forEach(button=>{
          button.addEventListener("click",()=>{
            const address=saved[Number(button.dataset.saved)];
            deliveryForm.querySelector('[name="name"]').value=address.name||"";
            deliveryForm.querySelector('[name="phone"]').value=address.phone||"";
            deliveryForm.querySelector('[name="address"]').value=address.address||"";
            deliveryForm.querySelector('[name="pincode"]').value=address.pincode||"";
            toast("Saved address loaded");
          });
        });
      }
    }
    document.querySelectorAll("[data-city]").forEach(button=>{
      button.addEventListener("click",()=>{
        const address=deliveryForm.querySelector('[name="address"]');
        if(address)address.value=`${button.dataset.city}, `;
        address?.focus();
      });
    });
    const locationButton=document.getElementById("locationButton");
    if(locationButton&&navigator.geolocation){
      locationButton.addEventListener("click",()=>{
        const status=document.getElementById("locationStatus");
        if(status)status.textContent="Getting your location...";
        navigator.geolocation.getCurrentPosition(position=>{
          const address=deliveryForm.querySelector('[name="address"]');
          if(address)address.value=`Pinned location: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
          if(status)status.textContent="Location pinned successfully.";
          toast("Location pinned");
        },()=>{if(status)status.textContent="Location permission was not available.";});
      });
    }
    deliveryForm.addEventListener("submit",event=>{
    event.preventDefault();
    if(!read(keys.session,null)){
      toast("Sign in required before payment");
      sessionStorage.setItem("buyfarm_return","buyonline.html");
      setTimeout(()=>{      window.location.href="login.html";},350);
      return;
    }
    const data=new FormData(deliveryForm);
    const delivery={name:String(data.get("name")||"").trim(),phone:String(data.get("phone")||"").trim(),address:String(data.get("address")||"").trim(),pincode:String(data.get("pincode")||"").trim()};
    if(!delivery.name||!/^\d{10}$/.test(delivery.phone)||delivery.address.length<5||!/^\d{6}$/.test(delivery.pincode)){toast("Complete valid delivery details");return;}
    const saveAddress=deliveryForm.querySelector('[name="saveAddress"]')?.checked;
    if(saveAddress){
      const saved=read("buyfarm_saved_addresses",[]);
      saved.unshift(delivery);
      write("buyfarm_saved_addresses",saved.slice(0,5));
    }
    write(keys.delivery,delivery);window.location.href="payment.html";
    });
  }

  const loginForm=document.getElementById("loginForm");
  const loginBack=document.getElementById("loginBack");
  if(loginBack)loginBack.addEventListener("click",event=>{
    event.preventDefault();
    if(history.length>1)history.back();else window.location.href="index.html";
  });
  if(loginForm)loginForm.addEventListener("submit",event=>{
    event.preventDefault();
    const data=new FormData(loginForm);
    const email=String(data.get("email")||"").trim();
    const password=String(data.get("password")||"");
    if(!email||password.length<6){toast("Enter a valid email and 6-character password");return;}
    write(keys.session,{email,signedInAt:new Date().toISOString()});
    loginForm.classList.add("login-success");
    const success=document.getElementById("signinSuccess");
    if(success)success.hidden=false;
    toast("Signed in successfully");
    setTimeout(()=>{
      const returnPage=sessionStorage.getItem("buyfarm_return");
      sessionStorage.removeItem("buyfarm_return");
      window.location.href=returnPage||"index.html";
    },900);
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
