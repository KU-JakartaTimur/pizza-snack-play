const BASE = "http://localhost:5173/api";
let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

console.log("\n=== 1. Health check ===");
{
  const r = await call("GET", "/health");
  check("GET /health -> 200", r.status === 200, `got ${r.status}`);
  check(
    "binding D1 terhubung",
    r.json?.data?.db === "connected",
    JSON.stringify(r.json?.data),
  );
}

console.log("\n=== 2. Proteksi endpoint tanpa token ===");
{
  const r = await call("GET", "/auth/me");
  check("GET /auth/me tanpa token -> 401", r.status === 401, `got ${r.status}`);
}

console.log("\n=== 3. Login gagal ===");
{
  const r = await call("POST", "/auth/login", {
    body: { username: "admin", password: "salah-banget" },
  });
  check("password salah -> 401", r.status === 401, `got ${r.status}`);

  const r2 = await call("POST", "/auth/login", {
    body: { username: "tidak-ada", password: "apapun" },
  });
  check("username tidak ada -> 401", r2.status === 401, `got ${r2.status}`);

  const r3 = await call("POST", "/auth/login", { body: {} });
  check("body kosong -> 400", r3.status === 400, `got ${r3.status}`);
}

console.log("\n=== 4. Login admin ===");
let adminToken = null;
{
  const r = await call("POST", "/auth/login", {
    body: { username: "admin", password: "snack123" },
  });
  check("login admin -> 200", r.status === 200, `got ${r.status} ${JSON.stringify(r.json)}`);
  check("ada token", typeof r.json?.data?.token === "string");
  check("role = admin", r.json?.data?.user?.role === "admin");
  check("student null untuk admin", r.json?.data?.student === null);
  adminToken = r.json?.data?.token ?? null;
}

console.log("\n=== 5. Login orang tua ===");
let parentToken = null;
{
  const r = await call("POST", "/auth/login", {
    body: { username: "sari", password: "snack123" },
  });
  check("login sari -> 200", r.status === 200, `got ${r.status} ${JSON.stringify(r.json)}`);
  check("role = parent", r.json?.data?.user?.role === "parent");
  check(
    "profil siswa terisi",
    r.json?.data?.student?.name === "Aisyah Sari",
    JSON.stringify(r.json?.data?.student),
  );
  check("kelas = 1A", r.json?.data?.student?.className === "1A");
  parentToken = r.json?.data?.token ?? null;
}

console.log("\n=== 6. GET /auth/me dengan token ===");
{
  const r = await call("GET", "/auth/me", { token: adminToken });
  check("admin /me -> 200", r.status === 200, `got ${r.status}`);
  check("username = admin", r.json?.data?.user?.username === "admin");

  const r2 = await call("GET", "/auth/me", { token: parentToken });
  check("parent /me -> 200", r2.status === 200, `got ${r2.status}`);
  check(
    "parent /me punya data siswa",
    r2.json?.data?.student?.name === "Aisyah Sari",
  );
}

console.log("\n=== 7. Token invalid ===");
{
  const r = await call("GET", "/auth/me", { token: "token-palsu" });
  check("token palsu -> 401", r.status === 401, `got ${r.status}`);
}

console.log("\n=== 8. Ubah password ===");
{
  const r = await call("PUT", "/auth/password", {
    token: parentToken,
    body: { currentPassword: "salah", newPassword: "passwordbaru123" },
  });
  check("password lama salah -> 401", r.status === 401, `got ${r.status}`);

  const r2 = await call("PUT", "/auth/password", {
    token: parentToken,
    body: { currentPassword: "snack123", newPassword: "pendek" },
  });
  check("password baru terlalu pendek -> 400", r2.status === 400, `got ${r2.status}`);

  const r3 = await call("PUT", "/auth/password", {
    token: parentToken,
    body: { currentPassword: "snack123", newPassword: "passwordbaru123" },
  });
  check("ubah password -> 200", r3.status === 200, `got ${r3.status} ${JSON.stringify(r3.json)}`);

  const r4 = await call("POST", "/auth/login", {
    body: { username: "sari", password: "passwordbaru123" },
  });
  check("login dengan password baru -> 200", r4.status === 200, `got ${r4.status}`);

  const r5 = await call("POST", "/auth/login", {
    body: { username: "sari", password: "snack123" },
  });
  check("password lama tidak berlaku -> 401", r5.status === 401, `got ${r5.status}`);

  // kembalikan ke password semula
  const r6 = await call("PUT", "/auth/password", {
    token: parentToken,
    body: { currentPassword: "passwordbaru123", newPassword: "snack123" },
  });
  check("restore password -> 200", r6.status === 200, `got ${r6.status}`);
}

console.log("\n=== 9. Logout ===");
{
  const r = await call("POST", "/auth/logout", { token: adminToken });
  check("logout -> 200", r.status === 200, `got ${r.status}`);
}

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===\n`);
process.exit(fail > 0 ? 1 : 0);
