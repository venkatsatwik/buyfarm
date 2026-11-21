"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { promisify } = require("node:util");
const scrypt = promisify(crypto.scrypt);

const SESSION_COOKIE = "buyfarm_session";
const SESSION_DAYS = 30;
const storageMode = process.env.DATABASE_URL ? "postgres" : process.env.VERCEL ? "unconfigured" : "sqlite";
let pool;
let sqlite;
if(storageMode === "sqlite"){
  const { DatabaseSync } = require("node:sqlite");
  const databasePath=process.env.BUYFARM_DB_PATH||path.join(__dirname,"..",".data","buyfarm.sqlite");
  if(databasePath!==":memory:")fs.mkdirSync(path.dirname(databasePath),{recursive:true});
  sqlite=new DatabaseSync(databasePath);
  sqlite.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
  pool={query:async(text,values=[])=>{
    const sql=String(text).replace(/\$(\d+)/g,"?$1").replace(/\bnow\(\)/gi,"CURRENT_TIMESTAMP");
    const bindings=values.map(value=>value instanceof Date?value.toISOString():value);
    if(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql)||/\bRETURNING\b/i.test(sql)){
      const rows=sqlite.prepare(sql).all(...bindings);
      return {rows,rowCount:rows.length};
    }
    const result=sqlite.prepare(sql).run(...bindings);
    return {rows:[],rowCount:Number(result.changes)};
  }};
}else if(storageMode === "postgres"){
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
    max: 5,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: process.env.NODE_ENV !== "production"
  });
}

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL,
  email TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home', full_name TEXT NOT NULL, phone TEXT NOT NULL,
  address TEXT NOT NULL, pincode TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS wishlist (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL, total INTEGER NOT NULL CHECK (total >= 0), payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Placed', delivery JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
let schemaReady;
const ensureSchema = () => schemaReady ||= (storageMode === "sqlite" ? (()=>{
  const sqliteSchema=schemaSql.replace(/\bUUID\b/gi,"TEXT").replace(/\bTIMESTAMPTZ\b/gi,"TEXT").replace(/\bJSONB\b/gi,"TEXT").replace(/DEFAULT\s+gen_random_uuid\(\)/gi,"DEFAULT (lower(hex(randomblob(16))))").replace(/DEFAULT\s+now\(\)/gi,"DEFAULT CURRENT_TIMESTAMP");
  sqlite.exec(sqliteSchema);
  return Promise.resolve();
})() : pool.query(schemaSql)).then(() => pool.query("DELETE FROM sessions WHERE expires_at < now()")).catch(error => { schemaReady = null; throw error; });

const catalog = new Map([
  [1,["Cocoa",190]],[2,["Brown Rice",130]],[3,["Red Apples",90]],[4,["Basmati Rice",70]],
  [5,["Corn",50]],[6,["Oats",170]],[7,["Soy Beans",40]],[8,["Quinoa",170]],
  [9,["Oranges",85]],[10,["Bananas",127]],[11,["Strawberries",19]],[12,["Blueberries",490]],
  [13,["Tomatoes",45]],[14,["Potatoes",127]],[15,["Carrots",78]],[16,["Onions",55]],
  [17,["Cabbage",12]],[18,["Broccoli",55]],[19,["Spinach",24]],[20,["Cucumbers",32]]
]);

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1024 * 64) throw Object.assign(new Error("Request is too large."), { status: 413 });
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error("Invalid JSON request."), { status: 400 }); }
}

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map(part => {
    const at = part.indexOf("=");
    return at < 0 ? ["", ""] : [part.slice(0, at).trim(), decodeURIComponent(part.slice(at + 1).trim())];
  }));
}
function setSessionCookie(req, res, token) {
  const secure = process.env.NODE_ENV === "production" || req.headers["x-forwarded-proto"] === "https";
  const flags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? "; Secure" : ""}`;
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${flags}`);
}
function clearSessionCookie(req, res) {
  const secure = process.env.NODE_ENV === "production" || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
}
function tokenHash(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
function emailValid(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
function decodeJson(value) { if(typeof value!=="string")return value;try{return JSON.parse(value);}catch{return value;} }
const orderStatuses = new Set(["Placed","Confirmed","Preparing","Out for delivery","Delivered","Cancelled"]);
function adminEmailConfigured() { return emailValid(String(process.env.BUYFARM_ADMIN_EMAIL || "")); }
function adminKeyConfigured() { return /^[A-Za-z0-9_-]{43,}$/.test(String(process.env.BUYFARM_ADMIN_KEY || "")); }
function adminKeyMatches(req) {
  const expected=String(process.env.BUYFARM_ADMIN_KEY || ""),provided=String(req.headers["x-buyfarm-admin-key"] || "");
  if(!adminKeyConfigured()||provided.length!==expected.length)return false;
  return crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(expected));
}
function ownerEmailMatches(user) { return adminEmailConfigured() && String(user.email).toLowerCase()===String(process.env.BUYFARM_ADMIN_EMAIL).trim().toLowerCase(); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[character])); }
async function sendOrderNotification(order,user) {
  if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL||!adminEmailConfigured())return;
  const items=decodeJson(order.items)||[];
  const itemRows=items.map(item=>`<tr><td style="padding:8px;border-bottom:1px solid #e5ece5">${escapeHtml(item.name)} × ${Number(item.quantity)||0}</td><td style="padding:8px;border-bottom:1px solid #e5ece5;text-align:right">₹${(Number(item.price)||0).toLocaleString("en-IN")}</td></tr>`).join("");
  const orderRef=String(order.id).slice(0,8).toUpperCase();
  const html=`<div style="font-family:Arial,sans-serif;color:#183e28;max-width:600px;margin:auto"><p style="color:#2d7a4b;font-weight:bold;letter-spacing:.12em">BUYFARM · NEW ORDER</p><h1 style="font-size:26px">Order ${escapeHtml(orderRef)} received</h1><p>${escapeHtml(user.full_name)} (${escapeHtml(user.email)}) placed an order.</p><table style="width:100%;border-collapse:collapse">${itemRows}<tr><td style="padding:12px 8px;font-weight:bold">Total</td><td style="padding:12px 8px;text-align:right;font-weight:bold">₹${(Number(order.total)||0).toLocaleString("en-IN")}</td></tr></table><p>Payment method: ${escapeHtml(order.payment_method)}</p><p>Open the BuyFarm owner dashboard to view delivery details and update its status.</p></div>`;
  try {
    const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[process.env.BUYFARM_ADMIN_EMAIL],subject:`BuyFarm order ${orderRef} · ₹${Number(order.total)||0}`,html}),signal:AbortSignal.timeout(5000)});
    if(!response.ok)console.warn("BuyFarm order email was not accepted by Resend (HTTP",response.status+").");
  } catch { console.warn("BuyFarm order email could not be delivered; the order remains saved in the owner dashboard."); }
}

