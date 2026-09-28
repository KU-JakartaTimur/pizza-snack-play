# DESIGN.md — Panduan Korlas & Admin · Pizza Snack Play

## 0. 设计定位（不走预设领域分支）

场景＝面向 **koordinator kelas & admin sekolah** 的**产品使用说明 / 内部培训**。
不属于学术科研、专业咨询、党政红色任一垂直领域 → 走**通用设计原则**，由 query 推导：
受众是非技术人群（mereka orang tua juga）→ 亲和、大字号、强图像、低术语。

**调性关键词**：hangat · jelas · praktis · tidak menakutkan

**与既有 deck 的关系**：本 deck 是 `Panduan Orang Tua Pizza Snack Play` 的**姊妹篇**，
共用同一套品牌令牌（取自应用自身 `src/index.css` `@theme`），保证两份文档看起来是一家人。
差异只在语气：orang tua → "ajakan"; korlas/admin → "pegangan kerja"。

---

## 1. 画布与母版（具体 px）

- **画布**：`1280 × 720`（16:9）
- **页面 padding**：上 20px / 下 20px / 左 64px / 右 64px

### 默认三区母版（封面 / 章节扉页 / 结束页可省略 C 区）

| 区 | 垂直位置 | 高度 | 内容 |
| :-- | :------ | :--- | :--- |
| **A · 标题块** | 20 – 130px | 110px | 主标题 34px bold；标题下 6px 高、72px 宽的紫色短条（`secondary` lime 用于章节扉页） |
| **B · 内容区** | 130 – 660px | 530px | 正文 / 卡片 / 插画 / 巨型文字 |
| **C · 页脚条** | 660 – 700px | 40px | 左：项目水印 `Pizza Snack Play · Panduan Korlas & Admin`（14px `#6B6478`） · 右：页码 `NN / 15`（14px `#6B6478`） |

**高度核算**：20 + 110 + 530 + 40 + 20 = 720 ✓（B 区内所有卡片高度之和 + gap 必须 ≤ 530）

---

## 2. 颜色系统（4 hex + 2 中性）

| 角色 | Hex | 用途 | 面积上限 |
| :--- | :-- | :--- | :------ |
| **背景 `bg`** | `#FAF7F2` | 全篇页面底色（暖米） | — |
| **主色 `primary`** | `#51277C` | 标题栏底色、Hero 大色块、按钮、巨型文字 | **≤ 60%** |
| **辅色 `secondary`** | `#AFC440` | 卡片顶条、图标底、分隔线、正向徽章 | **≤ 30%** |
| **强调色 `accent`** | `#F3B26C` | 只落在焦点：CTA 按钮、巨型短语的关键词、状态条「terbit」 | **≤ 10%**（Hero 页可到 15–20%） |
| 中性 · 正文 `ink` | `#2A2333` | 正文、标题 | 剩余 |
| 中性 · 次要 `muted` | `#6B6478` | 页脚、说明小字 | 剩余 |

**半透明策略**：
- 卡片容器底：`rgba(81,39,124,0.06)`
- 卡片浮起：`boxShadow: '0 4px 20px rgba(0,0,0,0.08)'`
- 章节扉页装饰圆：`opacity: 0.14` 的 `#51277C` 大圆
- Hero 页强调块：`linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`

**渐变方案**：统一 `135deg`。
- 标题栏 / Hero 块：`linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`
- 装饰大色块：`linear-gradient(135deg, #AFC440 0%, #F3B26C 100%)`（仅 Hero / 章节扉页）

### 逐页色彩分配（禁止全篇雷同）

| 页 | 主色 | 辅色 | 强调色 | 说明 |
| :- | :--- | :--- | :----- | :--- |
| 01 封面 | 55% | 25% | 12% | Hero，紫色大块铺右半 |
| 02 目录 | 20% | 20% | 5% | 克制，紫序号徽标 |
| 03 扉页 | 60% | 15% | 5% | 紫底反白大字 |
| 04 Tiga tugas | 30% | 22% | 8% | 插画为主 |
| 05 扉页 | 60% | 15% | 5% | 紫底反白 |
| 06 Beda wewenang | 28% | 22% | 5% | 两栏对照，紫/灰分明 |
| 07 扉页 | 60% | 15% | 5% | 紫底反白 |
| 08 Isi menu | 25% | 20% | 8% | 表格插画为证据 |
| 09 Tempel teks | 50% | 15% | 18% | **Hero**，强调色爆发于 CTA |
| 10 Petugas | 25% | 20% | 5% | 克制 |
| 11 扉页 | 60% | 15% | 5% | 紫底反白 |
| 12 Terkunci lalu terbit | 45% | 15% | 20% | **Hero**，巨型短语 + 橙色状态条 |
| 13 Aksi massal | 30% | 20% | 10% | 强调色落在 kotak centang |
| 14 四卡 | 25% | 25% | 5% | 卡片顶条用辅色 |
| 15 结束 | 55% | 15% | 12% | Hero |

