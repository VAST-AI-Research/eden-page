# CLAUDE.md — project_page

Eden（generative models for interaction and simulation）的团队主页 + 项目宣传网页。
纯静态：无构建、无依赖、无框架。双击 `index.html` 即可预览。

## 目录结构

```
project_page/
├── index.html            # 主页面：只有骨架 + SEO meta，内容全靠 JS 注入
├── css/style.css         # 全部样式。分 10 段，每段有 /* === N. NAME === */ 分隔注释
├── js/app.js             # 主逻辑。IIFE，无导出
├── js/viewers/*.js       # 三维查看器（ES module，点击才动态 import）
├── data/projects.js      # ★ 内容数据（window.SITE_DATA，含 projects/papers/posts 三个数组）
├── data/astra-cameras.json # compareViewer 的相机元数据（「重置视角」要用）
├── vendor/               # vendored three.js r180（MIT），不引 CDN、不要构建
├── pages/                # 独立子应用，每个一个自包含目录（见「独立子页」一节）
│   └── ccm-workflow/     #   CCM 分步工作流：index.html + 自己的 css/ js/ data/
├── assets/
│   ├── logo.svg          # header 里的标志（由 site.logo 引用，见「标志」一节）
│   ├── favicon.svg       # 标签页图标（logo 的 16px 版，index.html 里单独引用）
│   ├── thumbs/*.jpg      # 列表卡片缩略图（生成的示意图，见「缩略图」一节）
│   ├── edenlive/clips/   # EdenLive 的 60 张动图（条带 + 四节应用）+ 宣传片，见「素材」
│   ├── {multilive,mira-scene,stereo-world}/ # 三篇论文的动图、图片、宣传片
│   └── placeholder/*.svg # 占位素材，真素材进来后应逐步删除
└── README.md             # 面向使用者的替换/部署说明
```

## 核心约定

**内容与呈现严格分离。** 加项目、改文案、换图 → 只动 `data/projects.js`。
改版式、配色、动效 → 只动 `css/style.css`。加新的 section 类型 → 动 `js/app.js`。
不要把项目文案写进 `index.html`，那里只留骨架和无 JS 时的兜底文本。

**数据来源双通道。** `js/app.js` 的 `loadData()` 优先读 `window.SITE_DATA`（由
`data/projects.js` 挂上），失败才 `fetch('data/projects.json')`。用 JS 文件的理由是
`file://` 协议下 `fetch` 会被浏览器拦掉，而团队大概率会直接双击 HTML 预览。
如果以后换成 JSON，记得同时删掉 `index.html` 里那行 `<script src="data/projects.js">`。

**三种视图，全靠 query string 区分**，没有真实子页面（都是同一个 index.html）：

| URL | view | 内容 |
|---|---|---|
| `index.html` | `home` | 团队主张 + 每个栏目前 3 条预览 |
| `index.html?s=project` | `list` | 该栏目的全部条目（`project` / `research` / `blog`） |
| `index.html?p=<id>` | `detail` | 完整项目/论文/文章主页 |

`parseRoute()` 解析 URL → `render(data, route)` 分发到 `renderHomeSections` /
`renderList` / `renderDetail`。`history.pushState` + `popstate` 处理前进后退。
未知的 `?s=` 或 `?p=` 都回落到 home，不报错。
**`id` 一旦发出去就不要改**，改了等于换 URL。

栏目由 `data.nav[]` 定义（顺序 = header 里的顺序，当前 Project → Research → Blog），
`key` 到数据数组的映射写在 `js/app.js` 的 `NAV_SOURCE` 常量里：

```js
const NAV_SOURCE = { project: 'projects', research: 'papers', blog: 'posts' };
```

`itemsOf(data, key)` 只是查这张表。**加新栏目只要往 `NAV_SOURCE` 加一行 + 往数据的
`nav[]` 加一项**，不用改任何渲染函数；`boot()` 的「有没有内容」判断也是遍历
`NAV_SOURCE` 得出的，不会漏掉新栏目。注意 `research` 对应的数组叫 `papers[]`，
不是 `projects[]` —— `projects[]` 属于 Project 栏目。

条目卡片的元信息行按栏目分：`blog` 显示日期 + 阅读时长，其余栏目显示 `venue` + `badge`，
没写 `venue` 时退回 `date`（项目一般没有 venue）。

项目切换器只在 detail 视图出现，且只列**同栏目**的条目 —— 跨栏目跳转走 header
主导航。列表页会 `switcher.hidden = true`。

## 中英双语（i18n）

**数据里任何面向读者的字段都可以写成 `{ zh: "中文", en: "English" }`**，也可以直接写
一个字符串 —— 那就两种语言共用（人名、会议名、数字、代码、URL 都适合这样）。
某个语言缺失会自动回落到另一个，不会渲染出空白或 `undefined`。

两个取值函数，**别绕过它们直接读数据字段**：

- `t(v)` —— 取内容字段。`t({zh,en})` 按当前语言返回；传字符串/数字原样返回；
  传不含 `zh`/`en` 键的对象（比如 `{src, poster}`）也原样返回，不会误伤结构化数据。
- `ui(key, ...args)` —— 取界面文案（按钮、提示、"查看全部 N 项"这类）。
  文案表在 `UI` 常量里，`zh` 和 `en` 两份必须同时加，漏了会回落到中文。
- `plain(v)` —— `t()` 之后再剥掉标题里的 `*` 强调标记，用于 meta、`aria-label`、
  切换器按钮这些纯文本场合。

**改动时最容易犯的三个错：**

1. **变量名 `t` 会遮蔽 i18n 函数。** 历史上 `renderHero` 用 `const t = el('figure')`、
   `table()` 用 `const t = el('table')`、`initLightbox` 用 `forEach((t) => ...)`，
   现在都改名了（`fig` / `table` / `tile`）。写新代码不要再用 `t` 当局部变量名。
2. **新增渲染分支忘了套 `t()`。** 任何 `esc(x)` / `rich(x)` 里的 `x` 只要来自数据，
   就必须是 `t(x)`。忘了的话中文模式下会显示成 `[object Object]`。
3. **界面文案硬编码中文。** 新加的按钮文字、空状态提示走 `ui()`，别直接写字符串。

语言状态存在 `localStorage['pp-lang']`，首次访问按 `navigator.language` 猜。
切语言的实现是 `initLang(rerender)`：改 `LANG` → 重画 header/页脚的静态文案和
`aria-label` → 调 `rerender()` 原地重渲染当前视图。**不改 URL、不跳回顶部**
（所以语言不体现在链接里，分享出去的链接会用对方自己的语言偏好打开）。

