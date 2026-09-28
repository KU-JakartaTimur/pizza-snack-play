# STORY.md — Panduan Korlas & Admin · Pizza Snack Play

## ① Intent alignment

- **目标受众 / 场合**： **koordinator kelas (korlas)** dan **admin sekolah** — mereka orang tua
  juga, bukan staf IT. Dipakai pada **pembekalan korlas menjelang tahun ajaran** dan sebagai
  pegangan saat lupa. Ditayangkan di layar/proyektor, lalu dibagikan lewat grup WhatsApp.
- **核心目标**： setelah melihat, korlas **berani** mengurus jadwal kelasnya sendiri dari awal
  sampai terbit tanpa menelepon developer; **ingat** tiga hal — (1) susun dulu, baru dikunci,
  baru dipublikasikan, (2) tanggal yang petugasnya dibiarkan kosong akan direbut orang tua,
  (3) jadwal yang sudah terbit tidak bisa diedit sendiri — minta admin membuka kunci; dan
  **melakukan** — mencoba menempel jadwal dari teks sekolah pada kesempatan pertama.
- **PPT 长度**： 15 页 → Hero 配额 3–4 页（实际 4 页：01 / 09 / 12 / 15）。
- **视觉调性**： hangat · jelas · tidak menakutkan · warna brand sekolah. Sama dengan dek
  orang tua (satu keluarga desain), tetapi nadanya lebih "pegangan kerja" daripada "ajakan".
- **内容边界**：
  - **必讲**： apa tugas korlas; beda wewenang admin vs korlas; tiga cara mengisi jadwal
    (pilih menu per hari · Salin Sepekan · tempel teks dari sekolah); menentukan petugas atau
    membiarkannya kosong; urutan kunci → publikasi; aksi massal; empat hal yang perlu diingat.
  - **不讲**： arsitektur teknis, endpoint, nama tabel, migrasi, `dryRun`, JSON, kode HTTP.
    Istilah internal diterjemahkan ke bahasa kerja sehari-hari (`draft` → "masih bisa diubah",
    `locked` → "sudah dikunci", `published` → "sudah terbit ke orang tua").
  - **禁碰**： jangan menyebut harga/biaya; jangan menjanjikan fitur yang belum ada
    (notifikasi, cetak PDF); jangan menyebutkan nama sekolah atau nama siswa yang tidak diketahui.

## ② Skeleton

**总页数 15 · 4 章**

| 章 | 标题 | 内容页 | 扉页页码 |
| :-- | :--- | :----- | :------- |
| 01 | Peran Anda | 04 | **第 3 页** |
| 02 | Akun & wewenang | 06 | **第 5 页** |
| 03 | Menyusun jadwal | 08, 09, 10 | **第 7 页** |
| 04 | Kunci & publikasi | 12, 13, 14 | **第 11 页** |

**目录 ↔ 扉页契约**：目录（第 2 页）声明 4 章 → 全篇恰好 4 个 `type: section` 扉页，编号 01..04
连续，标题与页码区间逐字一致。

**Hero 定位**：01（封面）/ 09（tempel teks）/ 12（terkunci lalu terbit）/ 15（结束页）= 4/15 ≈ 27%。
任意两个 Hero 之间至少间隔 1 个 Supporting 页。

**Rhythm 曲线**：
`peak · valley · transition · valley · transition · valley · transition · valley · peak · valley · transition · peak · valley · valley · peak`
无连续 ≥3 valley（13·14 两个 valley 后被 15 peak 收尾）。

**版式预算**：非对称 6/15 = 40%（≥40% ✓）；`N卡片横排` 仅 1 次（第 14 页）；
`左大图+右侧文字` + `非对称双栏` 合计 3/15 = 20%（≤40% ✓）；无相邻同版式。

## ③ Page outline

