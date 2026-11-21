"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { randomUUID } = require("node:crypto");
delete process.env.DATABASE_URL;
process.env.BUYFARM_ADMIN_EMAIL = "asha@example.com";
process.env.BUYFARM_ADMIN_KEY = "a".repeat(43);
delete process.env.RESEND_API_KEY;
delete process.env.RESEND_FROM_EMAIL;
const dbPath=path.join(os.tmpdir(),`buyfarm-smoke-${randomUUID()}.sqlite`);
process.env.BUYFARM_DB_PATH = dbPath;
process.env.NODE_ENV = "development";
const handle = require("../api/handler");

async function request(method, url, input = {}, cookie = "", extraHeaders = {}) {
  const headers = {};
  const req = { method, url, headers: { cookie, ...extraHeaders }, body: input, async *[Symbol.asyncIterator]() {} };
  const res = {
    statusCode: 200,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(value) { this.body = value; }
  };
  await handle(req, res);
  return { status: res.statusCode, data: JSON.parse(res.body || "{}"), headers };
}

(async () => {
 try {
  const health=await request("GET","/api/health");
  assert.equal(health.status,200);
  assert.equal(health.data.ok,true);
  const created = await request("POST", "/api/auth/register", { name:"Asha Farmer", email:"asha@example.com", password:"FreshFarm#2026" });
  assert.equal(created.status, 201);
  assert.equal(created.data.user.password_hash, undefined);
  assert.equal(created.data.isAdmin, true);
  const cookie = created.headers["set-cookie"].split(";")[0];
  assert.ok(cookie.startsWith("buyfarm_session="));
  assert.equal((await request("POST", "/api/auth/register", { name:"Asha Farmer", email:"ASHA@example.com", password:"FreshFarm#2026" })).status, 409);
  const account = await request("GET", "/api/auth/me", {}, cookie);
  assert.equal(account.data.user.email, "asha@example.com");
  const persistedCheck=spawnSync(process.execPath,["-e",`const h=require('./api/handler');const req={method:'GET',url:'/api/auth/me',headers:{cookie:process.env.SMOKE_COOKIE},async *[Symbol.asyncIterator](){}};const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(b){this.body=b}};h(req,res).then(()=>process.stdout.write(res.body));`],{cwd:path.resolve(__dirname,".."),encoding:"utf8",env:{...process.env,SMOKE_COOKIE:cookie}});
  assert.equal(persistedCheck.status,0,persistedCheck.stderr);
  assert.equal(JSON.parse(persistedCheck.stdout).user.email,"asha@example.com");
  const favorite = await request("POST", "/api/wishlist", { productId:3 }, cookie);
  assert.equal(favorite.status, 200);
  assert.deepEqual((await request("GET", "/api/wishlist", {}, cookie)).data.productIds, [3]);
  assert.equal((await request("DELETE", "/api/wishlist?productId=3", {}, cookie)).status, 200);
  assert.deepEqual((await request("GET", "/api/wishlist", {}, cookie)).data.productIds, []);
  await request("POST", "/api/wishlist", { productId:3 }, cookie);
  const savedAddress = await request("POST", "/api/addresses", { name:"Asha Farmer", phone:"9876543210", address:"12 Farm Road, Pune", pincode:"411001", label:"Home" }, cookie);
  assert.equal(savedAddress.status, 201);
  const address=(await request("GET", "/api/addresses", {}, cookie)).data.addresses[0];
  assert.equal(address.pincode, "411001");
  assert.equal((await request("DELETE", `/api/addresses/${address.id}`, {}, cookie)).status, 200);
  assert.equal((await request("GET", "/api/addresses", {}, cookie)).data.addresses.length, 0);
  process.env.RESEND_API_KEY = "test_resend_key";
  process.env.RESEND_FROM_EMAIL = "BuyFarm <orders@example.com>";
  const originalFetch = global.fetch;
  let sentEmail;
  global.fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    sentEmail = { headers:options.headers, body:JSON.parse(options.body) };
    return new Response("{}", {status:200});
  };
  const placed = await request("POST", "/api/orders", { payment:"UPI", delivery:{name:"Asha Farmer",phone:"9876543210",address:"12 Farm Road, Pune",pincode:"411001"}, items:[{id:3,quantity:2},{id:1,quantity:1}] }, cookie);
  global.fetch = originalFetch;
  assert.equal(placed.status, 201);
  assert.equal(placed.data.order.total, 370);
  assert.equal(sentEmail.body.to[0], "asha@example.com");
  assert.match(sentEmail.headers.Authorization, /^Bearer test_resend_key$/);
  assert.match(sentEmail.body.html, /Asha Farmer/);
  assert.doesNotMatch(sentEmail.body.html, /9876543210|12 Farm Road/);
  assert.equal((await request("GET", "/api/orders", {}, cookie)).data.orders.length, 1);
  assert.equal((await request("POST", "/api/orders", { payment:"UPI", delivery:{}, items:[{id:3,quantity:1}] }, cookie)).status, 400);
  const ownerHeaders={"x-buyfarm-admin-key":process.env.BUYFARM_ADMIN_KEY};
  const adminOrders=await request("GET","/api/admin/orders",{},cookie,ownerHeaders);
  assert.equal(adminOrders.status,200);
  assert.equal(adminOrders.data.orders.length,1);
  assert.equal(adminOrders.data.orders[0].delivery.phone,"9876543210");
  assert.equal(adminOrders.data.emailAlertsConfigured,true);
  const changed=await request("PATCH",`/api/admin/orders/${placed.data.order.id}`,{status:"Confirmed"},cookie,ownerHeaders);
  assert.equal(changed.status,200);
  assert.equal(changed.data.order.status,"Confirmed");
  assert.equal((await request("PATCH",`/api/admin/orders/${placed.data.order.id}`,{status:"Hacked"},cookie,ownerHeaders)).status,400);
  assert.equal((await request("GET","/api/admin/orders",{},cookie)).status,403);
  const other=await request("POST","/api/auth/register",{name:"Farm Customer",email:"customer@example.com",password:"FreshFarm#2026"});
  const otherCookie=other.headers["set-cookie"].split(";")[0];
  assert.equal((await request("GET","/api/admin/orders",{},otherCookie,ownerHeaders)).status,403);
  assert.equal((await request("GET","/api/orders",{},otherCookie)).data.orders.length,0);
  global.fetch = async () => new Response("email provider unavailable", {status:503});
  const originalWarn=console.warn;
  console.warn=()=>{};
  const savedWithoutEmail=await request("POST","/api/orders",{payment:"UPI",delivery:{name:"Asha Farmer",phone:"9876543210",address:"12 Farm Road, Pune",pincode:"411001"},items:[{id:9,quantity:1}]},cookie);
  console.warn=originalWarn;
  global.fetch=originalFetch;
  assert.equal(savedWithoutEmail.status,201);
  assert.equal((await request("GET","/api/orders",{},cookie)).data.orders.length,2);
  const contact = await request("POST", "/api/contact", { name:"Asha Farmer",email:"asha@example.com",message:"Please tell me when oranges arrive." }, cookie);
  assert.equal(contact.status, 201);
  const signedIn = await request("POST", "/api/auth/login", { email:"asha@example.com",password:"FreshFarm#2026" });
  assert.equal(signedIn.status, 200);
  assert.equal((await request("POST", "/api/auth/login", { email:"asha@example.com",password:"wrong-password" })).status, 401);
  const logout=await request("POST", "/api/auth/logout", {}, cookie);
  assert.match(logout.headers["set-cookie"],/Max-Age=0/);
  assert.equal((await request("GET", "/api/auth/me", {}, cookie)).status, 401);
  console.log("API checks passed: health, customer auth and storage, wishlist, addresses, customer-scoped orders, owner-only order management, status changes, and mocked Resend notifications.");
 } finally {
  await handle.close();
  for(const suffix of ["","-wal","-shm"])try{fs.rmSync(dbPath+suffix,{force:true});}catch{}
 }
})().catch(error => { console.error(error); process.exitCode=1; });