`document.documentElement.lang` 会跟着切成 `zh-CN` / `en`。
`index.html` 里那些静态 `aria-label` 和 skip-link 文字是无 JS 时的兜底值，
运行时由 `initLang()` 的 `paint()` 覆盖 —— 加新的静态文案记得往 `paint()` 里补一行。

## 数据契约（data/projects.js）

下面标 `L` 的字段可以写 `{zh, en}`（也可以写纯字符串两语共用）；
没标的是 URL、id、枚举值这类不该翻译的。

```js
window.SITE_DATA = {
  site: {
    team L, teamShort L, tagline L, logo,
    links: [{ label L, href, icon }],
    footer: { note L, credit L, contact },       // credit 可省略，省了整行隐藏
  },
  home: { title L, intro L },                    // 首页 hero，title 支持 *星号* 强调
  nav: [{ key, label L, title L, intro L }],     // key ∈ project | research | blog
  projects: [ ... ],                             // Project 栏目，结构同下，一般无 venue/bibtex
  posts: [ ... ],                                // Blog 条目，结构同下
  papers: [{                                     // Research 栏目
    id, date, thumb, keywords: [L],
    title L, short L, subtitle L,
    venue L, badge L, venueNote L,               // venue 一般不用翻，写字符串即可
    authors: [{ name L, url, affil: [1,2], note L, bold: true }],   // bold = 重点作者
    affiliations: [L],         // 数组下标+1 对应 authors[].affil 里的数字
    authorNotes L,
    links: [{ label L, href, icon }],
    teaser: { src, poster, alt L, caption L },
    highlights: [{ value L, label L }],
    abstract L,
    sections: [...],           // 有序，见下
    bibtex,                    // 代码，不分语言
    acknowledgements L,
  }]
}
```

除 `id` / `title` 外几乎所有字段都可省略，渲染函数都做了空值判断。
数组顺序 = 列表页和切换器里的顺序，想置顶就往前挪（没有 `featured` 字段了）。
`projects[]` / `papers[]` / `posts[]` 三个数组的 `id` 不能重名 —— 共用 `?p=` 命名空间。

三个数组用的是**同一套字段和同一套渲染函数**，区别只在于习惯上填哪几个：

- `papers[]` —— 有 `venue` / `badge` / `authors[]` / `affiliations[]` / `bibtex`。
- `projects[]` —— 一般没有 `venue` 和 `bibtex`，重点是 demo / 代码 / 权重链接，
  建议 sections 按「能做什么 → 怎么跑 → 已知限制」排。
- `posts[]` —— 用 `author`（单个人名）和 `readingTime` 代替 `authors[]` / `affiliations[]`。

`authors[].bold: true` 把名字加粗，用来标共一 / 项目负责人 / 通讯这类重点作者。
加粗只作用在名字上，不含 `note` 的标注符号（`*` `†` `✉` 跟着变粗会很脏）。
渲染成 `<strong>` 而不是纯 CSS 类，屏幕阅读器也能听出这个强调；CSS 里字重写死 710
而不是靠 `bolder` —— 那是相对父级算的，链接里父级 560、纯文本 400，同一行会粗细不一。

表格的 `columns[]` 和 `rows[][]` 里**每个单元格**都能单独写 `{zh, en}`，
数字列直接写字符串就行 —— 见 `data/projects.js` 里 mira-sim-bench 的表格。

### 标题强调

`title` 里用 `*星号*` 包住的词会被 `titleHTML()` 渲染成 `<em>`，显示为品牌色。
其余部分照常转义。一个标题里强调一处最好看，两处以上会花。
`short` 和各处 meta 会把星号剥掉，所以不用为切换器另写一份标题。

**长标题可以用 `titleBreakAfter` 手动指定断行位置**（详情页大标题专用）。
给一个 `title` 的**原样前缀**，`heroTitleHTML()` 会在它后面插一个硬 `<br>`：

```js
title:           "Mira-Scene: *Pixel-Aligned Layouts* for Generative 3D Scene Reconstruction",
titleBreakAfter: { zh: "", en: "Mira-Scene: *Pixel-Aligned Layouts*" },
```

三个坑：

- **前缀要连星号一起写** —— 匹配是在原始字符串上做的，不是渲染后的 HTML。
- **只作用于详情页 hero。** 列表卡片和切换器仍走 `titleHTML()`，那两处宽度小得多，
  硬塞 `<br>` 会在不该断的地方断开。720px 以下 CSS 也会把这个断点取消
  （窄屏每行本来就放不下，再强制断只会多出一行很短的）。
- **某个语言不需要断行就显式写空串**，别省略那个 key。省略的话 `t()` 会回落到
  另一个语言的前缀 —— 大概率匹配不上、结果也对，但那是靠巧合，改标题时容易出意外。

前缀对不上（改了标题忘了改前缀）会整句照原样输出，不会渲染出半截标题。
配套地，论文详情页的标题行宽是 36ch 而不是 `.hero__title` 默认的 26ch ——
26ch 是给短标题定的，长标题会被挤成三行。

### section 类型

`js/app.js` 里的 `SECTION_RENDERERS` 是一张 `type -> 渲染函数` 的表。已支持：

| type | 必需字段 | 说明 |
|---|---|---|
| `text` | `body` | 纯文字段落 |
| `figure` | `src` | 图/视频/动图 + caption，`video` 是它的别名；动图要写 `ratio` |
| `gallery` | `items[]` | 网格，点开进灯箱，`columns: 2\|3\|4\|"2-fixed"` |
| `carousel` | `items[]` | 轮播，一页 `perPage` 个（默认 2），左右翻页；放动图要写 `ratio` |
| `compare` | `before`, `after` | 拖动滑块前后对比 |
| `table` | `columns[]`, `rows[]` | `highlightRows: [3]` 高亮我们的方法（0-based） |
| `features` | `items[]` | 卖点卡片，`icon` 见下 |
| `steps` | `items[]` | 编号步骤，适合放安装/运行命令 |
| `sceneViewer` | `items[]` | 可旋转的三维场景网格（three.js），点击才加载 |
| `compareViewer` | `cases[]` | 并排双查看器，一次一个案例，按钮切换 |

**`gallery` 还是 `carousel`？** 横屏视频用 `carousel` —— 网格里每个都太小，
轮播一次只放 `perPage` 个（默认 2，上下排列）能给足宽度。竖图、多图速览用 `gallery`。
StereoWorld 的 5 个视频 section 全是 `carousel`。

`carousel` 的行为：左右按钮 + 底部圆点 + 键盘左右键翻页（焦点在 `<video>` 上时
不抢，那时左右键是快退/快进）。**不循环**，到头按钮 `disabled`。样例带控制条、
**不进灯箱** —— 视频要能点着播，再套一层「点击放大」的 button 会抢掉播放和拖进度条。
放大用浏览器自带全屏。只够一页时自动隐藏翻页控件。
视频是懒加载的：只有当前页和相邻页会真的下载，翻出视野的会 `pause()`，
不然几十个视频一起解码，风扇直接起飞。