| # | title | type | role | rhythm | layout | visual | visual_role | density | anti_pattern | description |
| :- | :---- | :--- | :--- | :----- | :----- | :----- | :---------- | :------ | :----------- | :---------- |
| 01 | Panduan Korlas & Admin | cover | hero | peak | 全屏视觉+骑线文字 | app_logo.png + SVG 日历+对勾（占右 45%） | anchor | 字数约 35 / 图 2 / 留白约 38% | 禁止文字居中堆叠成海报；禁止 logo 缩到 200×70 塞角落 | 封面：siapa yang memakai panduan ini + 一句话承诺 |
| 02 | Isi panduan ini | catalog | supporting | valley | 左标题+右内容 | L3: 紫色序号徽标 | evidence | 字数约 130 / 图 0 / 留白约 25% | 禁止四卡片预览；禁止只列标题无说明句 | 目录：4 章 + 每章一句说明 + 页码区间 |
| 03 | 01 · Peran Anda | section | transition | transition | 全屏视觉+大标题 | SVG 抽象几何（半透明紫圆 + 剪贴板） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文段落 | 章扉页 01 |
| 04 | Tiga tugas Anda | content | supporting | valley | 左大图+右侧文字 | SVG 三段流程（susun · tentukan petugas · umumkan，占左 55%） | anchor | 字数约 200 / 图 1 / 留白约 22% | 禁止 50:50 等分；禁止把插画缩成小图标 | Tiga tugas korlas, diurutkan sesuai urutan kerjanya |
| 05 | 02 · Akun & wewenang | section | transition | transition | 全屏视觉+大标题 | SVG 抽象几何（钥匙 + 徽章） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文 | 章扉页 02 |
| 06 | Admin & Korlas: bedanya | content | supporting | valley | 非对称双栏 60:40 | SVG 两栏权限对照（占右 40%） | evidence | 字数约 210 / 图 1 / 留白约 22% | 禁止等宽两卡；禁止只写角色名无用例 | Yang boleh & tidak boleh korlas — 这是 paling sering ditanyakan |
| 07 | 03 · Menyusun jadwal | section | transition | transition | 全屏视觉+大标题 | SVG 抽象几何（日历格 + 铅笔） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文 | 章扉页 03 |
| 08 | Isi menu per hari | content | supporting | valley | 上大图+下方卡片 | SVG 表格 jadwal（占上 58%）+ 下方 60:40 两卡 | evidence | 字数约 200 / 图 1 / 留白约 20% | 禁止下方卡片等宽；禁止截图当背景 | Pilih menu per tanggal + Salin Sepekan |
| 09 | Tempel teks dari sekolah | content | hero | peak | 全幅图+骑线文字 | SVG 对话框 teks → pratinjau → jadwal（占右 55%） | anchor | 字数约 110 / 图 1 / 留白约 40% | 禁止等宽卡片横排 | **Fitur terbaru**: 不用 ketik ulang — tempel apa adanya |
| 10 | Petugas piket | content | supporting | valley | 左标题+右内容 | L2: SVG dropdown +  nama orang tua（占右上 300×220） | evidence | 字数约 190 / 图 1 / 留白约 24% | 禁止等宽四卡；禁止只写功能名无用例 | Pilih dari daftar siswa, atau biarkan kosong supaya direbut orang tua |
| 11 | 04 · Kunci & publikasi | section | transition | transition | 全屏视觉+大标题 | SVG 抽象几何（锁 + 喇叭） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文 | 章扉页 04 |
| 12 | Terkunci, lalu terbit | content | hero | peak | 巨型文字+洞察 | 巨型短语「Kunci dulu, baru terbit」≥60px + SVG 三段状态条 | anchor | 字数约 140 / 图 1 / 留白约 40% | 禁止把核心短语塞进角落小字 | 全篇第二个情绪高点：urutan yang tidak bisa dibalik |
| 13 | Aksi massal | content | supporting | valley | 左大图+右侧文字 | SVG 表格 + kotak centang（占左 55%） | anchor | 字数约 190 / 图 1 / 留白约 22% | 禁止 50:50 等分 | Centang hari atau kelas, lalu satu klik |
| 14 | Empat hal yang perlu diingat | content | supporting | valley | N卡片横排（全篇仅此 1 次） | L3: 每卡一个 FAIcon（32px，统一） | evidence | 字数约 230（每卡 ≥ 55）/ 图 0 / 留白约 22% | 禁止卡片只放标题；禁止图标尺寸不统一 | 收口：empat jebakan yang paling sering terjadi |
| 15 | Terima kasih | ending | hero | peak | 全屏视觉+大标题 | app_logo.png（居中 200×200）+ SVG 光晕 | anchor | 字数约 45 / 图 1 / 留白约 45% | 禁止塞联系方式占位符 | 收束：ajakan coba impor teks minggu ini |

### 数据落点

本 deck 无业务 KPI 数据，不编造百分比。两处「数字感」锚点均来自产品事实：

- 第 09 页：不摆数字，改用「satu kali tempel」对比「ketik ulang 20 hari」—— 判断： nilai
  fitur ini ada pada penghapusan pekerjaan ulang, bukan pada kecepatan.
- 第 12 页：巨型短语而非数字 —— 判断： urutan tiga status tidak bisa dibalik, dan itu yang
  paling sering membuat korlas bingung.

### Checklist 自检

- ✅ Hero = 4/15 ≈ 27%（20–30% 区间内）
- ✅ 无连续 ≥3 valley
- ✅ `N卡片横排` 仅 1 次
- ✅ 非对称版式 6/15 = 40% ≥ 40%
- ✅ 无相邻两页版式相同
- ✅ `左大图+右侧文字` + `非对称双栏` 合计 3/15 = 20% ≤ 40%
- ✅ 每页均有 role / rhythm / visual_role / anti_pattern
- ✅ 4 章 ↔ 4 扉页，编号 01..04 连续

## ④ Sumber fakta

Semua klaim di dek ini diambil dari kondisi aplikasi **v1.12** (28 September 2026):

- `README.md` § Fitur & § Catatan Teknis — wewenang role, siklus `draft → locked → published`.
- `src/api/schedules/route.ts` — `POST /schedules/lock` & `/publish` memakai `scheduleWriters`
  (admin **dan** korlas); `POST /schedules/:id/unlock` & `/bulk/unlock` khusus `admin`.
- `src/components/jadwal/MonthToolbar.tsx` — tombol **Kunci bulan**, **Publikasi**,
  **Salin Sepekan**, **Impor Jadwal** tampil untuk korlas; **Hari libur** hanya admin.
- `src/api/schedules/importParser.ts` — format teks yang diterima: blok rentang tanggal, lalu
  baris `Hari : menu`.
- `src/components/jadwal/ImportDialog.tsx` — dua langkah: Pratinjau → Impor.
- `src/routes/_app/pilih-jadwal.tsx` — badge "Ditetapkan korlas" untuk tanggal yang petugasnya
  sudah diisi korlas (tidak ikut direbutkan).
