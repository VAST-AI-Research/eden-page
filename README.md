# Eden Pages

*English · [中文](README_zh.md)*

Team homepage and project pages for Eden. Fully static, no build step.
(The only third-party library is three.js, vendored into the repo for the 3D viewers — no CDN.)

**Preview** — running a server is the safe bet:

```bash
python3 -m http.server 8000     # then open http://localhost:8000/
```

Double-clicking `index.html` mostly works, but **the 3D viewers and
`pages/ccm-workflow/` will not run over `file://`** (ES modules are blocked by the
same-origin policy). Everything else renders fine; the viewers just stop at a
"failed to load" status line. Once deployed to GitHub Pages it is http(s), so the
problem disappears.

## Page structure

```
index.html               Home: team statement + top 3 of each section
index.html?s=project     Project list: systems / models / tools we release
index.html?s=research    Research list: all papers
index.html?s=blog        Blog list: all posts
index.html?p=<id>        Full page for one entry
```

Project / Research / Blog in the header go to list pages; clicking a card in a
list opens its detail page. On a detail page, the switcher at the right of the
header jumps straight to other entries in the same section.

Each section maps to one array in `data/projects.js`:

| Section | key | Data array |
|---|---|---|
| Project | `project` | `projects[]` |
| Research | `research` | `papers[]` |
| Blog | `blog` | `posts[]` |

All three arrays share the `?p=` namespace, so ids must not collide.

To change content you only ever touch `data/projects.js`.

> Project and Blog are currently hidden (`hidden: true` on their `nav` entries):
> they stay out of the header and the home page, but `?s=` and `?p=` still resolve.
> Delete that one line to bring a section back.

---

## Writing bilingual content

**Any reader-facing field can be written as `{ zh: "…", en: "…" }`:**

```js
title: { zh: "我们的方法", en: "Our Method" },
```

**Write a plain string when there is nothing to translate** — names, venues,
numbers, code, URLs are shared by both languages:

```js
venue: "CVPR 2026",
bibtex: "@inproceedings{...}",
```

**One language alone is fine too.** The other falls back to whichever you wrote,
so nothing ever renders blank:

```js
subtitle: { zh: "还没来得及翻译" },    // shows the Chinese even in English mode
```

The 中 / EN button in the top right switches language and remembers the choice.
On a first visit it follows the browser's language preference.

> When adding content, fill in one language completely first — a missing
> translation never breaks the page.

---

## Adding a paper

Add an object to the `papers` array in `data/projects.js`:

```js
{
  id: "my-new-paper",                // becomes index.html?p=my-new-paper; do not change later
  title: {                           // words wrapped in *asterisks* get the brand color
    zh: "我的论文：一个*很酷的方法*",
    en: "My Paper: A *Cool Method* for Something",
  },
  // When a long title wraps to three lines, pin the break point here
  // (detail-page heading only). Give a verbatim prefix of `title`, asterisks
  // included; use an empty string for languages that need no break.
  titleBreakAfter: { zh: "", en: "My Paper: A *Cool Method*" },
  short: "My Paper",                 // short name for list cards and the switcher
  subtitle: {
    zh: "一句话说清这个方法做什么、好在哪。",
    en: "One line on what it does and why it is better.",
  },
  // List-card thumbnail, must be 16:10. The two existing papers use generated
  // diagrams (one shared style, hosted on HF via the TH constant at the top of
  // the file). See the "缩略图" section of CLAUDE.md for how to make one.
  thumb: TH + "my-project.jpg",

  // Venue line, centered under the title. Delete these lines if there is no
  // venue and the whole block disappears.
  venue: "CVPR 2026",                // venue names are not translated
  badge: { zh: "口头报告", en: "Oral Presentation" },   // honor, optional
  venueNote: "",                     // sub-note such as "(ACM TOG)", optional
  date: "2026-06",

  authors: [
    { name: { zh: "张三", en: "San Zhang" }, url: "https://...", affil: [1], note: "*" },
    { name: { zh: "李四", en: "Si Li" },     url: "https://...", affil: [1, 2] },
  ],
  affiliations: [                    // 1 in `affil` refers to the first entry here
    "Eden",
    { zh: "某某大学", en: "Some University" },
  ],
  authorNotes: { zh: "* 同等贡献", en: "* Equal contribution" },

  links: [
    { label: { zh: "论文", en: "Paper" }, href: "https://...", icon: "paper" },
    { label: "arXiv",                     href: "https://...", icon: "arxiv" },
    { label: { zh: "代码", en: "Code" },  href: "https://...", icon: "code"  },
  ],

  teaser: { src: "assets/my-project/teaser.mp4",   // .mp4/.webm detected as video
            poster: "assets/my-project/teaser.jpg",
            caption: { zh: "这段视频在展示什么。", en: "What this clip shows." } },

  highlights: [                      // headline numbers; 2-4 looks best, or omit
    { value: "12×",  label: { zh: "推理加速", en: "faster" } },
    { value: "+3.4", label: "PSNR" },
  ],

  abstract: { zh: "摘要正文……", en: "Abstract text…" },
  sections: [ /* see below */ ],
  bibtex: "@inproceedings{...}",     // code, not translated
  acknowledgements: { zh: "致谢……", en: "Acknowledgements…" },
}
```