async function currentUser(req) {
  const token = cookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const result = await pool.query(
    "SELECT u.id, u.full_name, u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [tokenHash(token)]
  );
  return result.rows[0] || null;
}
async function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiry = new Date(Date.now() + SESSION_DAYS * 86400000);
  await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", [tokenHash(token), userId, expiry]);
  setSessionCookie(req, res, token);
}
async function passwordHash(password, salt) {
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return key.toString("hex");
}

function parsePath(req) {
  try { return new URL(req.url, "http://buyfarm.local"); } catch { return new URL("/", "http://buyfarm.local"); }
}
function validAddress(input) {
  return input && typeof input === "object" && String(input.fullName || input.name || "").trim().length >= 2 &&
    /^\d{10}$/.test(String(input.phone || "").replace(/\D/g, "")) &&
    String(input.address || "").trim().length >= 5 && /^\d{6}$/.test(String(input.pincode || ""));
}

async function route(req, res) {
  const url = parsePath(req);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const method = req.method || "GET";
  if (method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
  try {
    if (path === "/api/health" && method === "GET") {
      if(storageMode === "unconfigured")return send(res,503,{ok:false,error:"Set DATABASE_URL in the hosting environment before enabling account storage."});
      if(storageMode === "sqlite")return send(res,200,{ok:true,database:"local SQLite"});
      try{await pool.query("SELECT 1");return send(res,200,{ok:true,database:"connected"});}
      catch{return send(res,503,{ok:false,error:"BuyFarm could not reach PostgreSQL. Check DATABASE_URL and start the database."});}
    }
    if(storageMode === "unconfigured")return send(res,503,{error:"PostgreSQL is required for account and order storage on the hosting platform. Set DATABASE_URL."});
    await ensureSchema();

    if (path === "/api/contact" && method === "POST") {
      const input = await body(req);
      const name=String(input.name||"").trim(), email=String(input.email||"").trim().toLowerCase(), message=String(input.message||"").trim();
      if(name.length<2||name.length>80||!emailValid(email)||message.length<10||message.length>4000) return send(res,400,{error:"Enter your name, a valid email, and a message of at least 10 characters."});
      const user=await currentUser(req);
      const result=await pool.query("INSERT INTO contact_messages(user_id,name,email,message) VALUES($1,$2,$3,$4) RETURNING id",[user?.id||null,name,email,message]);
      return send(res,201,{ok:true,reference:result.rows[0].id.slice(0,8).toUpperCase()});
    }

    if (path === "/api/auth/register" && method === "POST") {
      const input = await body(req);
      const name = String(input.name || "").trim();
      const email = String(input.email || "").trim().toLowerCase();
      const password = String(input.password || "");
      if (name.length < 2 || name.length > 80) return send(res, 400, { error: "Enter your name (2–80 characters)." });
      if (!emailValid(email)) return send(res, 400, { error: "Enter a valid email address." });
      if (password.length < 10 || password.length > 128) return send(res, 400, { error: "Use a password with 10–128 characters." });
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = await passwordHash(password, salt);
      let created;
      try {
        created = await pool.query("INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id,full_name,email", [name,email,`${salt}:${hash}`]);
      } catch (error) {
        if (error.code === "23505" || error.errcode === 2067 || /UNIQUE constraint failed/i.test(error.message||"")) return send(res, 409, { error: "An account with this email already exists. Sign in instead." });
        throw error;
      }
      await createSession(req, res, created.rows[0].id);
      return send(res, 201, { user: created.rows[0], isAdmin: ownerEmailMatches(created.rows[0]) });
    }

    if (path === "/api/auth/login" && method === "POST") {
      const input = await body(req);
      const email = String(input.email || "").trim().toLowerCase();
      const password = String(input.password || "");
      if(!emailValid(email)||password.length>128)return send(res,401,{error:"Email or password is incorrect."});
      const result = await pool.query("SELECT id,full_name,email,password_hash FROM users WHERE lower(email)=lower($1)", [email]);
      const user = result.rows[0];
      const [salt, expected] = user?.password_hash.split(":") || ["", ""];
      const actual = user ? await passwordHash(password, salt) : await passwordHash(password || "invalid", "00000000000000000000000000000000");
      const ok = Boolean(user && expected.length === actual.length && crypto.timingSafeEqual(Buffer.from(expected,"hex"), Buffer.from(actual,"hex")));
      if (!ok) return send(res, 401, { error: "Email or password is incorrect." });
      await createSession(req, res, user.id);
      return send(res, 200, { user: { id:user.id, full_name:user.full_name, email:user.email }, isAdmin: ownerEmailMatches(user) });
    }

    if (path === "/api/auth/logout" && method === "POST") {
      const token = cookies(req)[SESSION_COOKIE];
      if (token) await pool.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash(token)]);
      clearSessionCookie(req, res);
      return send(res, 200, { ok: true });
    }

    if (path === "/api/auth/me" && method === "GET") {
      const user = await currentUser(req);
      return send(res, user ? 200 : 401, user ? { user, isAdmin: ownerEmailMatches(user) } : { error: "Sign in to continue." });
    }

    const user = await currentUser(req);
    if (!user) return send(res, 401, { error: "Sign in to continue." });

    if (path === "/api/admin/orders" || path.startsWith("/api/admin/orders/")) {
      if(!adminEmailConfigured()||!adminKeyConfigured())return send(res,503,{error:"Owner access is not configured. Set BUYFARM_ADMIN_EMAIL and a 32-byte BUYFARM_ADMIN_KEY."});
      if(!ownerEmailMatches(user)||!adminKeyMatches(req))return send(res,403,{error:"This account does not have owner access."});
      if(path === "/api/admin/orders" && method === "GET") {
        const filter=url.searchParams.get("status");
        if(filter && filter!=="all" && !orderStatuses.has(filter))return send(res,400,{error:"Choose a valid order status."});
        const result=await pool.query(
          "SELECT o.id,o.user_id,o.items,o.total,o.payment_method,o.status,o.delivery,o.created_at,u.full_name AS customer_name,u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id WHERE ($1='all' OR o.status=$1) ORDER BY o.created_at DESC LIMIT 250",
          [filter||"all"]
        );
        return send(res,200,{orders:result.rows.map(order=>({...order,items:decodeJson(order.items),delivery:decodeJson(order.delivery)})),statuses:[...orderStatuses],emailAlertsConfigured:Boolean(process.env.RESEND_API_KEY&&process.env.RESEND_FROM_EMAIL)});
      }
      const match=path.match(/^\/api\/admin\/orders\/([a-zA-Z0-9-]{8,64})$/);
      if(match && method === "PATCH") {
        const input=await body(req),status=String(input.status||"");
        if(!orderStatuses.has(status))return send(res,400,{error:"Choose a valid order status."});
        const result=await pool.query("UPDATE orders SET status=$1 WHERE id=$2 RETURNING id,items,total,payment_method,status,delivery,created_at",[status,match[1]]);
        if(!result.rows.length)return send(res,404,{error:"That order could not be found."});
        const order=result.rows[0];
        return send(res,200,{order:{...order,items:decodeJson(order.items),delivery:decodeJson(order.delivery)}});
      }
    }

    if (path === "/api/wishlist" && method === "GET") {
      const result = await pool.query("SELECT product_id FROM wishlist WHERE user_id=$1 ORDER BY created_at DESC", [user.id]);
      return send(res, 200, { productIds: result.rows.map(row => row.product_id) });
    }
    if (path === "/api/wishlist" && (method === "POST" || method === "DELETE")) {
      const input = method === "POST" ? await body(req) : {};
      const id = Number(method === "POST" ? input.productId : url.searchParams.get("productId"));
      if (!catalog.has(id)) return send(res, 400, { error: "Choose a valid product." });
      if (method === "POST") await pool.query("INSERT INTO wishlist(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [user.id,id]);
      else await pool.query("DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2", [user.id,id]);
      return send(res, 200, { ok: true });
    }

    if (path === "/api/addresses" && method === "GET") {
      const result = await pool.query("SELECT id,label,full_name AS name,phone,address,pincode FROM addresses WHERE user_id=$1 ORDER BY created_at DESC", [user.id]);
      return send(res, 200, { addresses: result.rows });
    }
    if (path === "/api/addresses" && method === "POST") {
      const input = await body(req);
      if (!validAddress(input)) return send(res, 400, { error: "Check the name, 10-digit phone, address, and 6-digit pincode." });
      const result = await pool.query("INSERT INTO addresses(user_id,label,full_name,phone,address,pincode) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,label,full_name AS name,phone,address,pincode", [user.id,String(input.label || "Home").slice(0,40),String(input.fullName || input.name).trim(),String(input.phone).replace(/\D/g,""),String(input.address).trim(),String(input.pincode)]);
      return send(res, 201, { address: result.rows[0] });
    }
    if (path.startsWith("/api/addresses/") && method === "DELETE") {
      const id = path.split("/").pop();
      await pool.query("DELETE FROM addresses WHERE id=$1 AND user_id=$2", [id,user.id]);
      return send(res, 200, { ok: true });
    }

    if (path === "/api/orders" && method === "GET") {
      const result = await pool.query("SELECT id,items,total,payment_method,status,delivery,created_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100", [user.id]);
      const orders=result.rows.map(order=>({...order,items:decodeJson(order.items),delivery:decodeJson(order.delivery)}));
      return send(res, 200, { orders });
    }
    if (path === "/api/orders" && method === "POST") {
      const input = await body(req);
      const payment = String(input.payment || "");
      const methods = new Set(["Cash on Delivery"]);
      if (!methods.has(payment)) return send(res, 400, { error: "Choose a payment method." });
      if (!validAddress(input.delivery)) return send(res, 400, { error: "Add valid delivery details before placing your order." });
      if (!Array.isArray(input.items) || !input.items.length || input.items.length > 50) return send(res, 400, { error: "Your cart is empty." });
      const quantities = new Map();
      for (const entry of input.items) {
        const id = Number(entry.id), quantity = Number(entry.quantity), item = catalog.get(id);
        if (!item || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) return send(res, 400, { error: "One or more cart items are invalid." });
        quantities.set(id, (quantities.get(id) || 0) + quantity);
      }
      const items = [...quantities].map(([id,quantity]) => ({ id,name:catalog.get(id)[0],price:catalog.get(id)[1],quantity }));
      const total = items.reduce((sum,item) => sum + item.price * item.quantity, 0);
      const delivery = { name:String(input.delivery.fullName || input.delivery.name).trim(),phone:String(input.delivery.phone).replace(/\D/g,""),address:String(input.delivery.address).trim(),pincode:String(input.delivery.pincode) };
      const result = await pool.query("INSERT INTO orders(user_id,items,total,payment_method,status,delivery) VALUES($1,$2,$3,$4,'Placed',$5) RETURNING id,items,total,payment_method,status,delivery,created_at", [user.id,JSON.stringify(items),total,payment,JSON.stringify(delivery)]);
      await sendOrderNotification(result.rows[0],user);
      return send(res, 201, { order: result.rows[0] });
    }
    return send(res, 404, { error: "That BuyFarm feature was not found." });
  } catch (error) {
    console.error("BuyFarm API error:", error);
    return send(res, error.status || 500, { error: error.status ? error.message : "BuyFarm could not complete that request. Check the database connection and try again." });
  }
}

module.exports = route;
module.exports.close = async () => { if(storageMode === "sqlite")sqlite.close();else if(pool)await pool.end(); };