**轮播和插图里的动图**：轮播的 `items[].src`、`figure` 的 `src` 都可以是动态图
（`.avif` / `.gif`）。除了宣传片，EdenLive 和三篇论文页面上的视频都已经转成了整段的
AVIF：EdenLive 四节应用 33 张，MultiLive / Mira-Scene / StereoWorld 共 62 张
（61 张轮播样例 + StereoWorld 的 motivation 插图）。和视频样例的区别：

- 暂停按钮照样有，对动图来说暂停 = 定格（和顶部条带共用 `freezeAnim()`）。
  图要完整下完才定得了格，所以下完之前按钮藏着。接线在 `initAnimFrames()`，
  轮播和插图共用；轮播自己只管「哪一页才填 `src`」。
- **只有当前页会下载，相邻页不预热。** 视频的预热只取元数据，图一填 `src` 就是
  下整个文件（一张几 MB），会和当前页抢带宽。翻走时没下完的图会被撤掉 `src`，
  翻回来重新要。断了会重试两次，已经翻走的页不重试。
- **下完之前格子是骨架，按那一节的 `ratio` 占位**（写在 section 上，如
  `ratio: "1664 / 480"`），图到了交给图自己的比例。**动图一律要写 `ratio`**：不写就按
  EdenLive 素材的 1280/704，比例不对图到时会跳 —— Mira-Scene 那张 1280×530 的
  流程动图没写时，载入那一下页面缩了 122px。几 MB 的动图是边下边播的，
  第一帧一到就把骨架盖住。
- `prefers-reduced-motion` 下载过程中图是藏着的，下完直接定格。
- 判断靠扩展名（`isAnim()`），所以**静态图别用 `.avif` / `.gif` 放进轮播或插图**，
  不然会多出一个没用的暂停按钮。

**宣传片（teaser）保留为视频**：要能拖进度条，而且 StereoWorld 和 Mira-Scene 的
带声音，动图没有音轨。转之前先看音轨是不是真有声音（`volumedetect` 的 mean 在 −90dB
左右就是导出时附带的静音轨，StereoWorld 的 motivation 就是这样才转的）。

转换命令（源是 HF dataset 里同名的 `.mp4`，见「素材」一节；产物放进仓库的同一路径，
如 `assets/edenlive/clips/`、`assets/stereo-world/stereo_video/`）：

```bash
# 整段、原分辨率、原帧率。CRF 38 不封码率：封顶会让画面复杂的片段整块糊成色块，
# 实测封在 1.5Mbps 时最差那一帧 VMAF 只有 30。
ffmpeg -i <名字>.mp4 -vf format=yuv420p -c:v libsvtav1 -crf 38 -preset 5 -g 240 \
  -an -loop 0 -f avif <名字>.avif
```

**画质底线：平均 VMAF ≥ 92、「最差 1%」≥ 85**，达不到的降 CRF 重转（先 30，太大就
取中间的 34）。CRF 38 对大多数素材够用，但 StereoWorld 那种左右眼并排、地面纹理细的
会被抹平一层（`varied_scene_074` 最差 1% 只有 81）。三篇论文里有 10 段走了重转：
9 段 CRF 30，`ar_demo/custom_varied_021` CRF 34（CRF 30 转出来和原视频一样大）。
现在这 62 张平均 VMAF 92.0~99.6，最差 1% 都在 85 以上。EdenLive 那 33 张是定这条线
之前转的，只有 `bb6c2841`（91.8 / 84.1）略低，看过最差帧可以接受，没有重转。
（条带的 27 张小图是装饰、另有一套参数，不适用这条线。）

验 VMAF 时别被片尾的最低分吓到：有的原片最后一两帧时长不规整（停留 2~4 个帧长），
AVIF 按恒定帧率会补出重复帧，逐帧比对时片尾就错开了，最低分能掉到 20 多。
看「最差 1%」，片尾的低分要抽帧肉眼对一下（2819fbee、65e47fb6 就是这样，画面没问题）。

`gallery` 的 `columns` 写数字（`2/3/4`）时是 `auto-fit`，实际列数由容器宽度决定；
写 `"2-fixed"` 则宽屏固定两列、660px 以下塌成一列。后者留给**本身已是多路并排拼接**
的素材（比如「参考 | 视角1 | 视角2」concat 在一个视频里），避免每路被挤到几十像素宽。

### 三维查看器（sceneViewer / compareViewer）

这两个 type 跑的是 vendored 的 three.js r180（`vendor/three/` + `vendor/utils/`，
MIT，共 6 个文件约 2.2MB，模块闭包自洽、无外部请求）。**不违反「无依赖」的约定**
—— 依赖是仓库内 vendored 的，不引 CDN、不要构建步骤。

**重资产一律点击才加载。** 默认只渲染预览图 + 一个「载入」按钮；读者点了才
动态 `import()` three.js 并抓 GLB。单个模型 10~44MB，绝不能自动下载。
`import()` 的结果缓存下来，第二次点不再走网络。

- `sceneViewer.items[]` 每项：`{ id, model, environment, poster, caption?, workflow? }`。
  `workflow` 给了才显示「查看 CCM workflow →」链接（Mira-Scene 只前 4 个案例有）。
  查看器支持拖动旋转、滚轮缩放、环境全景水平旋转（滑块）。
- `compareViewer` 的版式是**顶上一行缩略图选择条 + 下面两块常驻的查看器站位**
  （照原项目页）。`cases[]` 每项 `{ id, label, left, right, poster }`，外加
  `leftLabel` / `rightLabel`（默认「从零搭建 / 用 Mira-Scene」）。
  `poster` 在这里是缩略图条里那张小图，不是「点了才换成查看器」的预览图 ——
  **这一节没有「载入」按钮**：两块查看器一直占着位子，选中哪个案例就直接加载那一对。
  这节的意义就是对比，让读者先点一次载入再点缩略图是多余的一步。
  我们在原站基础上改了一点：**默认选中并加载第一个案例**，进来就有东西看，
  不是两个空框。切换案例时先 dispose 旧的一对再加载新的，全程只有两个 context。
  缩略图条是 listbox 语义 + roving tabindex：整条只占一个 Tab 停留点，
  进去用左右方向键走，Home/End 跳首尾。

  **`cameras` 字段必须给，否则「重置视角」是坏的。** 它指向一张相机元数据表
  （`data/astra-cameras.json`，18KB，从原站 manifest 提取，只留 `cameras` 和
  `export_mesh_objects`）。每个 GLB 的 `cameras` 里有一项 `default: true`，
  那是原作者渲参考图用的机位 —— `Reset view` 就是回到它。不给这张表的话
  `defaultCamera` 会退化成 `overview`（斜上方俯视），点重置就对不上缩略图了。
  表按 `cases[].id` 索引，所以 `id` 也不能省。整张表一次性取回来缓存，
  切案例不重复请求。