Array order is list order — move an entry up to feature it. Put assets under
`assets/my-paper/`.

`authors[]` also takes `bold: true`, which bolds that name (for co-first authors,
project leads, corresponding authors). Only the name is bolded, not the
`*` `†` `✉` note markers.

## Adding a project

Add to the `projects` array. The fields are exactly the same as a paper; only the
ones you tend to use differ — projects usually have no `venue` or `bibtex`, but do
have demo, code and weights links:

```js
{
  id: "my-system",                   // must not collide with ids in papers / posts
  title: { zh: "我的系统：一个*可交互*的东西", en: "My System: An *Interactive* Thing" },
  short: "My System",
  subtitle: { zh: "一句话说清它能干什么。", en: "One line on what it does." },
  date: "2026-08",                   // shown on the card when there is no venue
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
  sections: [ /* same as a paper; suggested order: what it does → how to run → limits */ ],
}
```

Readers of a project page mostly want to know whether they can run it, so put the
demo, install steps and known limitations near the top.

## Adding a blog post

Add to the `posts` array. Same shape, fewer fields:

```js
{
  id: "post-my-note",                // must not collide with ids in papers / projects
  title: { zh: "标题", en: "Title" },
  short: { zh: "短标题", en: "Short title" },
  subtitle: { zh: "一句话导语。", en: "One-line lede." },
  date: "2026-08",
  readingTime: { zh: "8 分钟", en: "8 min read" },
  author: { zh: "张三", en: "San Zhang" },   // posts use a single author, not authors[]
  thumb: "assets/posts/my-note.jpg",
  abstract: { zh: "导语段落。", en: "Intro paragraph." },
  sections: [ /* same as a project */ ],
}
```

## What can go in `sections`

`sections` is an ordered array rendered top to bottom. `type` decides the look.
The snippets below are abbreviated to show structure — **every text field can be
written as `{zh, en}`**:

