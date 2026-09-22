# Eden Pages

Eden 的团队主页 + 项目宣传页。纯静态，无构建步骤。
（唯一的第三方库是仓库内 vendored 的 three.js，只给三维查看器用，不引 CDN。）

**预览**：起个服务器比较稳妥 ——

```bash
python3 -m http.server 8000     # 然后开 http://localhost:8000/
```

双击 `index.html` 也能看，但**三维查看器和 `pages/ccm-workflow/` 在 `file://` 下用不了**
（ES module 受同源策略限制，会被浏览器拦掉）。其余内容照常显示，查看器只会停在
「载入失败」那行提示上。部署到 GitHub Pages 之后是 http(s)，没这个问题。

## 页面结构

```
index.html               首页：团队主张 + 各栏目前 3 条
index.html?s=project     Project 列表：我们发布的系统 / 模型 / 工具
index.html?s=research    Research 列表：全部论文
index.html?s=blog        Blog 列表：全部文章
index.html?p=<id>        某个条目的完整页面
```

header 里的 Project / Research / Blog 进列表页，点列表里的卡片进详情页。
在详情页里，header 右侧的切换器可以直接切换同栏目的其他条目。

三个栏目各对应 `data/projects.js` 里的一个数组：

| 栏目 | key | 数据数组 |
|---|---|---|
| Project | `project` | `projects[]` |
| Research | `research` | `papers[]` |
| Blog | `blog` | `posts[]` |

三个数组的 `id` 共用 `?p=` 命名空间，不要重名。

改内容只动 `data/projects.js` 一个文件。

---

## 中英双语怎么写

**任何给人看的字段都可以写成 `{ zh: "…", en: "…" }`：**

```js
title: { zh: "我们的方法", en: "Our Method" },
```

**不需要翻译的直接写字符串**，两种语言共用 —— 人名、会议名、数字、代码、URL：

```js
venue: "CVPR 2026",
bibtex: "@inproceedings{...}",
```

**只写一种也行**，另一种语言会自动用你写的那个，不会变空白：

```js
subtitle: { zh: "还没来得及翻译" },    // 英文模式下也显示中文
```

右上角那个「中 / EN」按钮切换语言，选择会记住。首次访问按浏览器语言自动判断。

> 加内容时建议先把中文写全，英文可以后补 —— 缺英文不会让页面出错。

---

## 加一篇论文

往 `data/projects.js` 的 `papers` 数组里加一个对象：

```js
{
  id: "my-new-paper",                // URL 变成 index.html?p=my-new-paper，定了别改
  title: {                           // *星号* 里的词会高亮成品牌色
    zh: "我的论文：一个*很酷的方法*",
    en: "My Paper: A *Cool Method* for Something",
  },
  // 标题太长被挤成三行时，用这个指定断行位置（只影响详情页大标题）。
  // 写 title 的原样前缀、连星号一起写；不需要断行的语言写空串。
  titleBreakAfter: { zh: "", en: "My Paper: A *Cool Method*" },
  short: "My Paper",                 // 列表卡片和切换器里的短名
  subtitle: {
    zh: "一句话说清这个方法做什么、好在哪。",
    en: "One line on what it does and why it is better.",
  },
  // 列表卡片缩略图，必须 16:10。现有两篇论文用的是生成的示意图（统一风格、
  // 托管在 HF，走顶部的 TH 常量），做法和验收标准见 CLAUDE.md 的「缩略图」一节。
  thumb: TH + "my-project.jpg",

  // 会议信息：标题下方一行居中排版。没中会议就把这几行删掉，整块自动消失。
  venue: "CVPR 2026",                // 会议名不用翻译
  badge: { zh: "口头报告", en: "Oral Presentation" },   // 荣誉，可省略
  venueNote: "",                     // 副标注，如 "(ACM TOG)"，可省略
  date: "2026-06",

  authors: [
    { name: { zh: "张三", en: "San Zhang" }, url: "https://...", affil: [1], note: "*" },
    { name: { zh: "李四", en: "Si Li" },     url: "https://...", affil: [1, 2] },
  ],
  affiliations: [                    // affil 里的 1 对应第一个
    "Eden",
    { zh: "某某大学", en: "Some University" },
  ],
  authorNotes: { zh: "* 同等贡献", en: "* Equal contribution" },

  links: [
    { label: { zh: "论文", en: "Paper" }, href: "https://...", icon: "paper" },
    { label: "arXiv",                     href: "https://...", icon: "arxiv" },
    { label: { zh: "代码", en: "Code" },  href: "https://...", icon: "code"  },
  ],

  teaser: { src: "assets/my-project/teaser.mp4",   // .mp4/.webm 自动识别成视频
            poster: "assets/my-project/teaser.jpg",
            caption: { zh: "这段视频在展示什么。", en: "What this clip shows." } },

  highlights: [                      // 顶部数字亮点，2~4 个最好看；不要就删掉
    { value: "12×",  label: { zh: "推理加速", en: "faster" } },
    { value: "+3.4", label: "PSNR" },
  ],

  abstract: { zh: "摘要正文……", en: "Abstract text…" },
  sections: [ /* 见下 */ ],
  bibtex: "@inproceedings{...}",     // 代码，不分语言
  acknowledgements: { zh: "致谢……", en: "Acknowledgements…" },
}
```

