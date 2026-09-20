# STORY.md — Panduan Orang Tua · Pizza Snack Play

## ① Intent alignment

- **目标受众 / 场合**： orang tua murid SD（Bapak/Ibu wali murid），pada **pertemuan sosialisasi awal tahun ajaran**. Mereka bukan pengguna teknis — mayoritas memakai HP Android, sebagian belum pernah memasang aplikasi sendiri. Ditayangkan di layar/proyektor, lalu dibagikan lewat grup WhatsApp kelas.
- **核心目标**： setelah melihat, orang tua **percaya** bahwa aplikasi ini membuat hidup mereka lebih mudah; **ingat** tiga hal — (1) jadwal snack bisa dilihat kapan saja, (2) tanggal piket kosong bisa diambil sendiri, (3) butuh akun dari sekolah; dan **melakukan** — memasang aplikasi ke layar utama HP lalu login.
- **PPT 长度**： 15 页 → Hero 配额 3–4 页（实际 4 页：01 / 05 / 11 / 15）。
- **视觉调性**： hangat · ramah · sederhana · tidak menakutkan · warna brand sekolah.
- **内容边界**：
  - **必讲**： masalah lama yang mereka rasakan sendiri; cara pasang & login; melihat jadwal; mengambil tanggal piket; mencari menu; empat hal yang perlu diingat.
  - **不讲**： arsitektur teknis, endpoint, database, status `draft/locked/published`, role `admin/korlas/parent` secara teknis, migrasi, pengujian — semua ini membuat orang tua bingung. Istilah internal yang muncul di aplikasi diterjemahkan ke bahasa sehari-hari（"dipublikasi" → "sudah diumumkan"）.
  - **禁碰**： jangan menyebut harga/biaya; jangan menjanjikan fitur notifikasi yang belum ada; jangan menyebutkan nama siswa/sekolah yang tidak diketahui.

## ② Skeleton

**总页数 15 · 4 章**

| 章 | 标题 | 内容页 | 扉页页码 |
| :-- | :--- | :----- | :------- |
| 01 | Kenapa ada aplikasi ini | 04, 05 | **第 3 页** |
| 02 | Cara mulai | 07, 08 | **第 6 页** |
| 03 | Dipakai tiap hari | 10, 11, 12 | **第 9 页** |
| 04 | Yang perlu diingat | 14 | **第 13 页** |

**目录 ↔ 扉页契约**：目录（第 2 页）声明 4 章 → 全篇恰好 4 个 `type: section` 扉页，编号 01..04 连续，标题与页码区间逐字一致。

**Hero 定位**：01（封面）/ 05（satu aplikasi）/ 11（siapa cepat dia dapat）/ 15（结束页）= 4/15 ≈ 27%。任意两个 Hero 之间至少间隔 1 个 Supporting 页（1→5 间隔 3 页；5→11 间隔 5 页；11→15 间隔 3 页）。

**Rhythm 曲线**：
`peak · valley · transition · valley · peak · transition · valley · valley · transition · valley · peak · valley · transition · valley · peak`
无连续 ≥3 valley（07·08 两个 valley 后被 09 transition 打断）。

**版式预算**：非对称 8/15 ≈ 53%（≥40% ✓）；对称 7 页其中 `N卡片横排` 仅 1 次（第 14 页）；`左大图+右侧文字`+`非对称双栏` 合计 2 次 ≈ 13%（≤40% ✓）；无相邻同版式。

## ③ Page outline