---

## 3. 字体系统

与姊妹 deck 完全一致（已实测可用，交付后不会掉字体）：

| 层级 | 字号 | 字重 | 行高 | 字体 |
| :--- | :--- | :--- | :--- | :--- |
| 封面主标题 | 66px | bold | 1.2 | `Trebuchet MS` |
| 章节大字 | 60px | bold | 1.1 | `Trebuchet MS` |
| 巨型文字锚点（第 12 页） | **64px** | bold | 1.05 | `Trebuchet MS` |
| 页面主标题（A 区） | 34px | bold | 1.3 | `Trebuchet MS` |
| 副标题 / 卡片小标题 | 24–26px | bold | 1.4 | `Trebuchet MS` |
| 正文 | 20–22px | regular | 1.55 | `Verdana` |
| 卡片正文（第 14 页） | 17–18px | regular | 1.5 | `Verdana` |
| 说明 / 注解 | 17–18px | regular | 1.5 | `Verdana` |
| 页脚 / 页码 | 14px | regular | 1.4 | `Verdana` |

- **仅 2 套字体家族**：`Trebuchet MS`（标题/巨型锚点）+ `Verdana`（正文）。
- **严禁 emoji**。

---

## 4. 信息密度门禁

- 常规内容页留白 **≤ 35%**；Hero 页允许 40–45%（第 01/09/12/15 页）。
- **容器填充率 ≥ 85%**：卡片内文字 + 图标垂直占用 ≥ 容器高 85%。
- **底栏锚定**：卡片尾部元素（标签条 / 高亮句）用 `marginTop: 'auto'` 钉到底部。
- **横向兄弟卡对齐**：同一行卡片的「标题块 / 正文块 / 尾条」三段 y 坐标必须对齐，差值 > 16px → 返工。
- **焦点留白**：每个视觉锚点周围留 ≥ 40px。

---

## 5. 配图系统

### 配图来源说明（重要）

本环境**不提供图像生成能力**，故全部 L1/L2 视觉采用 **手写 `<SVG>` 结构化插画**
（表格 jadwal、对话框、dropdown、状态条、抽象几何），并配合 **P0 材料图**
（`assets/app_logo.png`，复制自 `public/logo.png`）。SVG 仅用于结构化 / 抽象元素，
**不冒充摄影或人物群像**。

### 资源清单

| 文件 | 来源 | 真实内容 | 尺寸 | 使用页 | 核对 |
| :--- | :--- | :------- | :--- | :---- | :--- |
| `assets/app_logo.png` | P0 材料（复制自 `public/logo.png`） | 应用官方 logo：披萨 + 日历 + 「PIZZA SNACK PLAY」字样，teal 底色 | 690×670 | 01, 15 | ✅ 已 Read 确认 |

### SVG 视觉方案（每页）

| 页 | SVG 内容 | 位置 / 尺寸 | 等级 |
| :- | :------- | :--------- | :--- |
| 01 | 剪贴板 + 对勾 + 日历格 | 右侧，约 520×420 | L1 |
| 02 | —（仅 L3 紫色序号圆徽标） | 每章标题左，40×40 | L3 |
| 03 | 半透明紫圆 + 剪贴板轮廓 | 全幅背景，opacity 0.14 | L1(atmosphere) |
| 04 | 三段流程条：Susun → Petugas → Umumkan | 左栏，约 560×440 | L1 |
| 05 | 半透明紫圆 + 钥匙 + 徽章 | 全幅背景，opacity 0.14 | L1(atmosphere) |
| 06 | 两栏对照：centang (boleh) vs silang (tidak boleh) | 右栏，约 380×360 | L2 |
| 07 | 半透明紫圆 + 日历格 + 铅笔 | 全幅背景，opacity 0.14 | L1(atmosphere) |
| 08 | 表格 jadwal：baris tanggal + kolom menu | 上方，约 1100×300 | L1 |
| 09 | 对话框 teks → panah → tabel pratinjau | 右侧，约 560×470 | L1 |
| 10 | Dropdown berisi nama siswa + baris "orang tua" otomatis | 右上，约 300×220 | L2 |
| 11 | 半透明紫圆 + 锁 + 喇叭 | 全幅背景，opacity 0.14 | L1(atmosphere) |
| 12 | 三段状态条：bisa diubah → dikunci → terbit | 右侧，约 420×360 | L1 |
| 13 | 表格 + tiga kotak centang terisi | 左栏，约 560×440 | L1 |
| 14 | —（每卡一个 inline `<svg>` 32px，统一实心） | 卡内顶部 | L3 |
| 15 | 光晕圆 + logo | 居中 | L1 |