**资源上限是被显存逼出来的，别绕过。** 浏览器对 WebGL context 有硬上限（Chrome
约 16），十几个查看器同时活著会把最早的静默丢掉、画面变黑。所以
`initSceneViewers` 自己做 LRU：单场景最多 `MAX_LIVE`(6) 个、并排对比占两个
context 所以按 5 个收，超额自动 dispose 最早载入的并退回到预览图。切语言 /
切视图会整页重渲染，离开前 `disposeAllViewers()` 必须把所有 canvas 显式
dispose —— `innerHTML=''` 只摘 DOM，GPU 资源和 rAF 循环不会自己停。

实现分两层：`js/viewers/scene-viewer.js` 和 `js/viewers/compare-viewer.js` 是
纯 three.js 的查看器类（从原项目页移植，界面文案已改成由 app.js 用 `setStrings()`
注入，不硬编码英文）；DOM 和接线在 `js/app.js` 的两个 renderer + `initSceneViewers()`。
样式在 css 第 7 段。**canvas 容器必须有确定高度**（CSS 用 aspect-ratio 兜底），
three.js 靠 ResizeObserver 读容器尺寸，容器塌成 0 会渲染出一片空白且不报错。

**这两个 type 和 `pages/ccm-workflow/` 在 `file://` 下用不了**，得起个本地服务器：
ES module 和 `import()` 受同源策略限制，`file://` 会被浏览器直接拦掉（和 `fetch`
一样的原因，见前面「数据来源双通道」）。页面其余部分照旧双击可看 —— 查看器加载
失败只会停在「载入失败」那行状态文字上，不影响别的 section。本地预览：

```bash
python3 -m http.server 8000     # 然后开 http://localhost:8000/
```

部署到 GitHub Pages / 任意静态托管都是 http(s)，没这个问题。

### 独立子页（pages/）

有些东西不是我们这套模板的一个 section，而是自带引擎的完整应用。它们放在
`pages/<名字>/` 下，**每个目录自包含**：一个 `index.html` 加它私有的
`css/ js/ data/`。这样根目录只剩主站，新增/删除一个子页就是加/删一个文件夹。

目录里的相对路径有固定的层级关系，搬动目录时全都要跟着改：

| 从 | 指向 | 写法 |
|---|---|---|
| `pages/x/index.html` | 自己的 css/js | `css/…`、`js/…` |
| `pages/x/index.html` | 回主站 | `../../index.html?p=<id>` |
| `pages/x/js/*.js` | `vendor/` | `../../../vendor/…`（三级） |
| 子页内的 fetch | 自己的 data | `new URL('data/x.json', root)`，root 是页面所在目录 |

主站那边用**目录形式**链过去（`pages/ccm-workflow/?case=<id>`），不写
`index.html` —— 静态托管会自动出目录索引，这样以后重命名文件也不影响外链。

**现有的子页：`pages/ccm-workflow/`** —— Mira-Scene 的分步工作流
（分割 → 重建 → 场景搭建），从原站整体搬来的独立应用：自带 `js/demo.js`(88KB)
和 `css/demo.css`(46KB)，还 monkey-patch 了 `window.fetch` 把 `/api/demo/` 请求
转成读静态 manifest。它和我们的 section 体系完全不是一个东西，只能这样挂。
入口是 sceneViewer 前 4 张卡片上的「查看 CCM workflow →」（`?case=<id>` 原生支持，
新标签页打开）。

素材（152 个文件 146MB，含 37 个 GLB / 29 个 PLY 点云）不在仓库，在外部存储的
`assets/mira-scene/3d/workflow/` 下（见「素材」一节），由 `pages/ccm-workflow/data/manifest.json`
里的绝对地址引用（不是原站 `data/static-demo-cases/` 那种相对路径）。
升级原站版本时，把下面这几处重新套一遍即可（`index.html` 的注释里也写了）：
css/js 路径、manifest 路径、`vendor/` 的三级相对路径、返回链接、标题。

### 缩略图（assets/thumbs/）

列表卡片的 `thumb` 用**生成的示意图**（gpt-image-2.5-sunburst，lumina-imagen 技能），
统一风格，一眼能看出这篇论文的输入和输出。地址走 `data/projects.js` 顶部的 `TH` 常量。

之前是手画的 SVG（几 KB、能靠半透明自适应深浅主题），换掉的原因是：太朴素、
几张摆在一起看不出区别，更说不清这篇论文在做什么。旧文件已删，git 历史里还有。

**统一风格的规则**（加新论文时照这套写 prompt，两张现有的图就是参照）：

- **构图从左到右讲一个故事：输入 → 变换 → 输出。** 左边是方法吃进去的东西，
  中间是那个「关键机制」，右边是产出。别画成一堆并列的图标，读者要能看出因果。
- 扁平矢量技术插画风，2px 细线，柔和投影，留白充足。不要照片写实、不要 3D 渲染的
  高光和玻璃感、背景不要渐变。
- **配色只有三个**：`#f7f7fa` 暖白底、`#5b4bdb` 品牌紫（结构和线条）、
  `#0fb5a6` 青（**只点一个语义焦点**）。和全站基调一致（见样式系统那节）。
- **prompt 里必须反复强调不放任何文字**（no text / letters / numbers / labels /
  watermarks）。这些模型很爱自己加标注，而 62px 宽下任何字都糊成一团。
  实测把这条写三遍比写一遍管用。
- 提一句「matching a sibling figure about ...，so the two look like a set」，
  新图才会和已有的那几张像一套而不是各画各的。

**两条硬约束**：

- **比例 16:10**，对齐 `.item__media` 的 `aspect-ratio`，卡片里零裁切。
  注意网关只认 `16:9 / 1:1 / 3:4 / 4:3 / 9:16`，**没有 16:10** ——
  用 `--ratio 4:3` 生成再居中裁成 16:10（写在下面的脚本里）。
  详情页切换器是 62×42（1.476），会左右各裁掉约 4%，所以主要内容别贴边。
- **按原分辨率存盘（2400×1500），不要预先缩小成 288px。** 缩了在高分屏上会糊，
  交给浏览器按 CSS 缩放。体积靠 JPEG 控制：quality 90 约 260~320KB、PSNR 46dB
  肉眼无损；再往下压到 82 能省 30% 但线条边缘会开始起噪点。也别转 WebP。