| # | title | type | role | rhythm | layout | visual | visual_role | density | anti_pattern | description |
| :- | :---- | :--- | :--- | :----- | :----- | :----- | :---------- | :------ | :----------- | :---------- |
| 01 | Pizza Snack Play | cover | hero | peak | 全屏视觉+骑线文字 | L1: app_logo.png + SVG 披萨/日历插画（占右 45%） | anchor | 字数约 30 / 图 2 / 留白约 38% | 禁止文字居中堆叠成海报；禁止 logo 缩到 200×70 塞角落 | 封面：品牌名 + 一句话承诺「jadwal snack anak, langsung kelihatan di HP」 |
| 02 | Isi panduan ini | catalog | supporting | valley | 左标题+右内容 | L3: 紫色序号徽标 | evidence | 字数约 130 / 图 0 / 留白约 25% | 禁止四卡片预览；禁止只列标题无说明句 | 目录：4 章 + 每章一句说明 + 页码区间，让 orang tua tahu urutan |
| 03 | 01 · Kenapa ada aplikasi ini | section | transition | transition | 全屏视觉+大标题 | L1: SVG 抽象几何（半透明紫圆 + 日历栅格） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文段落；禁止四卡片预览 | 章扉页 01：先承认「selama ini repot」,baru menawarkan solusi |
| 04 | Dulu, begini masalahnya | content | supporting | valley | 非对称双栏 60:40 | L1: SVG 混乱群聊 + 纸制jadwal（占左 60%） | anchor | 字数约 190 / 图 1 / 留白约 22% | 禁止 50:50 等分；禁止把插画缩成小图标 | 三大 masalah nyata yang mereka alami：tanya-tanya menu ke grup · tidak ada riwayat · rebutan tanggal piket yang bikin dua orang merasa sudah dapat |
| 05 | Sekarang: cukup satu aplikasi | content | hero | peak | 全幅图+骑线文字 | L1: SVG 手机看板（Hari Ini/Minggu Ini）占右 55% | anchor | 字数约 90 / 图 1 / 留白约 42% | 禁止等宽卡片横排；禁止把手机插画缩小为装饰 | Satu aplikasi menggantikan grup & kertas：menu jelas, giliran jelas, tidak perlu tanya — 这是全篇第一个情绪高点 |
| 06 | 02 · Cara mulai | section | transition | transition | 全屏视觉+大标题 | L1: SVG 抽象几何（手机轮廓 + 下载箭头） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文；禁止放步骤清单抢扉页位置 | 章扉页 02：masuk ke bagian paling praktis |
| 07 | Pasang ke layar utama HP | content | supporting | valley | 左大图+右侧文字 | L1: SVG 手机 + ikon muncul di home screen（占左 55%） | anchor | 字数约 200 / 图 1 / 留白约 22% | 禁止 50:50 等分双栏；禁止只写「ketuk Pasang」 tanpa konteks iOS | 4 langkah pasang PWA；Android 一个动作，iOS 手动「Add to Home Screen」— 消除「harus buka browser terus」的顾虑 |
| 08 | Masuk pakai akun sekolah | content | supporting | valley | 左标题+右内容 | L2: SVG 锁/钥匙图标（96px）+ L3 | evidence | 字数约 200 / 图 1 / 留白约 24% | 禁止等宽四卡；禁止把登录画成流程图 | Akun diberikan sekolah · satu akun untuk beberapa anak · bisa ganti password sendiri · **kenapa** harus login：data anak aman |
| 09 | 03 · Dipakai tiap hari | section | transition | transition | 全屏视觉+大标题 | L1: SVG 抽象几何（日历 + 勾） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文；禁止四卡片预览 | 章扉页 03：bagian yang dipakai berulang-ulang |
| 10 | Lihat jadwal snack | content | supporting | valley | 上大图+下方卡片 | L1: app_schedule_screen.png（真机截图，占上 55%）+ 下方 60:40 两卡 | evidence | 字数约 210 / 图 1 / 留白约 20% | 禁止下方卡片等宽；禁止截图铺满全屏当背景 | 真截图做证据：Hari Ini / Minggu Ini / Bulan Ini — 让 orang tua 看到「真实 tampilan」,reduce fear of the unknown |
| 11 | Ambil tanggal piket | content | hero | peak | 巨型文字+洞察 | L1: 巨型短语「Siapa cepat, dia dapat」≥64px + SVG 日期卡 | anchor | 字数约 150 / 图 1 / 留白约 40% | 禁止等宽卡片横排；禁止把核心短语塞进角落小字 | 全篇第二个情绪高点：tanggal kosong bisa diambil sendiri, satu klik; keduluan → diberi tahu nama pengambil; bisa dibatalkan sendiri |
| 12 | Cari menu | content | supporting | valley | 左标题+右内容 | L2: SVG 放大镜 + 餐盘（占右上 280×200） | evidence | 字数约 190 / 图 1 / 留白约 24% | 禁止等宽四卡；禁止只写功能名无用例 | Ketik nama makanan/buah → tahu kapan disajikan；berguna untuk anak alergi & tahu rotasi menu |
| 13 | 04 · Yang perlu diingat | section | transition | transition | 全屏视觉+大标题 | L1: SVG 抽象几何（对勾圆 + 星） | atmosphere | 字数约 30 / 图 1 / 留白约 45% | 禁止铺正文；禁止四卡片预览 | 章扉页 04：empat aturan yang sering jadi pertanyaan |
| 14 | Empat hal yang perlu diingat | content | supporting | valley | N卡片横排（全篇仅此 1 次） | L3: 每卡一个 FAIcon（32px，统一） | evidence | 字数约 230（每卡 ≥ 55）/ 图 0 / 留白约 22% | 禁止卡片只放标题；禁止图标尺寸不统一 | 收口：jadwal muncul setelah diumumkan · satu akun bisa beberapa anak · ambil tanggal hanya di kelas anak sendiri · ada perubahan hubungi korlas |
| 15 | Terima kasih | ending | hero | peak | 全屏视觉+大标题 | L1: app_logo.png（居中 200×200）+ SVG 光晕 | anchor | 字数约 45 / 图 1 / 留白约 45% | 禁止塞联系方式占位符；禁止铺正文 | 收束：ajakan pasang hari ini + 问题找 korlas/admin sekolah |

### 数据落点

本 deck 无业务 KPI 数据，因此不编造百分比。两处「数字感」锚点均来自产品事实而非杜撰：

- 第 05 页：不摆数字，改用「satu aplikasi」的尺度对比（grup + kertas → satu layar）—— 判断：keribetan bukan karena orang tua tidak tertib, melainkan karena tidak ada satu tempat yang jadi rujukan。
- 第 11 页：巨型短语而非数字 —— 判断：aturan「satu tanggal untuk satu orang tua per kelas」menjamin tidak ada lagi dua orang merasa sudah dapat。

### Checklist 自检

- ✅ Hero = 4/15 ≈ 27%（20–30% 区间内）
- ✅ 无连续 ≥3 valley
- ✅ `N卡片横排` 仅 1 次
- ✅ 非对称版式 8/15 ≈ 53% ≥ 40%
- ✅ 无相邻两页版式相同
- ✅ `左大图+右侧文字` + `非对称双栏` 合计 2/15 ≈ 13% ≤ 40%
- ✅ 每页均有 role / rhythm / visual_role / anti_pattern
- ✅ 4 章 ↔ 4 扉页，编号 01..04 连续