数组顺序 = 列表页顺序，想置顶就往前挪。素材放 `assets/my-paper/` 下。

## 加一个 Project

往 `projects` 数组里加，字段和论文完全一样，只是用到的那几个不同 ——
项目通常没有 `venue` / `bibtex`，但会有 demo、代码、权重链接：

```js
{
  id: "my-system",                   // 不能和 papers / posts 里的 id 重名
  title: { zh: "我的系统：一个*可交互*的东西", en: "My System: An *Interactive* Thing" },
  short: "My System",
  subtitle: { zh: "一句话说清它能干什么。", en: "One line on what it does." },
  date: "2026-08",                   // 没有 venue 的话，卡片上显示这个日期
  thumb: "assets/my-system/thumb.jpg",

  authors: [{ name: "Zehuan Huang", url: "https://x.com/huanngzh", affil: [1] }],
  affiliations: ["Eden"],

  links: [
    { label: { zh: "在线演示", en: "Demo" }, href: "https://...", icon: "demo" },
    { label: { zh: "代码", en: "Code" },     href: "https://...", icon: "github" },
    { label: { zh: "模型", en: "Model" },    href: "https://...", icon: "hf" },
  ],

  teaser: { src: "assets/my-system/demo.mp4", poster: "assets/my-system/demo.jpg" },
  abstract: { zh: "项目介绍……", en: "Project intro…" },
  sections: [ /* 和论文一样，建议按 能做什么 → 怎么跑 → 限制 排 */ ],
}
```

项目页的读者最关心「能不能跑起来」，所以建议把 demo、安装步骤、已知限制放在前面。

## 加一篇 Blog

往 `posts` 数组里加，结构一样但字段更少：

```js
{
  id: "post-my-note",                // 不能和 papers / projects 里的 id 重名
  title: { zh: "标题", en: "Title" },
  short: { zh: "短标题", en: "Short title" },
  subtitle: { zh: "一句话导语。", en: "One-line lede." },
  date: "2026-08",
  readingTime: { zh: "8 分钟", en: "8 min read" },
  author: { zh: "张三", en: "San Zhang" },   // 博客用单个作者，不用 authors[]
  thumb: "assets/posts/my-note.jpg",
  abstract: { zh: "导语段落。", en: "Intro paragraph." },
  sections: [ /* 和项目一样 */ ],
}
```

## sections 能放什么

`sections` 是有序数组，页面按这个顺序渲染。`type` 决定长什么样。
下面为了看清结构用了简写，**每个文字字段都能写成 `{zh, en}`**：

