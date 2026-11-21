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

  const keys={cart:"buyfarm_cart",delivery:"buyfarm_delivery"};
  const returnPages=new Set(["index.html","products.html","productsfruits.html","productsgrains.html","productsvegetables.html","buyonline.html","payment.html","orders.html","account.html","wishlist.html","admin.html"]);
  const safeReturnPage=(fallback="account.html")=>{const page=sessionStorage.getItem("buyfarm_return");sessionStorage.removeItem("buyfarm_return");return returnPages.has(page)?page:fallback;};
  const read=(key,fallback)=>{try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}catch{return fallback;}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const cart=()=>{const saved=read(keys.cart,[]);if(!Array.isArray(saved))return [];return saved.map(item=>{const product=products.find(entry=>entry.id===Number(item.id)),quantity=Number(item.quantity);return product&&Number.isInteger(quantity)&&quantity>0?{...product,quantity}:null;}).filter(Boolean);};
  const saveCart=value=>write(keys.cart,value);
  const money=value=>`₹${Number(value).toLocaleString("en-IN")}`;
  const api=async(path,options={})=>{
    const requestedUrl=new URL(path,location.origin),functionUrl=new URL("/api/handler",location.origin);
    functionUrl.searchParams.set("__path",requestedUrl.pathname);
    requestedUrl.searchParams.forEach((value,key)=>functionUrl.searchParams.append(key,value));
    const response=await fetch(functionUrl,{credentials:"same-origin",...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(result.error||"Something went wrong. Please try again.");error.status=response.status;throw error;}
    return result;
  };
  let signedInUser=null;
  let wishlistIds=new Set();
  let accountServiceError="";
  const authReady=api("/api/auth/me").then(result=>{signedInUser={...result.user,is_admin:Boolean(result.isAdmin)};return signedInUser;}).catch(error=>{if(error.status!==401)accountServiceError=error.message;return null;});
  const updateAccountLinks=()=>{
    const link=document.querySelector(".nav-button.primary");
    if(!link)return;
    link.href=signedInUser?"account.html":"login.html";
    link.textContent=signedInUser?"My account":"Sign in";
    let logout=document.getElementById("logoutButton");
    if(signedInUser&&!logout){logout=document.createElement("button");logout.type="button";logout.id="logoutButton";logout.className="nav-button logout-button";logout.textContent="Sign out";link.after(logout);}
    if(!signedInUser&&logout)logout.remove();
    let ownerLink=document.getElementById("ownerDashboardLink");
    if(signedInUser?.is_admin&&!ownerLink){ownerLink=document.createElement("a");ownerLink.id="ownerDashboardLink";ownerLink.className="nav-button owner-nav-link";ownerLink.href="admin.html";ownerLink.textContent="Orders";(document.getElementById("logoutButton")||link).after(ownerLink);}
    if(!signedInUser?.is_admin&&ownerLink)ownerLink.remove();
  };
  authReady.then(async()=>{
    updateAccountLinks();
    if(!signedInUser&&accountServiceError){document.querySelectorAll("[data-account-status]").forEach(status=>{status.textContent="Account storage is temporarily unavailable. Please try again in a moment.";status.hidden=false;});}
    if(signedInUser){try{const result=await api("/api/wishlist");wishlistIds=new Set(result.productIds);document.querySelectorAll("[data-wishlist]").forEach(button=>setWishlistButton(button,wishlistIds.has(Number(button.dataset.wishlist))));}catch{}}
    if(location.pathname.endsWith("payment.html")){
      if(!signedInUser){sessionStorage.setItem("buyfarm_return","buyonline.html");location.replace("login.html");}
      else if(!cart().length)location.replace("products.html");
      else if(!read(keys.delivery,null))location.replace("buyonline.html");
    }
  });

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

  // Product filtering and search share one state so either control can be used
  // without unexpectedly clearing the other.
  let activeCategory="All";
  const filterProducts=()=>{
    const query=(document.getElementById("searchInput")?.value||"").trim().toLowerCase();
    const filtered=products.filter(product=>(activeCategory==="All"||product.category===activeCategory)&&`${product.name} ${product.category}`.toLowerCase().includes(query));
    renderProducts("shopProducts",filtered);
    const empty=document.getElementById("noProducts");
    if(empty)empty.hidden=filtered.length>0;
  };

  const cartButton=document.getElementById("cartButton");
  if(cartButton){
    const count=cartButton.querySelector(".count");
    cartButton.innerHTML=`<span class="cart-symbol" aria-hidden="true">🛒</span> Cart ${count?`<span class="count" id="cartCount">${count.textContent}</span>`:"<span class=\"count\" id=\"cartCount\">0</span>"}`;
  }

  const setWishlistButton=(button,saved)=>{button.setAttribute("aria-pressed",String(saved));button.textContent=saved?"♥":"♡";button.setAttribute("aria-label",`${saved?"Remove":"Save"} ${products.find(item=>item.id===Number(button.dataset.wishlist))?.name||"product"} ${saved?"from":"to"} your wishlist`);};

  document.querySelectorAll(".main-nav a").forEach(link=>{
    const currentPage=decodeURIComponent(location.pathname.split("/").pop());
    if(link.pathname===location.pathname||link.getAttribute("href")===currentPage||(currentPage.startsWith("products")&&link.getAttribute("href")==="products.html")){
      link.classList.add("active");
    }
  });

  const renderProducts=(targetId,items)=>{
    const target=document.getElementById(targetId);
    if(!target)return;
    target.innerHTML=items.map(product=>`
      <article class="product-card" data-category="${product.category}">
        <div class="product-visual"><img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.onerror=null;this.src='${productFallback(product)}'"><button type="button" class="wishlist-button" data-wishlist="${product.id}" aria-label="${wishlistIds.has(product.id)?`Remove ${product.name} from your wishlist`:`Save ${product.name} to your wishlist`}" aria-pressed="${wishlistIds.has(product.id)}">${wishlistIds.has(product.id)?"♥":"♡"}</button></div>
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
  renderProducts("orderRecommendations",products.slice(0,4));

  const categoryGrid=document.getElementById("categoryProducts");
  if(categoryGrid)renderProducts("categoryProducts",products.filter(product=>product.category===categoryGrid.dataset.category));

  const search=document.getElementById("searchInput");
  if(search)search.addEventListener("input",filterProducts);

  document.querySelectorAll(".filter").forEach(filter=>{
    filter.addEventListener("click",()=>{
      document.querySelectorAll(".filter").forEach(button=>button.classList.remove("active"));
      filter.classList.add("active");
      activeCategory=filter.dataset.category;
      filterProducts();
    });
  });

  document.addEventListener("click",async event=>{
    const favorite=event.target.closest("[data-wishlist]");
    if(favorite){
      await authReady;
      if(!signedInUser){sessionStorage.setItem("buyfarm_return",location.pathname.split("/").pop()||"index.html");location.href="login.html";return;}
      const id=Number(favorite.dataset.wishlist),saved=wishlistIds.has(id);
      try{await api(`/api/wishlist${saved?`?productId=${id}`:""}`,saved?{method:"DELETE"}:{method:"POST",body:JSON.stringify({productId:id})});if(saved)wishlistIds.delete(id);else wishlistIds.add(id);document.querySelectorAll(`[data-wishlist="${id}"]`).forEach(button=>setWishlistButton(button,!saved));if(location.pathname.endsWith("wishlist.html")&&saved){const grid=document.getElementById("wishlistProducts");grid?.querySelector(`[data-wishlist="${id}"]`)?.closest(".product-card")?.remove();const empty=document.getElementById("wishlistEmpty");if(grid&&!grid.children.length){grid.hidden=true;if(empty)empty.hidden=false;}}toast(saved?"Removed from your wishlist":"Saved to your wishlist");}catch(error){toast(error.message);}
      return;
    }
    if(event.target.closest("#logoutButton")){
      try{await api("/api/auth/logout",{method:"POST",body:"{}"});signedInUser=null;wishlistIds.clear();document.querySelectorAll("[data-wishlist]").forEach(button=>setWishlistButton(button,false));updateAccountLinks();toast("You’re signed out");if(["account.html","orders.html","wishlist.html","admin.html"].includes(location.pathname.split("/").pop()))location.href="index.html";}catch(error){toast(error.message);}return;
    }
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
    if(event.target.closest("#cartButton")){const panel=document.getElementById("cartBackdrop");if(panel)panel.hidden=false;}
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

  const checkoutLineItems=document.getElementById("checkoutLineItems");
  if(checkoutLineItems){
    const items=cart();
    checkoutLineItems.innerHTML=items.length?items.map(item=>`<div class="checkout-line"><span>${item.name} <small>× ${item.quantity}</small></span><strong>${money(item.price*item.quantity)}</strong></div>`).join(""):'<div class="empty-cart">Your basket is empty. <a href="products.html">Shop fresh produce</a>.</div>';
    const total=document.getElementById("checkoutGrandTotal");if(total)total.textContent=money(items.reduce((sum,item)=>sum+item.price*item.quantity,0));
  }

  const backdrop=document.getElementById("cartBackdrop");
  if(backdrop)backdrop.addEventListener("click",event=>{if(event.target===backdrop)backdrop.hidden=true;});
  document.querySelectorAll("[data-close-cart]").forEach(button=>button.addEventListener("click",()=>{document.getElementById("cartBackdrop").hidden=true;}));

  const checkout=document.getElementById("checkoutButton");
  if(checkout)checkout.addEventListener("click",()=>{
    if(!cart().length){toast("Add a product to your cart first");return;}
    document.getElementById("cartBackdrop").hidden=true;
    window.location.href="buyonline.html";
  });

  const contactForm=document.getElementById("contactForm");
  if(contactForm)contactForm.addEventListener("submit",async event=>{event.preventDefault();const data=new FormData(contactForm),submit=contactForm.querySelector('[type="submit"]');if(submit)submit.disabled=true;try{const result=await api("/api/contact",{method:"POST",body:JSON.stringify({name:data.get("name"),email:data.get("email"),message:data.get("message")})});contactForm.reset();toast(`Message saved · reference ${result.reference}`);}catch(error){toast(error.message);}finally{if(submit)submit.disabled=false;}});

  const deliveryForm=document.getElementById("deliveryForm");
  if(deliveryForm){
    const savedContainer=document.getElementById("savedAddresses");
    const paintAddresses=addresses=>{
      if(!savedContainer)return;
      savedContainer.replaceChildren();
      if(!addresses.length){const empty=document.createElement("p");empty.className="muted";empty.textContent="Saved addresses will appear here after you sign in.";savedContainer.append(empty);return;}
      addresses.forEach(address=>{const button=document.createElement("button");button.className="saved-address";button.type="button";button.textContent=`${address.label||"Saved"} · ${address.pincode}`;button.addEventListener("click",()=>{deliveryForm.querySelector('[name="name"]').value=address.name||"";deliveryForm.querySelector('[name="phone"]').value=address.phone||"";deliveryForm.querySelector('[name="address"]').value=address.address||"";deliveryForm.querySelector('[name="pincode"]').value=address.pincode||"";toast("Saved address loaded");});savedContainer.append(button);});
    };
    authReady.then(async()=>{if(!signedInUser)return;try{paintAddresses((await api("/api/addresses")).addresses);}catch(error){toast(error.message);}});
    document.querySelectorAll("[data-city]").forEach(button=>{
      button.addEventListener("click",()=>{
        document.querySelectorAll("[data-city]").forEach(chip=>chip.classList.remove("active"));
        button.classList.add("active");
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
    deliveryForm.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!cart().length){toast("Your cart is empty. Add products before checkout.");window.location.href="products.html";return;}
    await authReady;
    if(!signedInUser){
      toast("Sign in required before payment");
      sessionStorage.setItem("buyfarm_return","buyonline.html");
      setTimeout(()=>{      window.location.href="login.html";},350);
      return;
    }
    const data=new FormData(deliveryForm);
    const delivery={name:String(data.get("name")||"").trim(),phone:String(data.get("phone")||"").trim(),address:String(data.get("address")||"").trim(),pincode:String(data.get("pincode")||"").trim()};
    if(!delivery.name||!/^\d{10}$/.test(delivery.phone)||delivery.address.length<5||!/^\d{6}$/.test(delivery.pincode)){toast("Complete valid delivery details");return;}
    const saveAddress=deliveryForm.querySelector('[name="saveAddress"]')?.checked;
    if(saveAddress){try{await api("/api/addresses",{method:"POST",body:JSON.stringify({name:delivery.name,phone:delivery.phone,address:delivery.address,pincode:delivery.pincode,label:"Delivery"})});}catch(error){toast(error.message);return;}}
    write(keys.delivery,delivery);window.location.href="payment.html";
    });
  }

  const loginForm=document.getElementById("loginForm");
  if(loginForm)loginForm.addEventListener("submit",async event=>{
    event.preventDefault();
    const data=new FormData(loginForm);
    const email=String(data.get("email")||"").trim();
    const password=String(data.get("password")||"");
    const submit=loginForm.querySelector('[type="submit"]');
    if(submit)submit.disabled=true;
    try{const result=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});signedInUser={...result.user,is_admin:Boolean(result.isAdmin)};updateAccountLinks();document.getElementById("signinSuccess")?.removeAttribute("hidden");toast("Welcome back to BuyFarm");setTimeout(()=>{location.href=safeReturnPage();},500);}catch(error){toast(error.message);if(submit)submit.disabled=false;}
  });

  const registerForm=document.getElementById("registerForm");
  if(registerForm){
    const password=registerForm.elements.password;
    const strength=registerForm.querySelector("[data-password-strength]");
    password?.addEventListener("input",()=>{const score=(password.value.length>=10)+( /[A-Z]/.test(password.value) && /[a-z]/.test(password.value)) + /[0-9\W]/.test(password.value);registerForm.querySelectorAll(".password-meter i").forEach((bar,index)=>bar.classList.toggle("filled",index<score));if(strength)strength.textContent=score>=3?"Strong password":score===2?"Good start — add another character type":"Use 10 or more characters";});
    registerForm.addEventListener("submit",async event=>{
      event.preventDefault();const data=new FormData(registerForm);const name=String(data.get("name")||"").trim(),email=String(data.get("email")||"").trim(),secret=String(data.get("password")||""),confirm=String(data.get("confirmPassword")||"");
      if(secret!==confirm){toast("Your passwords do not match.");registerForm.elements.confirmPassword.focus();return;}
      const submit=registerForm.querySelector('[type="submit"]');if(submit)submit.disabled=true;
      try{const result=await api("/api/auth/register",{method:"POST",body:JSON.stringify({name,email,password:secret})});signedInUser={...result.user,is_admin:Boolean(result.isAdmin)};updateAccountLinks();toast("Your BuyFarm account is ready");setTimeout(()=>{location.href=safeReturnPage();},500);}catch(error){toast(error.message);if(submit)submit.disabled=false;}
    });
  }
  document.querySelectorAll("[data-toggle-password]").forEach(button=>button.addEventListener("click",()=>{const input=button.closest(".password-field")?.querySelector("input");if(!input)return;const reveal=input.type==="password";input.type=reveal?"text":"password";button.textContent=reveal?"Hide":"Show";button.setAttribute("aria-label",`${reveal?"Hide":"Show"} password`);}));

  const paymentForm=document.getElementById("paymentForm");
  if(paymentForm)paymentForm.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!cart().length){toast("Your cart is empty. Add products before placing an order.");return;}
    if(!read(keys.delivery,null)){toast("Add your delivery details first.");window.location.href="buyonline.html";return;}
    await authReady;
    if(!signedInUser){sessionStorage.setItem("buyfarm_return","buyonline.html");location.href="login.html";return;}
    const data=new FormData(paymentForm);
    const method=String(data.get("payment")||"");
    if(!method){toast("Select a payment method");return;}
    const submit=paymentForm.querySelector('[type="submit"]');if(submit)submit.disabled=true;
    try{const result=await api("/api/orders",{method:"POST",body:JSON.stringify({payment:method,delivery:read(keys.delivery,null),items:cart().map(({id,quantity})=>({id,quantity}))})});saveCart([]);write(keys.delivery,null);location.href=`payend.html?order=${encodeURIComponent(result.order.id)}`;}catch(error){toast(error.message);if(submit)submit.disabled=false;}
  });

  const ordersTarget=document.getElementById("ordersList");
  if(ordersTarget){
    (async()=>{await authReady;if(!signedInUser){sessionStorage.setItem("buyfarm_return","orders.html");location.replace("login.html");return;}try{const {orders}=await api("/api/orders");ordersTarget.replaceChildren();if(!orders.length){ordersTarget.innerHTML='<div class="empty-state orders-empty"><span>📦</span><h2>Your next favorite basket starts here.</h2><p>When you place an order, you’ll find its details and delivery address here.</p><a class="button primary" href="products.html">Shop the harvest</a></div>';return;}orders.forEach(order=>{const card=document.createElement("article");card.className="order-card order-detail-card";const info=document.createElement("div"),id=document.createElement("strong"),detail=document.createElement("p"),date=new Date(order.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),items=Array.isArray(order.items)?order.items:[];id.textContent=`Order ${order.id.slice(0,8).toUpperCase()}`;detail.textContent=`${items.reduce((sum,item)=>sum+item.quantity,0)} items · ${date} · ${money(order.total)}`;info.append(id,detail);const status=document.createElement("span");status.className="order-status";status.textContent=order.status;card.append(info,status);ordersTarget.append(card);});}catch(error){ordersTarget.innerHTML=`<div class="empty-state">${error.message}</div>`;}})();
  }

  const accountName=document.getElementById("accountName"),accountEmail=document.getElementById("accountEmail"),accountAddresses=document.getElementById("accountAddresses");
  if(accountName||accountEmail||accountAddresses){
    (async()=>{await authReady;if(!signedInUser){sessionStorage.setItem("buyfarm_return","account.html");location.replace("login.html");return;}if(accountName)accountName.textContent=signedInUser.full_name.split(/\s+/)[0];if(accountEmail)accountEmail.textContent=signedInUser.email;try{const result=await api("/api/addresses");if(accountAddresses)paintAddressBook(accountAddresses,result.addresses);}catch(error){if(accountAddresses)accountAddresses.textContent=error.message;}})();
  }
  const paintAddressBook=(container,addresses)=>{
    container.replaceChildren();
    if(!addresses.length){const empty=document.createElement("article");empty.className="address-book-card address-empty";empty.innerHTML='<span class="account-icon">📍</span><strong>No saved delivery places yet</strong><small>Add an address below to make checkout quicker.</small>';container.append(empty);return;}
    addresses.forEach(address=>{const card=document.createElement("article");card.className="address-book-card";const label=document.createElement("span"),name=document.createElement("strong"),line=document.createElement("p"),phone=document.createElement("small"),remove=document.createElement("button");label.className="address-label";label.textContent=address.label||"Saved";name.textContent=address.name;line.textContent=`${address.address}, ${address.pincode}`;phone.textContent=address.phone;remove.type="button";remove.className="address-remove";remove.textContent="Remove";remove.addEventListener("click",async()=>{try{await api(`/api/addresses/${encodeURIComponent(address.id)}`,{method:"DELETE"});const updated=await api("/api/addresses");paintAddressBook(container,updated.addresses);toast("Address removed");}catch(error){toast(error.message);}});card.append(label,name,line,phone,remove);container.append(card);});
  };
  const accountAddressForm=document.getElementById("accountAddressForm");
  if(accountAddressForm)accountAddressForm.addEventListener("submit",async event=>{event.preventDefault();await authReady;if(!signedInUser){location.href="login.html";return;}const data=new FormData(accountAddressForm);try{await api("/api/addresses",{method:"POST",body:JSON.stringify({name:data.get("name"),phone:data.get("phone"),address:data.get("address"),pincode:data.get("pincode"),label:data.get("label")})});const result=await api("/api/addresses");paintAddressBook(accountAddresses,result.addresses);accountAddressForm.reset();accountAddressForm.elements.label.value="Home";toast("Delivery address saved");}catch(error){toast(error.message);}});

  const wishlistTarget=document.getElementById("wishlistProducts");
  if(wishlistTarget){(async()=>{await authReady;if(!signedInUser){sessionStorage.setItem("buyfarm_return","wishlist.html");location.replace("login.html");return;}try{const result=await api("/api/wishlist");wishlistIds=new Set(result.productIds);const saved=products.filter(product=>wishlistIds.has(product.id));renderProducts("wishlistProducts",saved);const empty=document.getElementById("wishlistEmpty");if(empty)empty.hidden=saved.length>0;wishlistTarget.hidden=!saved.length;}catch(error){toast(error.message);}})();}

  if(window.location.pathname.endsWith("payend.html")){
    const params=new URLSearchParams(window.location.search);
    const heading=document.getElementById("confirmedOrder");
    const reference=document.getElementById("orderReference"),total=document.getElementById("orderTotal");
    if(params.get("order"))authReady.then(async()=>{if(!signedInUser){location.replace("login.html");return;}try{const {orders}=await api("/api/orders"),order=orders.find(item=>item.id===params.get("order"));if(!order){if(heading)heading.textContent="Your order is saved";if(reference)reference.textContent=params.get("order").slice(0,8).toUpperCase();return;}if(heading)heading.textContent="Your order is in!";if(reference)reference.textContent=order.id.slice(0,8).toUpperCase();if(total)total.textContent=money(order.total);}catch(error){if(reference)reference.textContent="Saved to your account";toast(error.message);}});
  }
})();