**L3 位置一致性**：第 02/14 页的 L3 徽标固定在该卡片/条目**左侧顶部**，全篇位置一致。

**Ikon wajib inline `<svg>`, bukan `<FAIcon>`**: `icon://fa/...` tidak pernah terselesaikan di
mesin ini — 17 ikon dek sebelumnya pernah tersimpan sebagai gambar "broken image" abu-abu.
Karena itu setiap ikon ditulis `<svg viewBox="..."><path fill="..." d="..."/></svg>` dengan path
Font Awesome Free 6.5.2 **solid** yang disematkan langsung. Sumber path:
`https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/svgs/solid/<nama>.svg`
(nama FA6 untuk yang berganti: `circle-exclamation`, `rotate-left`, `magnifying-glass`, `house`).

---

## 6. 页面映射表（契约）

| # | 文件 | 类型 | 角色 | 版式 | L1 文件 | 字数估算 | 留白% | 色彩分配 | 关键约束 |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | `slides/01.slide` | cover | hero | 全屏视觉+骑线文字 | app_logo.png + SVG | 35 | 38% | 主55/辅25/强12 | 左侧大标题，右侧 logo 400×400 |
| 02 | `slides/02.slide` | catalog | supporting | 左标题+右内容 | L3 序号徽标 | 130 | 25% | 主20/辅20/强5 | 每章 ≥ 30 字说明 + 页码区间 |
| 03 | `slides/03.slide` | section | transition | 全屏视觉+大标题 | SVG 抽象几何 | 30 | 45% | 主60/辅15/强5 | 紫底反白，编号 01 巨大 |
| 04 | `slides/04.slide` | content | supporting | 左大图+右侧文字 | SVG 三段流程 | 200 | 22% | 主30/辅22/强8 | 插画占左 55%，右栏 3 条 |
| 05 | `slides/05.slide` | section | transition | 全屏视觉+大标题 | SVG 钥匙徽章 | 30 | 45% | 主60/辅15/强5 | 紫底反白，编号 02 |
| 06 | `slides/06.slide` | content | supporting | 非对称双栏 60:40 | SVG 对照栏 | 210 | 22% | 主28/辅22/强5 | 左 60% 两卡，右 40% 插画 |
| 07 | `slides/07.slide` | section | transition | 全屏视觉+大标题 | SVG 日历铅笔 | 30 | 45% | 主60/辅15/强5 | 紫底反白，编号 03 |
| 08 | `slides/08.slide` | content | supporting | 上大图+下方卡片 | SVG 表格 jadwal | 200 | 20% | 主25/辅20/强8 | 插画占上 58%，下方两卡 60:40 |
| 09 | `slides/09.slide` | content | hero | 全幅图+骑线文字 | SVG 对话框→pratinjau | 110 | 40% | 主50/辅15/强18 | 巨型短语 44px + CTA 强调色 |
| 10 | `slides/10.slide` | content | supporting | 左标题+右内容 | SVG dropdown | 190 | 24% | 主25/辅20/强5 | 左紫窄栏 30%，右 3 条 + 用例 |
| 11 | `slides/11.slide` | section | transition | 全屏视觉+大标题 | SVG 锁+喇叭 | 30 | 45% | 主60/辅15/强5 | 紫底反白，编号 04 |
| 12 | `slides/12.slide` | content | hero | 巨型文字+洞察 | SVG 三段状态条 | 140 | 40% | 主45/辅15/强20 | 巨型短语 **64px**，禁止塞角落 |
| 13 | `slides/13.slide` | content | supporting | 左大图+右侧文字 | SVG 表格+centang | 190 | 22% | 主30/辅20/强10 | 插画占左 55%，右栏 3 条 |
| 14 | `slides/14.slide` | content | supporting | N卡片横排（仅此 1 次） | L3 ikon×4 | 230 | 22% | 主25/辅25/强5 | 4 卡，每卡 ≥ 55 字，尾条底栏锚定 |
| 15 | `slides/15.slide` | ending | hero | 全屏视觉+大标题 | app_logo.png | 45 | 45% | 主55/辅15/强12 | logo 居中 200×200 + 一句落款 |

---

## 7. 通用禁忌复核

- 每页仅用上表 4 种 hex + 2 中性色，不自创色。
- 全篇 L1 视觉类型统一（手写 SVG 扁平插画 + 1 张 logo）。
- 标题块右侧**不塞装饰小图**；L3 位置全篇一致。
- 每页 ≥ 1 个视觉锚点（≥44px 元素 或 ≥40% B 区面积的图）。