```js
// 纯文字
{ type: "text", id: "limitations",
  title: { zh: "局限", en: "Limitations" },
  body: { zh: "文字，可以写 <b>HTML</b>", en: "Text, <b>HTML</b> allowed" } }

// 图 / 视频
{ type: "figure", id: "method",
  eyebrow: { zh: "方法", en: "How it works" },
  title: { zh: "方法", en: "Method" },
  body: { zh: "方法说明段落", en: "Method paragraph" },
  src: "assets/x/pipeline.png",
  caption: { zh: "图 1：整体框架。", en: "Figure 1: architecture." } }

// 网格画廊，点开进灯箱。竖图、多图速览用这个
{ type: "gallery", id: "results", title: { zh: "更多结果", en: "More Results" },
  columns: 3,
  items: [ { src: "assets/x/a.jpg", caption: { zh: "案例 A", en: "Case A" } },
           { src: "assets/x/b.mp4", caption: { zh: "案例 B", en: "Case B" } } ] }

// 轮播：一页 2 个上下排列，左右按钮翻页。横屏视频用这个 ——
// 塞进网格每个都太小。样例自带播放控制条，不进灯箱。
{ type: "carousel", id: "samples", title: { zh: "样例", en: "Samples" },
  perPage: 2,                      // 一页几个，默认 2
  items: [ { src: "assets/x/s1.mp4" }, { src: "assets/x/s2.mp4" },
           { src: "assets/x/s3.mp4", caption: { zh: "带说明", en: "With caption" } } ],
  // 说明性小图（示意图这类）。**别写进 body 的 HTML 串里** ——
  // body 限宽 68ch，图塞进去会被压窄还偏左，caption 也会被挤到换行。
  figure: { src: "assets/x/diagram.jpg", width: "30rem",
            caption: { zh: "示意图。", en: "Diagram." } } }

// 拖动滑块前后对比
{ type: "compare", id: "comparison", title: { zh: "对比", en: "Comparison" },
  before: { src: "assets/x/base.jpg", label: { zh: "基线", en: "Baseline" } },
  after:  { src: "assets/x/ours.jpg", label: { zh: "我们的", en: "Ours" } } }

// 数据表：每个单元格都能单独双语，数字列直接写字符串
{ type: "table", id: "quant", title: { zh: "定量结果", en: "Quantitative Results" },
  columns: [ { zh: "方法", en: "Method" }, "PSNR ↑", { zh: "耗时 ↓", en: "Time ↓" } ],
  rows: [ [ { zh: "基线", en: "Baseline" }, "24.1", "3.2" ],
          [ { zh: "我们的方法", en: "Ours" }, "29.7", "0.26" ] ],
  highlightRows: [1],              // 加粗第 2 行（从 0 数），一般是我们的方法
  footnote: { zh: "同一测试集、同一硬件。", en: "Same test set and hardware." } }

// 卖点卡片
{ type: "features", id: "highlights", title: { zh: "亮点", en: "What's New" },
  items: [ { title: { zh: "卖点一", en: "First point" },
             body: { zh: "一句话", en: "One line" }, icon: "spark" } ] }

// 编号步骤，适合放安装/运行命令
{ type: "steps", id: "usage", title: { zh: "快速开始", en: "Get Started" },
  items: [ { title: { zh: "安装", en: "Install" },
             body: "<code>pip install -e .</code>" } ] }   // 命令不用翻译

// 可旋转的三维场景网格（three.js）。默认只显示 poster，
// 读者点「载入 3D 场景」才下载模型 —— GLB 单个动辄几十 MB，不能自动加载。
{ type: "sceneViewer", id: "scenes", title: { zh: "重建结果", en: "Results" },
  columns: 3,
  items: [ { id: "case01",                       // 用于记住该场景的环境旋转角度
             model: MS3 + "viewers/scenes/case01/scene.glb",
             environment: MS3 + "viewers/scenes/case01/environment.png",
             poster: MS + "scenes/case01.png",
             workflow: "pages/ccm-workflow/?case=case01" } ] }   // 可选，给了才显示链接

// 并排双查看器：上面一行缩略图选条，下面两块常驻的查看器。
// 点缩略图切换案例，两块同时换。默认选中并加载第一个，没有「载入」按钮。
{ type: "compareViewer", id: "vs-baseline", title: { zh: "对比", en: "Comparison" },
  cameras: "data/astra-cameras.json",   // 相机元数据表，「重置视角」要用，见下
  cases: [ { id: "case01",              // 用于在相机表里索引，不能省
             label: { zh: "案例 1", en: "Case 1" },
             left:  MS3 + "viewers/astra/case01/from_scratch.glb",
             right: MS3 + "viewers/astra/case01/with_mira_scene.glb",
             poster: MS + "astra/01-case01.png",   // 缩略图条里那张小图
             leftLabel:  { zh: "基线", en: "Baseline" },      // 可选，有默认值
             rightLabel: { zh: "我们的", en: "Ours" } } ] }
```

有 `title` 的 section 会自动出现在右侧竖排的章节导航里。
`id` 就是锚点，`index.html?p=my-paper#results` 可以直接分享到某一节。

`figure` 还认 `figureClass: "figure--compact"`，把图限到 35rem 居中 —— 示意图这类
素材铺满整个版心会被放糊，还会和旁边满宽的视频抢注意力。

`compareViewer` 的 `cameras` 表是「重置视角」能回到**和缩略图对齐的参考机位**的前提：
每个 GLB 的相机列表里有一项 `default: true`，那是原作者渲参考图用的机位。
不给这张表的话会退化成斜上方俯视，点重置就对不上缩略图了。表按 `cases[].id` 索引。