**光栅图适配不了深色主题** —— 这是相比 SVG 唯一的退步。`<img>` 拿不到页面的
CSS 变量，没法像以前那样靠半透明透出卡片底色。所以底色统一定在暖白
（实测两张图四角都落在 245,243,249 附近），在深色主题下会是一块亮色卡片。
这是接受的取舍：清晰表达方法 > 完美融入两种主题。

生成和落盘（`TH` 就是仓库里的 `assets/thumbs/`）：

```bash
# 1. 生成（prompt 写进文件，避免 shell 转义问题）
python3 <skills>/lumina-imagen/scripts/lumina_imagen.py generate \
  --model gpt-image-2.5-sunburst --prompt-file /tmp/x.txt \
  --ratio 4:3 --image-size 2K --output /tmp/raw.png

# 2. 居中裁成 16:10 + 转 JPEG（保持原分辨率），直接存进仓库
python3 -c "
from PIL import Image
im=Image.open('/tmp/raw.png').convert('RGB'); W,H=im.size
nh=int(W/(16/10)); top=(H-nh)//2
im.crop((0,top,W,top+nh)).save('assets/thumbs/<名字>.jpg','JPEG',quality=90,optimize=True,progressive=True)"
```

**验收**：别只看大图。把成品按 288px（卡片）和 62px（切换器）两个真实尺寸缩一遍
再看，顺手统计一下配色分布确认没跑偏 —— 模型经常偷偷加进第四个颜色。

### 图标

`js/app.js` 顶部 `ICONS` 是内联 SVG 字典（无外部图标库）。现有 key：
`paper arxiv code github video demo hf data twitter link spark bolt check copy caret close slider zoom back arrow sun moon`。
`links[].icon` 和 `features.items[].icon` 引用这些 key，不认识的 key 回退到 `link`。
加图标就往 `ICONS` 里加一条，viewBox 统一 `0 0 24 24`。

### 标志（logo.svg / favicon.svg）

图形是一个「带把的苹果」：不完全对称的空心果身、略向左弯的果梗，以及向右上探出的
偏置叶片。左肩更低、右侧更宽、底部略向左收，避免落入常见系统苹果图标的剪影套路；
顶部的凹口和偏置叶片是主要识别点，也呼应 Eden 的生长意象。

- **没有背景板。** 图形是纯品牌紫轮廓、果梗和叶片，底色透出页面自己的，所以**深浅两种主题
  都能直接用**。`.brand__logo` 上**不要加 `border-radius`**，否则会削掉轮廓边缘。
- **图形占满 viewBox**：果身和叶片的实际边界约在 `7..58`，四周留出安全边距，适合
  header 的 34px 尺寸。改几何后要重新按 34/26/16px 渲染检查，不要只看大图。
- `favicon.svg` 是 16px 专用版：沿用同一轮廓，但果身和果梗笔画更粗，让小尺寸下的
  苹果仍然保持完整。**改 logo 记得同步改 favicon。**
- header 里品牌区刻意比导航大一档半（logo 34px、`.brand__name` 1.22rem，
  而导航是 `--step--1`）：「Eden」是站点身份，Project/Research/Blog 是次级入口。
  窄屏（660px 以下）收到 29px / 1.1rem，免得把导航挤出去。

**怎么验**：装了 `cairosvg`（`/tmp/svgenv`，见下面的命令），按 34/26/16 三个真实
尺寸渲染成 PNG 再看。光看 512px 大图判断不了小尺寸会不会糊 —— 这个标志的箭尖
和缺口就是只有小尺寸才暴露问题的地方。浅色深色两种底都要过。

```bash
python3 -m venv /tmp/svgenv && /tmp/svgenv/bin/pip install -q cairosvg pillow
/tmp/svgenv/bin/python -c "
import cairosvg
for s in (34,26,16):
    cairosvg.svg2png(url='assets/logo.svg', write_to=f'/tmp/logo-{s}.png',
                     output_width=s, output_height=s)"
```

### 媒体

`renderMedia()` 按扩展名判断：`.mp4/.webm/.mov/.m4v` → `<video>`（muted+loop+playsinline，
自动播放），其他 → `<img loading="lazy">`。所以数据里写 `src` 就行，不用声明是图是视频。
`prefers-reduced-motion` 下自动关掉 autoplay 并显示控制条。

两个可选项：

- `controls` 默认跟 `autoplay` 反着走（自动播的当装饰、不给控制条），但可以显式传
  `controls: true` 覆盖。**teaser 和轮播里的样例都传了** —— 那些是页面主内容，
  读者要能暂停、拖进度条。注意仍然要 `muted`，否则浏览器直接拦掉自动播放。
- `lazy: true` 只把地址写进 `data-src`、`preload="none"`，先不加载。轮播用它，
  由 `initCarousel` 在翻到那一页时 `setAttribute('src', ...)`。
  用 `setAttribute` 而不是 `v.src = ...`：后者读回来会变成绝对地址，
  `video[data-src]` 选择器和「填过没有」的判断都不好写。

### 素材

页面上的视频、图片、动图都在仓库的 `assets/<项目>/` 下，跟站点一起部署、同源加载
（约 306MB）。`data/projects.js` 顶部的 `SW` / `MS` / `ML` / `TH` / `EL` 是这几个目录
相对 `index.html` 的前缀。进仓库前都压过：

- **视频 → 动态 AVIF**，命令和画质底线见「轮播和插图里的动图」和「滚动条带」两段。
  Mira-Scene 的流程图原本是 4.6MB 的 GIF，也转成了 AVIF（线条图用 CRF 30，465KB）。
- **宣传片保留 H.264**（要能拖进度条，有的带声音），都加了 `+faststart`，
  不然要等文件末尾的索引下完才开始播：

  ```bash
  # MultiLive、Mira-Scene：CRF 23。StereoWorld 那段原本就只有 21MB，只重封装（-c copy）。
  ffmpeg -i demo.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy \
    -movflags +faststart out.mp4
  # EdenLive 的原片 117MB，要塞进 25MiB 只能按体积倒推码率，两遍编码
  ffmpeg -i e64ab20b.mp4 -c:v libx264 -preset veryslow -x264-params aq-mode=3 -b:v 1990k \
    -pass 1 -an -f mp4 /dev/null
  ffmpeg -i e64ab20b.mp4 -c:v libx264 -preset veryslow -x264-params aq-mode=3 -b:v 1990k \
    -pass 2 -c:a aac -b:a 96k -movflags +faststart out.mp4
  ```

  EdenLive 这段压完 24.3MiB，VMAF 88.2、最差 1% 74.1，低于动图那条线 ——
  体积卡死了码率，快速运动的镜头会软一点，看过可以接受。720p 同码率反而更差（85.9）。
- **图片 → WebP**（quality 90，宽于 2400 的先缩到 2400）：PNG 一律转，JPEG 超过
  300KB 才转，转完省不到 25% 的保留原图。缩略图按「缩略图」一节保持 JPEG。