```js
// Plain text
{ type: "text", id: "limitations",
  title: { zh: "局限", en: "Limitations" },
  body: { zh: "文字，可以写 <b>HTML</b>", en: "Text, <b>HTML</b> allowed" } }

// Image / video
{ type: "figure", id: "method",
  eyebrow: { zh: "方法", en: "How it works" },
  title: { zh: "方法", en: "Method" },
  body: { zh: "方法说明段落", en: "Method paragraph" },
  src: "assets/x/pipeline.png",
  caption: { zh: "图 1：整体框架。", en: "Figure 1: architecture." } }

// Grid gallery, click to open the lightbox. Good for portrait images and quick browsing
{ type: "gallery", id: "results", title: { zh: "更多结果", en: "More Results" },
  columns: 3,
  items: [ { src: "assets/x/a.jpg", caption: { zh: "案例 A", en: "Case A" } },
           { src: "assets/x/b.mp4", caption: { zh: "案例 B", en: "Case B" } } ] }

// Carousel: `perPage` items stacked per page, arrows to page through. Use this for
// landscape videos — in a grid each one ends up too small. Samples carry their own
// playback controls and do not open the lightbox.
{ type: "carousel", id: "samples", title: { zh: "样例", en: "Samples" },
  perPage: 2,                      // items per page, default 2
  items: [ { src: "assets/x/s1.mp4" }, { src: "assets/x/s2.mp4" },
           { src: "assets/x/s3.mp4", caption: { zh: "带说明", en: "With caption" } } ],
  // A small explanatory figure (a diagram, say). **Do not put it inside the body
  // HTML string** — figures inside `body` inherit that box's width and alignment.
  figure: { src: "assets/x/diagram.jpg", width: "30rem",
            caption: { zh: "示意图。", en: "Diagram." } } }

// Drag-slider before/after comparison
{ type: "compare", id: "comparison", title: { zh: "对比", en: "Comparison" },
  before: { src: "assets/x/base.jpg", label: { zh: "基线", en: "Baseline" } },
  after:  { src: "assets/x/ours.jpg", label: { zh: "我们的", en: "Ours" } } }

// Data table: every cell can be bilingual on its own; numeric columns are plain strings
{ type: "table", id: "quant", title: { zh: "定量结果", en: "Quantitative Results" },
  columns: [ { zh: "方法", en: "Method" }, "PSNR ↑", { zh: "耗时 ↓", en: "Time ↓" } ],
  rows: [ [ { zh: "基线", en: "Baseline" }, "24.1", "3.2" ],
          [ { zh: "我们的方法", en: "Ours" }, "29.7", "0.26" ] ],
  highlightRows: [1],              // bold row index 1 (0-based), usually our method
  footnote: { zh: "同一测试集、同一硬件。", en: "Same test set and hardware." } }

// Selling-point cards
{ type: "features", id: "highlights", title: { zh: "亮点", en: "What's New" },
  items: [ { title: { zh: "卖点一", en: "First point" },
             body: { zh: "一句话", en: "One line" }, icon: "spark" } ] }

// Numbered steps, good for install / run commands
{ type: "steps", id: "usage", title: { zh: "快速开始", en: "Get Started" },
  items: [ { title: { zh: "安装", en: "Install" },
             body: "<code>pip install -e .</code>" } ] }   // commands are not translated

// Grid of orbitable 3D scenes (three.js). Only the poster shows by default;
// the model downloads when the reader clicks "Load interactive 3D scene" —
// a single GLB is tens of MB, so it must never autoload.
{ type: "sceneViewer", id: "scenes", title: { zh: "重建结果", en: "Results" },
  columns: 3,
  items: [ { id: "case01",                       // also keys the saved environment rotation
             model: MS3 + "viewers/scenes/case01/scene.glb",
             environment: MS3 + "viewers/scenes/case01/environment.png",
             poster: MS + "scenes/case01.png",
             workflow: "pages/ccm-workflow/?case=case01" } ] }   // optional; shows a link when set

// Side-by-side viewer pair: a thumbnail strip on top, two resident viewers below.
// Clicking a thumbnail switches both at once. The first case is selected and
// loaded by default, and there is no "load" button.
{ type: "compareViewer", id: "vs-baseline", title: { zh: "对比", en: "Comparison" },
  cameras: "data/astra-cameras.json",   // camera metadata table, needed by Reset view; see below
  cases: [ { id: "case01",              // keys into the camera table; required
             label: { zh: "案例 1", en: "Case 1" },
             left:  MS3 + "viewers/astra/case01/from_scratch.glb",
             right: MS3 + "viewers/astra/case01/with_mira_scene.glb",
             poster: MS + "astra/01-case01.png",   // the small image in the strip
             leftLabel:  { zh: "基线", en: "Baseline" },      // optional, has a default
             rightLabel: { zh: "我们的", en: "Ours" } } ] }
```

Any section with a `title` shows up automatically in the vertical on-page
navigation on the right. `id` is the anchor, so
`index.html?p=my-paper#results` links straight to one section.

`figure` also takes `figureClass: "figure--compact"`, which caps the image at
35rem and centers it — diagrams look soft when blown up to full column width, and
they compete with the full-width videos next to them.

The `cameras` table is what lets **Reset view** return to the reference framing
that matches the thumbnail: each GLB's camera list has one entry with
`default: true`, the shot the original authors used. Without the table it falls
back to a three-quarter overview and Reset no longer matches the thumbnail. The
table is keyed by `cases[].id`.

