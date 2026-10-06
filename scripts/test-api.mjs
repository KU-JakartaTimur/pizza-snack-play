// ── 25. Aksi massal akun orang tua (bulk) ───────────────────

section("25. Aksi massal akun orang tua (bulk)");
{
  const mkUser = () =>
    `bulk${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const makeParent = async (uname) =>
    call("POST", "/parents", {
      token: adminToken,
      body: {
        username: uname,
        password: "rahasia123",
        parentName: `Bulk ${uname}`,
        students: [{ name: "Anak Bulk", className: "3" }],
        relationship: "ibu",
      },
    });

  const u1 = mkUser();
  const u2 = mkUser();
  const p1 = await makeParent(u1);
  const p2 = await makeParent(u2);
  check("buat akun uji 1 -> 201", p1.status === 201, `got ${p1.status}`);
  check("buat akun uji 2 -> 201", p2.status === 201, `got ${p2.status}`);
  const id1 = p1.data?.id;
  const id2 = p2.data?.id;

  // ── Wewenang: bukan admin ditolak ───────────────────────────
  const asParent = await call("POST", "/parents/bulk", {
    token: parentToken,
    body: { ids: [id1, id2], action: "deactivate" },
  });
  check("bulk dari orang tua -> 403", asParent.status === 403, `got ${asParent.status}`);

  // ── Validasi body ───────────────────────────────────────────
  const noIds = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { action: "activate" },
  });
  check("bulk tanpa `ids` -> 400", noIds.status === 400, `got ${noIds.status}`);

  const badAction = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { ids: [id1], action: "nonsense" },
  });
  check("bulk `action` salah -> 400", badAction.status === 400, `got ${badAction.status}`);

  // ── Nonaktifkan massal dua akun yang masih aktif ────────────
  const deact = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { ids: [id1, id2], action: "deactivate" },
  });
  check("bulk deactivate -> 200", deact.status === 200, `got ${deact.status}`);
  check(
    "bulk deactivate changed=2",
    deact.data?.changed === 2,
    JSON.stringify(deact.data),
  );
  check(
    "bulk deactivate skipped=0",
    deact.data?.skipped === 0,
    JSON.stringify(deact.data),
  );

  const d1 = await call("GET", `/parents/${id1}`, { token: adminToken });
  check(
    "akun 1 kini nonaktif",
    d1.data?.isActive === false,
    JSON.stringify(d1.data?.isActive),
  );

  // Mengulang aksi yang sudah cocok -> skipped, bukan changed.
  const deactAgain = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { ids: [id1, id2], action: "deactivate" },
  });
  check(
    "bulk deactivate ulang skipped=2",
    deactAgain.data?.skipped === 2,
    JSON.stringify(deactAgain.data),
  );

  // ── Aktifkan massal kembali ─────────────────────────────────
  const act = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { ids: [id1, id2], action: "activate" },
  });
  check(
    "bulk activate changed=2",
    act.data?.changed === 2,
    JSON.stringify(act.data),
  );
  const a1 = await call("GET", `/parents/${id1}`, { token: adminToken });
  check(
    "akun 1 kembali aktif",
    a1.data?.isActive === true,
    JSON.stringify(a1.data?.isActive),
  );

  // Id tak ditemukan masuk `ignored`, bukan menggagalkan seluruhnya.
  const withGhost = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { ids: [id1, 9_999_999], action: "deactivate" },
  });
  check(
    "bulk id tak ditemukan -> ignored=1",
    withGhost.data?.ignored === 1,
    JSON.stringify(withGhost.data),
  );

  // ── Hapus permanen dua akun uji ─────────────────────────────
  const del = await call("POST", "/parents/bulk", {
    token: adminToken,
    body: { ids: [id1, id2], action: "delete" },
  });
  check("bulk delete -> 200", del.status === 200, `got ${del.status}`);
  check(
    "bulk delete changed=2",
    del.data?.changed === 2,
    JSON.stringify(del.data),
  );

  const gone1 = await call("GET", `/parents/${id1}`, { token: adminToken });
  check("akun 1 terhapus (404)", gone1.status === 404, `got ${gone1.status}`);
}

// ── 24. Laporan jadwal per orang tua ──────────────────────────

section("24. Laporan jadwal — rekap ambil per orang tua");
{
  // Bulan uji sendiri agar tidak bertabrakan dengan section lain.
  const YEAR = 2036;
  const MONTH = 2;
  const TANGGAL = `${YEAR}-02-04`; // Selasa
  const TAG_LAPORAN = `uji-laporan-${Date.now().toString(36)}`;

  const korlasLogin = await call("POST", "/auth/login", { body: KORLAS });
  const korlasToken = korlasLogin.data?.token;
  const korlasClass = korlasLogin.data?.user?.className;

  // 1) Siapkan jadwal published di kelas korlas, tanpa petugas.
  const dibuat = await call("POST", "/schedules", {
    token: adminToken,
    body: {
      scheduleDate: TANGGAL,
      className: korlasClass,
      menuId: 1,
      notes: `${TAG_LAPORAN} laporan`,
    },
  });
  check(
    "siapkan jadwal laporan -> 201",
    dibuat.status === 201,
    `got ${dibuat.status}`,
  );
  const scheduleId = dibuat.data?.scheduleId ?? dibuat.data?.id;

  await call("POST", "/schedules/lock", {
    token: adminToken,
    body: {
      fromDate: TANGGAL,
      toDate: TANGGAL,
      className: korlasClass,
    },
  });
  const terbit = await call("POST", "/schedules/publish", {
    token: adminToken,
    body: { year: YEAR, month: MONTH, className: korlasClass },
  });
  check(
    "jadwal laporan dipublikasi",
    [200, 201].includes(terbit.status),
    `got ${terbit.status}`,
  );

  // 2) Orang tua (sari) mengambil tanggal itu.
  const klaim = await call("POST", "/claims", {
    token: parentToken,
    body: { scheduleId },
  });
  check("orang tua mengambil jadwal -> 201", klaim.status === 201, `got ${klaim.status}`);

  const rentang = `from=${YEAR}-02-01&to=${YEAR}-02-31`;

  // 3) Admin melihat rekap.
  const adminLaporan = await call(
    "GET",
    `/laporan?${rentang}&class=${encodeURIComponent(korlasClass)}`,
    { token: adminToken },
  );
  check("GET /laporan (admin) -> 200", adminLaporan.status === 200, `got ${adminLaporan.status}`);
  check(
    "laporan memuat ringkasan",
    typeof adminLaporan.data?.ringkasan?.totalAmbil === "number",
    JSON.stringify(adminLaporan.data?.ringkasan)?.slice(0, 120),
  );
  check(
    "laporan menghitung klaim uji",
    (adminLaporan.data?.orangTua ?? []).some(
      (row) => row.parentName === "Sari Wulandari" && row.jumlahAmbil >= 1,
    ),
    JSON.stringify((adminLaporan.data?.orangTua ?? []).map((r) => r.parentName)),
  );
  check(
    "laporan menyertakan rincian tanggal",
    (adminLaporan.data?.orangTua ?? []).some((row) =>
      row.tanggal.some((t) => t.scheduleDate === TANGGAL),
    ),
    JSON.stringify(adminLaporan.data?.orangTua?.[0]?.tanggal?.map((t) => t.scheduleDate)),
  );
  check(
    "laporan menghitung orang tua yang belum ambil",
    typeof adminLaporan.data?.ringkasan?.orangTuaKosong === "number",
  );

  // 4) Kelas lain tidak memuat klaim uji.
  const kelasLainLaporan = await call(
    "GET",
    `/laporan?${rentang}&class=${encodeURIComponent(
      korlasClass === "1" ? "2" : "1",
    )}`,
    { token: adminToken },
  );
  check(
    "kelas lain tidak memuat klaim uji",
    !(kelasLainLaporan.data?.orangTua ?? []).some((row) =>
      row.tanggal.some((t) => t.scheduleDate === TANGGAL),
    ),
    JSON.stringify(kelasLainLaporan.data?.ringkasan),
  );

  // 5) Admin tanpa `class` = seluruh kelas (cakupan sekolah).
  const semuaKelas = await call("GET", `/laporan?${rentang}`, {
    token: adminToken,
  });
  check("admin tanpa class -> 200 (semua kelas)", semuaKelas.status === 200, `got ${semuaKelas.status}`);
  check(
    "admin tanpa class: className null",
    semuaKelas.data?.className === null,
    JSON.stringify(semuaKelas.data?.className),
  );

  // 6) Korlas terbatas kelasnya sendiri.
  const korlasLaporan = await call("GET", `/laporan?${rentang}`, {
    token: korlasToken,
  });
  check("korlas melihat laporan kelasnya -> 200", korlasLaporan.status === 200, `got ${korlasLaporan.status}`);
  check(
    "korlas terkunci ke kelasnya sendiri",
    korlasLaporan.data?.className === korlasClass,
    JSON.stringify(korlasLaporan.data?.className),
  );

  const korlasKelasLain = await call(
    "GET",
    `/laporan?${rentang}&class=${encodeURIComponent(korlasClass === "1" ? "2" : "1")}`,
    { token: korlasToken },
  );
  check(
    "korlas minta kelas lain -> 403",
    korlasKelasLain.status === 403,
    `got ${korlasKelasLain.status}`,
  );

  // 7) Orang tua tidak berhak.
  const parentLaporan = await call("GET", `/laporan?${rentang}`, {
    token: parentToken,
  });
  check("orang tua -> 403", parentLaporan.status === 403, `got ${parentLaporan.status}`);

  // 8) Validasi parameter.
  const tanpaToken = await call("GET", `/laporan?${rentang}`);
  check("tanpa token -> 401", tanpaToken.status === 401, `got ${tanpaToken.status}`);

  const rentangTerlalu = await call("GET", "/laporan?from=2000-01-01&to=2001-12-31", {
    token: adminToken,
  });
  check("rentang > 92 hari -> 400", rentangTerlalu.status === 400, `got ${rentangTerlalu.status}`);

  const tanpaRentang = await call("GET", "/laporan", { token: adminToken });
  check("tanpa from/to -> 400", tanpaRentang.status === 400, `got ${tanpaRentang.status}`);

  // 9) Bersih-bersih: klaim lalu jadwal uji.
  await call("DELETE", `/claims/${klaim.data?.id}`, { token: adminToken });
  await call("POST", `/schedules/${scheduleId}/unlock`, { token: adminToken });
  const hapusJadwal = await call("DELETE", `/schedules/${scheduleId}`, {
    token: adminToken,
  });
  check(
    "jadwal uji laporan dihapus",
    hapusJadwal.status === 200,
    `got ${hapusJadwal.status}`,
  );
}

// ── Ringkasan ─────────────────────────────────────────────────

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
if (failures.length > 0) {
  console.log("\nGagal:");
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail === 0 ? 0 : 1);