**原件在两个 HF dataset 里**（`huanngzh/page-assets`、`ToRealU/eden-page-assets`），
路径和仓库里一一对应（`assets/<项目>/...`，扩展名可能不同）。要换参数重转就从那边取，
别拿压过的再压一遍。页面不直接引用 HF（2026-10 搬走的）：每个 `resolve/main` 请求都要先
302 到美国的 CDN，跳转地址带签名、每次都不一样，浏览器缓存不住，回访也要全量重下；
大陆还直连不上。

往仓库里放素材守住几条线：

- **单个文件不超过 25MiB** —— Cloudflare Workers 静态资源的上限，超了预览环境部署不上去。
  GitHub 单文件 50MiB 起报警，整站要留在 GitHub Pages 的 1GB 以内。
- **重新生成会让历史变胖**：每覆盖一次，旧文件都永久留在 git 历史里，
  所以调参数先在本地挑好，定稿了再提交。
- `index.html` 的 `og:image` 兜底值是站点域名下的绝对地址（爬虫要绝对地址），换域名时记得改。

**例外：三维模型、CCM workflow 的素材和 MultiLive 的论文 PDF 不在仓库**，放在外部存储
（GLB 单个 7~78MB，连 CCM 一共约 730MB，进仓库会顶到 Pages 的 1GB）。
基地址是 `data/projects.js` 顶部的 `ASSETS`（`MS3` 从它派生），
`pages/ccm-workflow/data/manifest.json` 里写死了同一个地址（JSON 引用不了常量），
**换地址时两处一起改**。这个地址必须允许跨域 GET：三维查看器用 `fetch` 拉 GLB，
CCM 页也要 fetch JSON 和 mask。不允许的话这几处会一起挂，页面其余部分照常，很难第一时间发现。

素材同源之后省掉了跳转、能被缓存，但**跨境链路本身还是慢**：从开发机测 Cloudflare 自家的
测速点也只有约 250KB/s。要给大陆读者真正提速，得在前面再套国内 CDN（要 ICP 备案）。

## 样式系统（css/style.css）

所有设计决策都在第 1 段 TOKENS 的 `:root` 里。**换主题只需要改「品牌色」那几行**
（`--brand` `--brand-2` `--accent`），其余色值用 `color-mix()` 从它们推导。

**整体基调是克制**（师兄反馈过第一版"有点幼稚"）。当前的取舍，改动时请守住：

- **不用渐变填色**。全站只剩顶部阅读进度条一处用渐变，其余（标题强调、数字、
  图标、按钮、表格高亮）全是纯色。渐变字在学术页面上显轻浮。
- **不用彩色色块**。会议信息、TOC 当前项、表格高亮行都靠字重 + 极淡底色 +
  发丝线，不用品牌色胶囊。
- **不做 hover 上浮**。卡片、缩略图、按钮的 hover 只换边框色或透明度，
  不 `translateY`、不 `scale`、不加重阴影。
- **边框用 1px `border` 配 `--border`**，比大范围阴影干净。`--shadow-3/4` 现在只有
  切换器菜单和灯箱在用。
- BibTeX 是**浅底**代码块，不是深色终端风 —— 这是师兄第一条具体反馈。
- 字号用 `--step--2` … `--step-4` 的 `clamp()` 阶梯，不要写死 px。

深色模式：`@media (prefers-color-scheme: dark)` + `[data-theme="dark"]` 两处同样的
token 覆盖。**改了一处必须同步另一处** —— 这是当前最容易漏的地方。
（`:root:not([data-theme="light"])` 的写法是为了让手动选浅色能压过系统深色。）

hero 三层背景：`.hero__aurora`（一团静态淡色晕，不动画）/ `.hero__grid`（网格，
向下淡出）/ `.hero__noise`（内联 SVG 噪点）。都是 `z-index: -1/-2` +
`pointer-events: none`。home / list / detail 三种视图共用，由 `heroBackdrop()` 插入。

**视频背景条**：详情页的条目在数据里写 `backdrop`，标题/作者/按钮就压在视频上。
EdenLive 在用。两种形态：

- `backdrop.rows`：**两行横向滚动的动态图条带**，每行一个动图地址的数组
  （不能填视频，见下面「滚动条带」）。EdenLive 用这个。
- `backdrop.src`：单个铺满的素材（图或视频）。

由 `heroFilm()` 建 DOM、`initHeroStrip()` 驱动滚动，和上面三层**互斥** ——
配了 `backdrop` 就不画网格和晕光，否则网格会透在画面上。几个约定：

- **视频条到按钮行为止就结束**，`TL;DR`、`teaser` 和 `highlights` 另起一个
  `.wrap.hero__below` 落在条外面的正常背景上 —— 一段装饰视频压在真正要读者看的
  内容底下是本末倒置。所以 `renderHero()` 带 backdrop 时会生成两个 `.wrap`。
- 条高 `min(760px, 100vh)`。小屏跟着视口收，否则手机上要滑很久才见正文。
- **目录在这种页面上要滑过视频条才出现**（`initTocGate()`）：条上压着标题和按钮，
  右侧再浮一列章节名会打架。实现是 IO 盯 `.hero__band` 的可见性，
  在 `#toc` 上挂 `data-gated="hidden|shown"`，CSS 用 opacity + visibility 淡入
  （不用 `display:none` —— 那会让 IO 失去观测目标）。
  没有 band 的页面不挂这个属性，目录一直显示，和原来一样。
- 背景纯装饰：`aria-hidden` + `inert`、不给控制条。真正要读者看的是 `teaser`。
- 上面压一层 `.hero__film-shade` 渐变蒙版（不是纯色平铺 —— 那样画面会整体发灰）。
  压得克制：素材本身是要给人看的。文字那一侧稍重、右半边基本放开，
  标题和作者再各自加一点很轻的 `text-shadow` 扛住花背景 ——
  比继续压暗整块画面划算。

**滚动条带（`initHeroStrip()`）的几个坑**，改它之前先看这段：

- 位移用 rAF 按「每秒多少 px」算，**不用 CSS animation** —— 要能随时暂停，
  并且 resize 改了格宽之后接着原进度走，不是跳回起点。
- **每一格始终循环播自己那一段**。格子滚出视野就被搬到队列另一头，
  所以回收**必须发生在视野外**：正向（往左跑）回收首格 `append`，
  反向（往右跑）回收末格 `prepend`。两个方向搞成同一种，
  反向行就会每隔十几秒把一个**正在看的**格子抽走，看起来像「这一格的画面
  播着忽然换成了另一段」。曾经就是这个 bug。
- 同理，懒加载判定里的 `shift` 要和 transform 用同一个值
  （反向行是 `offset - stride`），否则可见范围整体偏一格。
