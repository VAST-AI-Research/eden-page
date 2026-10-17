# Eden Pages

Team homepage and project pages for Eden. Fully static, no build step.
The site is English only.
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

## Adding a paper

Add an object to the `papers` array in `data/projects.js`:

```js
{
  id: "my-new-paper",                // becomes index.html?p=my-new-paper; do not change later
  title: "My Paper: A *Cool Method* for Something",   // *asterisks* get the brand color
  // When a long title wraps to three lines, pin the break point here
  // (detail-page heading only). Give a verbatim prefix of `title`, asterisks included.
  titleBreakAfter: "My Paper: A *Cool Method*",
  short: "My Paper",                 // short name for list cards and the switcher
  subtitle: "One line on what it does and why it is better.",
  // List-card thumbnail, must be 16:10. The two existing papers use generated
  // diagrams (one shared style, in the asset bucket via the TH constant at the
  // top of the file). See the "缩略图" section of CLAUDE.md for how to make one.
  thumb: TH + "my-project.jpg",

  // Venue line, centered under the title. Delete these lines if there is no
  // venue and the whole block disappears.
  venue: "CVPR 2026",
  badge: "Oral Presentation",        // honor, optional
  venueNote: "",                     // sub-note such as "(ACM TOG)", optional
  date: "2026-06",

  authors: [
    { name: "San Zhang", url: "https://...", affil: [1], note: "*" },
    { name: "Si Li",     url: "https://...", affil: [1, 2] },
  ],
  affiliations: [                    // 1 in `affil` refers to the first entry here
    "Eden",
    "Some University",
  ],
  authorNotes: "* Equal contribution",

  links: [
    { label: "Paper", href: "https://...", icon: "paper" },
    { label: "arXiv", href: "https://...", icon: "arxiv" },
    { label: "Code",  href: "https://...", icon: "code"  },
  ],

  teaser: { src: "assets/my-project/teaser.mp4",   // .mp4/.webm detected as video
            poster: "assets/my-project/teaser.jpg",
            caption: "What this clip shows." },

  highlights: [                      // headline numbers; 2-4 looks best, or omit
    { value: "12×",  label: "faster" },
    { value: "+3.4", label: "PSNR" },
  ],

  abstract: "Abstract text…",
  sections: [ /* see below */ ],
  bibtex: "@inproceedings{...}",
  acknowledgements: "Acknowledgements…",
}
```

Array order is list order — move an entry up to feature it. Upload its assets to the
bucket under `assets/my-paper/` (see "Where large assets go").

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
  title: "My System: An *Interactive* Thing",
  short: "My System",
  subtitle: "One line on what it does.",
  date: "2026-08",                   // shown on the card when there is no venue
  thumb: "assets/my-system/thumb.jpg",

  authors: [{ name: "Zehuan Huang", url: "https://x.com/huanngzh", affil: [1] }],
  affiliations: ["Eden"],

  links: [
    { label: "Demo",  href: "https://...", icon: "demo" },
    { label: "Code",  href: "https://...", icon: "github" },
    { label: "Model", href: "https://...", icon: "hf" },
  ],

  teaser: { src: "assets/my-system/demo.mp4", poster: "assets/my-system/demo.jpg" },
  abstract: "Project intro…",
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
  title: "Title",
  short: "Short title",
  subtitle: "One-line lede.",
  date: "2026-08",
  readingTime: "8 min read",
  author: "San Zhang",               // posts use a single author, not authors[]
  thumb: "assets/posts/my-note.jpg",
  abstract: "Intro paragraph.",
  sections: [ /* same as a project */ ],
}
```

## What can go in `sections`

`sections` is an ordered array rendered top to bottom. `type` decides the look.
The snippets below are abbreviated to show structure. Every text field is a
plain string:

```js
// Plain text
{ type: "text", id: "limitations",
  title: "Limitations",
  body: "Text, <b>HTML</b> allowed" }

// Image / video
{ type: "figure", id: "method",
  eyebrow: "How it works",
  title: "Method",
  body: "Method paragraph",
  src: "assets/x/pipeline.png",
  caption: "Figure 1: architecture." }

// Grid gallery, click to open the lightbox. Good for portrait images and quick browsing
{ type: "gallery", id: "results", title: "More Results",
  columns: 3,
  items: [ { src: "assets/x/a.jpg", caption: "Case A" },
           { src: "assets/x/b.mp4", caption: "Case B" } ] }

// Carousel: `perPage` items stacked per page, arrows to page through. Use this for
// landscape videos — in a grid each one ends up too small. Samples carry their own
// playback controls and do not open the lightbox.
{ type: "carousel", id: "samples", title: "Samples",
  perPage: 2,                      // items per page, default 2
  items: [ { src: "assets/x/s1.mp4" }, { src: "assets/x/s2.mp4" },
           { src: "assets/x/s3.mp4", caption: "With caption" } ],
  // A small explanatory figure (a diagram, say). **Do not put it inside the body
  // HTML string** — figures inside `body` inherit that box's width and alignment.
  figure: { src: "assets/x/diagram.jpg", width: "30rem",
            caption: "Diagram." } }

// Drag-slider before/after comparison
{ type: "compare", id: "comparison", title: "Comparison",
  before: { src: "assets/x/base.jpg", label: "Baseline" },
  after:  { src: "assets/x/ours.jpg", label: "Ours" } }