**Both 3D viewer types need a local server** (ES modules are blocked over
`file://` — see the preview note at the top). They run the vendored three.js in
this repo, not a CDN. The number of simultaneously live viewers is capped; going
over releases the oldest one. That is a hard browser limit on WebGL contexts, not
a tunable.

## Available icon names

Pick `links[].icon` and `features` icons from:

`paper` `arxiv` `code` `github` `video` `demo` `hf` `data` `twitter` `link`
`spark` `bolt` `check`

A wrong name does not throw; it falls back to the generic link icon. To add one,
see `ICONS` at the top of `js/app.js`.

## Changing team info and home copy

Three blocks at the top of `data/projects.js` (all support `{zh, en}`):

- `site` — team name, logo, footer links and contact
- `home` — the big statement on the home page (`*asterisks*` highlight here too)
- `nav` — section names and list-page intros. Supported keys are `project` /
  `research` / `blog`; array order is header order. Add `hidden: true` to keep a
  section out of the header and home page without deleting its data.

## Changing UI strings

Buttons and labels that are not content ("View project", "Read more", "Copy" …)
live in the `UI` constant at the top of `js/app.js`, with a `zh` and an `en` copy.

## Changing colors

These lines in `:root` at the top of `css/style.css`:

```css
--brand:  #5b4bdb;   /* primary: links, title emphasis, progress bar */
--accent: #0fb5a6;   /* secondary: hero ambient light, copy-success state */
```

Every other color derives from those two, so both the light and dark themes
follow along.

The overall tone is restrained: no gradient fills, no colored chips, no hover
displacement. Please keep new styles in that key — details in [CLAUDE.md](CLAUDE.md).

## Asset tips

- Run images through [TinyPNG](https://tinypng.com/) first
- Use H.264 mp4 for video, a few MB at most; always give teaser videos a `poster`
- 16:9 for teasers, 16:10 for list thumbnails keeps things tidy

### Where large assets go

Small images (a few hundred KB — thumbnails, teaser posters) go straight into
`assets/`. **Do not put bulk video in git** — it bloats the repo, and GitHub Pages
has a 1GB soft limit. Those go to our own HF dataset:

```
huanngzh/page-assets  →  assets/<project>/...
```

Store the base address in a constant and write only relative paths in the entries,
so switching hosting later is a one-line change. There are three today, all at the
top of `data/projects.js`:

```js
const SW = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/stereo-world/';
const MS = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/mira-scene/';
const TH = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/thumbs/';
// usage: src: SW + "videos/demo.mp4"
```

Two traps: the URL must be `resolve/main` (the file itself) — `blob/main` gives
you the HTML preview page; and HF redirects to a **signed, expiring** CDN address,
so never copy the post-302 URL into the data.

Uploading (the token needs write scope. Do not commit it, and do not pass it as a
command-line argument — anyone on the machine can read those with `ps`. Use an
environment variable or `hf auth login`):

```bash
export HF_TOKEN=<your write token>     # or run hf auth login once
hf upload huanngzh/page-assets <local dir> assets/<project> --repo-type=dataset
```

The local directory structure is mirrored into the repo, so split things into
`videos/ images/ ...` before uploading and the data can just say
`SW + "videos/x.mp4"`.

## Deploying

Push to GitHub → Settings → Pages → pick the branch and root directory. Or drop
the folder on any static host.

For a custom domain, put a `CNAME` file containing just the domain in the repo
root, then point DNS at GitHub Pages (four `A` records for an apex domain, or a
single `CNAME` for a subdomain). Every path in this repo is relative and routing
is built from `location.pathname`, so neither a sub-path deployment nor a custom
domain needs any code change.

Share `https://your-site/?p=my-system` to link straight to an entry.

Note: **language is not in the URL** — the choice is stored locally. A link you
share therefore opens in whatever language the recipient's browser prefers. If you
need "send a Chinese link to a Chinese reader", that requires a routing change.

## What you get out of the box

Bilingual switching (remembered, first visit follows the browser), light/dark
switching (follows the system, manual override in the top right), reading progress
bar, vertical on-page navigation, project switcher, image lightbox, before/after
slider, one-click BibTeX copy, keyboard accessibility,
`prefers-reduced-motion` support, print styles, and per-page SEO/OG meta.