- **每格是一张动态图（AVIF），不是 `<video>`。** 原来是 27 路 832×480、约 4Mbps
  的视频同时播，带宽供不上，慢网下只看到一排转不出来的空格。现在每格是同名 clip
  前 12 秒（5 秒 wipe + 7 秒生成画面）做的循环动图，平均 190KB，27 张共 5MB。
- **懒加载 + 骨架**：只有滚到视野附近才填 `src`。图到之前格子是骨架
  （`.hero__tile` 的呼吸动画，只动透明度，不做渐变扫光），到了打 `data-loaded` 淡入。
  加载失败先重试一次（跨境链路偶尔把传输断在半截），再失败才打 `data-failed` 留空。
- **暂停要自己定格**：动图没有暂停 API，`freezeAnim()` 把它画到一张 canvas 上盖住，
  img 由 CSS 藏掉。Chrome 的 `drawImage` 对动图永远画第一帧，所以定住的是开头
  那帧 wipe，不是当前帧。`prefers-reduced-motion` 默认就是暂停态，图一到就定格，
  一帧都不会动。右下角 `.hero__strip-toggle` 让用户掐掉动效和流量。
- 条带在视口外 / 切到别的标签页 / 用户按了暂停时，rAF 停。
- 切走页面时 `heroStripStop()` 会 `removeAttribute('src')`，没下完的图不再接着下。
- 格子里的图用 `object-fit: contain` 而不是 `cover`：这些是生成结果，
  裁掉边缘就看不出画面在干什么了。
- **动图怎么生成**（源是 HF dataset 里同名的 `.mp4`，产物放进仓库的 `assets/edenlive/clips/`）：

  ```bash
  # 500×288 = 一格 253×146 的 2 倍屏尺寸。24fps 的源减半成 fps=12，16fps 的保持 16
  # （非整数倍抽帧会一顿一顿）。mbr=180 是码率封顶：不封的话细节多的片段会到 1.2MB。
  ffmpeg -t 12 -i <短码>.mp4 -vf "fps=16,scale=-2:288:flags=lanczos,format=yuv420p" \
    -c:v libsvtav1 -crf 44 -preset 4 -g 300 -svtav1-params mbr=180 -an -loop 0 -f avif <短码>.avif
  ```

  选 AVIF 是实测出来的：同一段 8 秒，GIF 约 5MB、动态 WebP 约 500KB、AVIF 约 100KB。
  动态 AVIF 要 Chrome 85+ / Firefox 113+ / Safari 16.4+，和全站 `color-mix()` 的
  基线基本一致；更老的 Safari 只显示第一帧。
- 这种 hero 的文字颜色**写死浅色、不跟随深浅主题**，因为背景是自带亮度的画面。
  所以 `@media print` 里除了藏掉 `.hero__film`，还要把这些文字改回 `#000`，
  不然打印出来是白底白字。加新的文字元素到这个 hero 里时记得同步那两处。
- 样式全挂在 `.hero__band` 这个类上（不是 `#hero` 上的标记）—— `#hero` 是跨视图
  复用的节点，但每次 `renderHero()` 开头的 `innerHTML = ''` 就把 band 一起清掉了，
  不需要额外重置什么。

header 铺满整个视口宽度（`.header-inner` 不套 `.wrap`，自带 `padding-inline`），
正文仍受 `--page` 约束。

**章节导航（`.toc`）是浮在正文右侧的竖列**，`position: fixed` + 纵向居中，
不占正文的流。原来是吸附在 header 下的横向胶囊条，两个毛病：章节一多就横向溢出、
只能靠滚动看全（等于看不全）；而且占掉一整条通栏高度把 hero 和正文推开。
改竖排后章节多了往下长，超过视口就在那一列里滚。

用 `fixed` 而不是 `sticky`：后者要待在某个滚动容器里，会被 `.section` 的 overflow
和分隔线截断。代价是会盖住正文右侧，所以分三档：1100px 以上目录贴在正文
右缘外侧，视口放不下时把详情页的 `.wrap` 收窄并保持居中（只在 `#toc` 可见时，
算式全用 rem，别混进 `--page` 的 px）；1100px 以下收成一列圆点、悬停/聚焦才用
`::after` 浮出标题（圆点本体是 `color: transparent`，标题只能走 `data-label`，
不然会连圆点一起被隐藏）；
640px 以下整个隐藏 —— 手机上正文本来就窄，浮层怎么放都挡。
**给目录让位的规则一律放进 `@media (min-width: 1101px)`**：让位的算式是
「视口 − 464px」，窄屏下会变成负数。居中轮播那条（`.wrap--carousel`）曾经漏在
媒体查询外面，手机上 EdenLive 那四节应用被压成 0 宽，什么都看不见。

当前项延续「不用彩色色块」的取舍：只把文字变实 + 左侧导轨那一段染成品牌色。
章节名过长用 ellipsis 截断，同时挂 `title` 属性保证读屏和原生 tooltip 拿到全名。

**层级**：section 上写 `tocDepth: 2` 就在目录里缩进成上一个一级项的子项
（EdenLive 的四节应用在用）。层级是数据里标的，渲染层不去猜 —— 它只把值放到
`<a data-depth>` 上。只影响目录，正文里的章节标题不变。
宽屏缩进做在 `padding-left` 上而不是 `margin`（导轨那条竖线要连续，
margin 会把它断成两段）；窄屏圆点模式下 `padding: 0` 会压掉缩进，
所以那边改用更小的圆点来区分。
**改这块记得同步 `.section` 的 `scroll-margin-top`** —— TOC 不再占正文高度，
原来多留给它的 3.5rem 会让锚点跳过头。

## JS 结构（js/app.js）

单个 IIFE，自上而下：helpers → ICONS → loadData → 渲染函数 →
SECTION_RENDERERS → 首页/列表渲染 → 交互 init* → 路由 → `render()` → `boot()`。

`render(data, route, opts)` 是唯一入口。`route` 由 `parseRoute()` 产出，形如
`{view: 'detail', item, navKey}`。它按 view 分发，然后统一重绑组件级交互。
所有内部跳转都走 `go(route)`，它等于 `render(..., {pushState: true})`。

导航链接都是真的 `<a href>`（Cmd/Ctrl+点击能开新标签、能右键复制链接），
同时 `preventDefault()` 走前端路由。加新的跳转入口时请保持这个双通道。

**重复绑定的坑**：`render()` 每次调用都会重新执行 `init*`。挂在 `document` /
`window` 上的监听必须用模块级 `bound` 标志位守住（现有 `lightboxBound`、
`switcherBound`），否则切几次项目就叠出几层监听。绑在新建 DOM 上的监听无所谓。