// Data table; numeric columns are plain strings too
{ type: "table", id: "quant", title: "Quantitative Results",
  columns: [ "Method", "PSNR ↑", "Time ↓" ],
  rows: [ [ "Baseline", "24.1", "3.2" ],
          [ "Ours", "29.7", "0.26" ] ],
  highlightRows: [1],              // bold row index 1 (0-based), usually our method
  footnote: "Same test set and hardware." }

// Selling-point cards
{ type: "features", id: "highlights", title: "What's New",
  items: [ { title: "First point",
             body: "One line", icon: "spark" } ] }

// Numbered steps, good for install / run commands
{ type: "steps", id: "usage", title: "Get Started",
  items: [ { title: "Install",
             body: "<code>pip install -e .</code>" } ] }

// Grid of orbitable 3D scenes (three.js). Only the poster shows by default;
// the model downloads when the reader clicks "Load interactive 3D scene" —
// a single GLB is tens of MB, so it must never autoload.
{ type: "sceneViewer", id: "scenes", title: "Results",
  columns: 3,
  items: [ { id: "case01",                       // also keys the saved environment rotation
             model: MS3 + "viewers/scenes/case01/scene.glb",
             environment: MS3 + "viewers/scenes/case01/environment.webp",
             poster: MS + "scenes/case01.webp",
             workflow: "pages/ccm-workflow/?case=case01" } ] }   // optional; shows a link when set

// Side-by-side viewer pair: a thumbnail strip on top, two resident viewers below.
// Clicking a thumbnail switches both at once. The first case is selected and
// loaded by default, and there is no "load" button.
{ type: "compareViewer", id: "vs-baseline", title: "Comparison",
  cameras: "data/astra-cameras.json",   // camera metadata table, needed by Reset view; see below
  cases: [ { id: "case01",              // keys into the camera table; required
             label: "Case 1",
             left:  MS3 + "viewers/astra/case01/from_scratch.glb",
             right: MS3 + "viewers/astra/case01/with_mira_scene.glb",
             poster: MS + "astra/01-case01.webp",  // the small image in the strip
             leftLabel:  "Baseline",               // optional, has a default
             rightLabel: "Ours" } ] }
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

Three blocks at the top of `data/projects.js`:

- `site` — team name, logo, footer links and contact
- `home` — the big statement on the home page (`*asterisks*` highlight here too)
- `nav` — section names and list-page intros. Supported keys are `project` /
  `research` / `blog`; array order is header order. Add `hidden: true` to keep a
  section out of the header and home page without deleting its data.

## Changing UI strings

Buttons and labels that are not content ("View project", "Read more", "Copy" …)
live in the `UI` constant at the top of `js/app.js`.

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

Not in git. Every video, image, 3D model and PDF the pages show lives in the Cloudflare
R2 bucket `eden-page-assets` and is served from `https://assets.vast-eden.ai/` through
Cloudflare's CDN. The repo's `assets/` only keeps the site's own logo, icons, fonts
and placeholders. (The site deploys to Cloudflare Workers, where one static file can
be at most 25MiB — the teasers and 3D models are far bigger.)

**Compress first**: video becomes animated AVIF, images become WebP. Teasers are the
exception and stay as the original file, unconverted (they need a seek bar and some
have sound). When an animated image goes in a carousel or figure, give the section a
`ratio` (the image's aspect ratio). Commands and the quality bar are in the "素材"
section of CLAUDE.md. The originals stay in the HF datasets `huanngzh/page-assets` and
`ToRealU/eden-page-assets`, at the same paths; re-encode from those, never from the
compressed copies.

Keys mirror the old paths (`assets/<project>/...`). The prefixes are constants at the
top of `data/projects.js`; entries only write the rest of the path:

```js
const ASSETS = 'https://assets.vast-eden.ai/';   // change only this line to switch domain
const SW = ASSETS + 'assets/stereo-world/';
const MS = ASSETS + 'assets/mira-scene/';
const TH = ASSETS + 'assets/thumbs/';
// usage: src: SW + "videos/demo.mp4"
```

`pages/ccm-workflow/data/manifest.json` and the `og:image` fallback in `index.html`
repeat the full address, so change them together with `ASSETS`.

Upload with wrangler (run `npx wrangler login` once. If your login can see more than
one account, pick Vast with `CLOUDFLARE_ACCOUNT_ID` — the ID is in `npx wrangler whoami`):

```bash
CLOUDFLARE_ACCOUNT_ID=<Vast account ID> npx wrangler r2 object put \
  eden-page-assets/assets/<project>/videos/x.avif --file x.avif --remote \
  --content-type image/avif --cache-control "public, max-age=604800"
```

It uploads one file per call; loop for batches. Two traps: always pass
`--content-type`, otherwise the file is served as `application/octet-stream`; and
files are cached for 7 days, so **after overwriting a file at the same address,
returning readers may see the old one for up to 7 days**. To make a change show up
immediately, upload under a new file name.

## Deploying

Push to GitHub → Settings → Pages → pick the branch and root directory. Or drop
the folder on any static host.

For a custom domain, put a `CNAME` file containing just the domain in the repo
root, then point DNS at GitHub Pages (four `A` records for an apex domain, or a
single `CNAME` for a subdomain). Every path in this repo is relative and routing
is built from `location.pathname`, so neither a sub-path deployment nor a custom
domain needs any code change.

Share `https://your-site/?p=my-system` to link straight to an entry.

## What you get out of the box

Light/dark switching (follows the system, manual override in the top right), reading progress
bar, vertical on-page navigation, project switcher, image lightbox, before/after
slider, one-click BibTeX copy, keyboard accessibility,
`prefers-reduced-motion` support, print styles, and per-page SEO/OG meta.