**两个三维查看器需要本地服务器**（`file://` 下 ES module 会被拦掉，见开头的预览说明）。
它们跑仓库内 vendored 的 three.js，不引 CDN。同时存活的查看器数量有上限，
超了会自动释放最早载入的那个 —— 这是 WebGL context 的浏览器硬限制，
不是可以调大的参数。

## 可用图标名

`links[].icon` 和 `features` 的 `icon` 从这里选：

`paper` `arxiv` `code` `github` `video` `demo` `hf` `data` `twitter` `link`
`spark` `bolt` `check`

写错了不会报错，会退回成通用链接图标。要加新图标见 `js/app.js` 顶部的 `ICONS`。

## 改团队信息和首页文案

`data/projects.js` 顶部三段（都支持 `{zh, en}`）：

- `site` — team name、logo、页脚链接和联系方式
- `home` — 首页那句大标题和简介（`*星号*` 同样能高亮）
- `nav` — 栏目名和列表页说明文字。目前支持 `project` / `research` / `blog` 三个 `key`，
  数组顺序就是 header 里的顺序（当前是 Project → Research → Blog）

## 改界面文案

按钮、提示这类不属于内容的字（「查看项目」「阅读全文」「复制」等）在
`js/app.js` 顶部的 `UI` 常量里，`zh` 和 `en` 各一份，改那里即可。

## 换配色

`css/style.css` 最上面 `:root` 里这几行：

```css
--brand:  #5b4bdb;   /* 主色：链接、标题强调、进度条 */
--accent: #0fb5a6;   /* 副色：hero 环境光、复制成功态 */
```

其余颜色都是从这两个推导出来的，改完深浅两套主题一起变。

整体走克制路线：不用渐变填色、不用彩色标签、hover 不做位移动效。
加新样式时建议跟着这个基调，细节见 [CLAUDE.md](CLAUDE.md)。

## 素材建议

- 图片先过 [TinyPNG](https://tinypng.com/) 再放进来
- 视频用 H.264 mp4，控制在几 MB；teaser 视频记得给 `poster`
- teaser 用 16:9，列表缩略图用 16:10 左右比较整齐

### 大素材放哪

小图（几百 KB 的缩略图、teaser 封面）直接进 `assets/`。**大批量视频不要进 git** ——
仓库会被拖垮，GitHub Pages 也有 1GB 软限。这种走我们自己的 HF dataset：

```
huanngzh/page-assets  →  assets/<项目名>/...
```

数据里用一个常量存基地址，条目里只写相对路径，将来换托管只改一行。
现在有两个，都在 `data/projects.js` 顶部：

```js
const SW = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/stereo-world/';
const MS = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/mira-scene/';
// 用的时候：src: SW + "videos/demo.mp4"
```

两个坑：URL 必须是 `resolve/main`（直出文件本体），写成 `blob/main` 会拿到网页版
预览页；HF 会 302 到一个**带签名、会过期**的 CDN 地址，别把 302 之后的地址抄进数据里。

上传（token 要 write 权限。别写进仓库、也别直接打在命令行上 —— 命令行参数
同机器上别人 `ps` 就能看到，用环境变量或 `hf auth login` 交互登录）：

```bash
export HF_TOKEN=<你的 write token>     # 或者跑一次 hf auth login
hf upload huanngzh/page-assets <本地目录> assets/<项目名> --repo-type=dataset
```

本地目录的子目录结构会原样搬到 repo 里，所以按 `videos/ images/ ...` 分好再传，
数据里就能直接写 `SW + "videos/x.mp4"`。

## 部署

推到 GitHub → Settings → Pages → 选分支和根目录。或者丢到任意静态托管上。

分享时用 `https://your-site/?p=my-system` 直达具体条目。

注意：**语言不在 URL 里**，切语言只记在本地。所以分享出去的链接，对方会按他自己
浏览器的语言偏好打开。如果需要「发中文链接给中文读者」这种能力，跟我说，要改路由。

## 自带的东西

中英双语切换（记住选择，首次按浏览器语言判断）、深浅色切换（跟随系统，右上角可手动
切）、阅读进度条、章节吸顶导航、项目切换器、图片灯箱、前后对比滑块、BibTeX 一键复制、
键盘可达、`prefers-reduced-motion` 支持、打印样式、每个页面独立的 SEO/OG meta。