**转义**：`esc()` 用于所有从数据来的纯文本；`rich()` 是恒等函数，只用于我们
明确允许写 HTML 的字段（`body` / `caption` / `subtitle` / `step.body`）。
这是有意的口子，方便在文案里写 `<b>` `<code>` `<a>`。数据是我们自己写的，不是用户输入。

## 无障碍与性能底线

改动时不要破坏这些：`.skip-link`、切换器的 `aria-expanded` / `role="listbox"` /
`aria-current`、灯箱的 `role="dialog"` + Esc 关闭 + 焦点归还、对比滑块背后真实的
`<input type="range">`（键盘可操作）、表格的 `scope` 属性、
`prefers-reduced-motion` 分支、`:focus-visible` 样式、
`<html lang>` 跟随语言切换（屏幕阅读器靠它选发音）。

轮播那边额外几条：翻出视野的页要同时给 `aria-hidden="true"` 和 `inert`
（只给前者，Tab 还是会跳进看不见的视频里）、页码用 `aria-live="polite"` 播报、
圆点的点击区域靠 `::after` 撑到 24px（视觉上还是 7px，但手指点得中）。

素材必须压缩后再进 `assets/`：图片过 TinyPNG，视频建议 H.264 mp4 且控制在几 MB 内，
teaser 视频给 `poster`。图片默认 `loading="lazy"`。

## 部署

任意静态托管。GitHub Pages：推到仓库 → Settings → Pages → 选分支根目录。
分享链接带上 `?p=<id>` 指向具体项目。

## 待办 / 已知取舍

- **team 信息已是真的**：team name（Eden）、tagline、首页文案、`site.links`
  的 X 账号、`footer.contact` 邮箱都填好了。
- **`papers[]` 已是真内容**：StereoWorld（CVPR 2026）、Mira-Scene 和 MultiLive。
  `posts[]` 仍是占位，标题、作者、`href: "#"` 链接都要替换。
- **`projects[]` 只有 EdenLive 一条**，两个占位项目已删，`nav[]` 里 project 栏目
  的 `hidden` 也去掉了（之前是因为内容是占位才藏着）。EdenLive 的**文案是真的**
  （从 `artifacts/EdenLive 发布核心特点与叙事/` 整理而来），素材大部分还是占位：
  `teaser` / 两张流程图 / 四节应用的 carousel / `thumb` 都还指向
  `assets/placeholder/*.svg`，数据里每处都留了 `TODO:` 注释。
  链接（论文/代码/权重/demo）也还是 `href: "#"`。
- **EdenLive 的 61 段素材**（条带 27 + 宣传片 + 四节应用 33）在仓库的
  `assets/edenlive/clips/` 下，由 `data/projects.js` 顶部的 `EL` 常量指向；
  短码和 `artifacts/` 原文件名的对照在 `data/edenlive-clips.md`。
  宣传片是压过的 `.mp4`，其余都是同短码的 `.avif` 动图（原视频见「素材」一节）。
  两张流程图要照 `artifacts/.../Images_attachments/` 里那两张（`-realtime-v4` 和
  `-interaction`）重画成站点配色，不要直接用原图 —— 它们是绿色系，和全站的紫/青不搭。
  另外文案里 `>24 fps`、分钟级、百毫秒级延迟这几个数字是对外口径的下限，
  最终以实测为准；「多种参考输入」的措辞也还没定（可能改成「任意」）。
- **Mira-Scene 的两节交互 section 已接成真查看器**（`sceneViewer` / `compareViewer`，
  见上面「三维查看器」一节），CCM workflow 也以 `pages/ccm-workflow/` 独立页挂出。
  三维模型和 CCM 的素材约 730MB，不在仓库，在外部存储的 `assets/mira-scene/3d/` 下。
  遗留一点：原站那两节的 case 列表是从 `manifest.json` 动态拉的，我们写死在
  `data/projects.js` 里 —— 他们加了新 case，我们这边不会自动跟上。
  `pages/ccm-workflow/` 同理，它的 `data/manifest.json` 是抓下来改过地址的快照。
- **⚠️ 外部存储（`ASSETS`）现在用的是临时地址**：限流、不走 CDN 缓存，只能过渡。
  上线前要换成正式地址，`ASSETS` 和 CCM 的 manifest 两处一起改（见「素材」一节）。
  StereoWorld（`SW`）、Mira-Scene（`MS`）、MultiLive（`ML`）的目录划分见
  `data/projects.js` 顶部各常量的注释。Mira-Scene 的 `scenes/` 里文件名就是原站
  manifest 的 case id，`astra/` 加了 `01..06` 前缀保留原站的展示顺序。
- **没有在浏览器里视觉验证过。** 到目前为止的检查都是静态的（`node --check`、
  CSS 括号平衡、CSS 变量收支、class/id 交叉引用、路由分发和 i18n 回落的 headless
  单测）。视觉效果需要人工过目。
- **语言不进 URL。** 切语言只改 `localStorage` 和内存状态，分享出去的链接会按对方
  自己的语言偏好打开。如果以后需要「发中文链接给中文读者」，得加 `?lang=zh` 到
  `parseRoute()` / `urlFor` 里，并在 `updateMeta()` 补 `hreflang` 交替链接。
- 目前没有生成静态子页（`/research/xxx.html`）。若之后需要更好的 SEO 和 arXiv 引用
  友好度，可以写个脚本从 `SITE_DATA` 预渲染，`updateMeta()` 里已经按 view 分好了
  title/description/og:image/canonical，预渲染时可以直接复用。
  注意双语站预渲染要出两套页面（`/zh/...` 和 `/en/...`）才有 SEO 意义。
- Google Fonts 是外链，当前是 Google Sans Flex（正文/标题）+ Google Sans Code
  （代码）。内网/离线环境要自托管字体，删 `index.html` 里那三行 link
  即可回落到系统字体栈。中文这套字体不覆盖，落到 PingFang / 雅黑。
- CSS 用了 `color-mix()`（Chrome 111+ / Safari 16.2+ / Firefox 113+）和 `:has()`。
  需要兼容更老的浏览器就得把这些换成静态色值。
- 栏目 key 到数据数组的映射集中在 `NAV_SOURCE`（`js/app.js`）。加新栏目改那一行 +
  数据的 `nav[]` 即可，渲染层不用动。

## 参考

设计基调参考了这几个页面的做法（都不用彩色胶囊标 venue，都很克制）：
[Nerfies](https://nerfies.github.io/)、[DreamFusion](https://dreamfusion3d.github.io/)、
[3D Gaussian Splatting](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)。
师兄还给过 [qwen.ai/research](https://qwen.ai/research) 和
[technology.robbyant.com](https://technology.robbyant.com/) 两个例子（都是 SPA，
抓不到源码，是照着"整宽 header + 栏目列表 + 克制排版"的描述做的）。
