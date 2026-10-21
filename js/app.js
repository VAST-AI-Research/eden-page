/* =============================================================================
 * app.js —— 读取数据、渲染项目、处理切换与交互
 * 依赖：无。原生 JS，直接在浏览器里跑。
 * 数据来源优先级：window.SITE_DATA（data/projects.js）> fetch('data/projects.json')
 * ========================================================================== */
(() => {
  'use strict';

  /* --------------------------------------------------------------- helpers */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* 站点只有英文。内容直接写字符串，界面文案集中在 UI 里。 */
  const UI = {
      skip: 'Skip to content', loading: 'Loading…', empty: 'Nothing here yet.',
      noContent: 'No content yet.',
      readMore: 'Read more', viewProject: 'View project',
      viewAll: (n) => `View all ${n}`,
      abstract: 'Abstract', overview: 'Overview', bibtex: 'BibTeX', citeUs: 'Cite us',
      ack: 'Acknowledgements', tldr: 'TL;DR',
      stripPause: 'Pause background video', stripPlay: 'Play background video',
      copy: 'Copy', copied: 'Copied',
      navLabel: 'Main navigation', tocLabel: 'On this page', footerLabel: 'Footer links',
      pickProject: 'Select a project', zoomIn: (c) => `Zoom in: ${c}`,
      closePreview: 'Close preview', compareHint: (a) => `Comparison slider: drag right for ${a}`,
      samples: 'samples', prevGroup: 'Previous samples', nextGroup: 'Next samples',
      samplePlay: 'Play', samplePause: 'Pause',
      groupOf: (i, n) => `Group ${i} of ${n}`,
      goToGroup: (i) => `Go to group ${i}`,
      /* 3D viewers (sceneViewer / compareViewer section types) */
      viewerLoad: 'Load interactive 3D scene',
      viewerRelease: 'Release 3D viewer',
      viewerRetry: 'Retry interactive 3D scene',
      viewerIdle: 'Scene is not loaded.',
      viewerInit: 'Initializing 3D viewer…',
      viewerReleased: 'Viewer released · load again',
      viewerLoading: 'Loading scene and panorama…',
      viewerLoaded: 'Loaded · drag to orbit · scroll to zoom',
      viewerParsing: 'Parsing geometry and textures…',
      viewerProgressPct: (p) => `Loading 3D model ${p}%`,
      viewerProgressMB: (mb) => `Loading 3D model ${mb} MB`,
      viewerLoadedFull: (m, mb) => `Loaded · ${m} mesh objects · ${mb} MB · click the viewer, then W/A/S/D to move`,
      viewerFailed: (msg) => `3D loading failed: ${msg}`,
      viewerCanvas: 'Interactive 3D scene. Drag to orbit and scroll to zoom.',
      viewerCanvasRoam: 'Rotatable and zoomable 3D scene. W/A/S/D to move, R/F to rise and lower, Shift to move faster.',
      viewerEnvRotation: 'Environment',
      viewerOverview: 'Full scene overview',
      viewerView: 'View',
      viewerReset: 'Reset view',
      viewerSection: 'Section height',
      viewerWireframe: 'Wireframe',
      viewerFullscreen: 'Fullscreen',
      viewerFromScratch: 'From Scratch',
      viewerWithMira: 'With Mira-Scene',
      viewerPickCase: 'Select a case',
      viewerCase: (i) => `Case ${i}`,
      viewerNotLoaded: (side) => `${side} is not loaded.`,
      viewerNoSelection: 'No scene selected.',
      viewerInitSide: (side) => `Initializing ${side} viewer…`,
      viewerFailSide: (side, msg) => `Unable to load ${side}: ${msg}`,
      viewerFullscreenFail: (msg) => `Fullscreen unavailable: ${msg}`,
      ccmWorkflow: 'View CCM workflow →',
      toLight: 'Switch to light mode', toDark: 'Switch to dark mode',
      contact: 'Contact',
      loadFailTitle: 'Failed to load content',
      loadFailBody:
        'Could not read the site data. Make sure <code>data/projects.js</code> exists and is ' +
        'referenced from index.html. If you switched to <code>data/projects.json</code>, serve the ' +
        'page over http (e.g. <code>python -m http.server</code>) — browsers block fetch on file://.',
  };
  /** 界面文案取值：ui('readMore')，带参数的 ui('viewAll', 3) */
  const ui = (key, ...args) => {
    const v = UI[key];
    return typeof v === 'function' ? v(...args) : (v ?? '');
  };

  /** 内容字段归一化。数据现在都是纯字符串；仍兜住历史的 { en } 写法，
   *  避免漏改的字段渲染成 [object Object]。别的对象（{ src, poster }、
   *  { name, url } 这类）原样返回。 */
  function t(v) {
    if (v === null || v === undefined) return '';
    if (typeof v !== 'object' || Array.isArray(v)) return v;
    if (Object.keys(v).every((k) => k === 'en')) return v.en ?? '';
    return v;
  }

  /** 转义用户内容里的 HTML，防止 json 里的字符串破坏结构 */
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** 只对我们明确允许富文本的字段用（body/caption 里想写 <b>/<code>/<a>） */
  const rich = (s) => String(s ?? '');

  const el = (tag, attrs = {}, html) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else n.setAttribute(k, v === true ? '' : String(v));
    }
    if (html !== undefined) n.innerHTML = html;
    return n;
  };

  const isVideo = (src = '') => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src);
  // 轮播里按动图处理（给暂停按钮）的扩展名。静态图别用这两种格式放进轮播
  const isAnim = (src = '') => /\.(avif|gif)(\?|#|$)/i.test(src);

  /* ----------------------------------------------------------------- icons */
  const ICONS = {
    paper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    arxiv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6l4 8-4 8H4l4-8z"/><path d="M14 4h6l-4 8 4 8h-6"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6M15 6l6 6-6 6"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5A10.5 10.5 0 0 0 1.5 12c0 4.64 3.01 8.57 7.18 9.96.53.1.72-.23.72-.5v-1.76c-2.92.64-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.61 1.09 1.61 1.09.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.15.67-1.41-2.33-.27-4.78-1.17-4.78-5.19 0-1.15.41-2.09 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.87 1.07a9.9 9.9 0 0 1 5.22 0c2-1.35 2.87-1.07 2.87-1.07.57 1.45.21 2.52.1 2.79.67.73 1.08 1.67 1.08 2.82 0 4.03-2.46 4.92-4.8 5.18.38.33.72.97.72 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 22.5 12A10.5 10.5 0 0 0 12 1.5"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>',
    demo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M21 3l-9 9"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></svg>',
    hf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></svg>',
    data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.64l-5.2-6.8-5.95 6.8H1.71l7.73-8.84L1.29 2.25h6.81l4.71 6.23zm-1.16 17.52h1.83L5.7 4.13H3.74z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5 5L20 6.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
    caret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    slider: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 8-4 4 4 4M14 8l4 4-4 4"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5M11 8v6M8 11h6"/></svg>',
    // hero 背景条带的暂停 / 播放（实心三角和双竖条，小尺寸下比描边清楚）
    play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m8 5 12 7-12 7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6.5" y="5" width="3.6" height="14" rx="1.1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.1"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H6M12 6l-6 6 6 6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 6l6 6-6 6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5"/></svg>',
  };
  const icon = (name) => ICONS[name] || ICONS.link;

  /* ------------------------------------------------------------ 数据加载 */
  async function loadData() {
    if (window.SITE_DATA) return window.SITE_DATA;
    const res = await fetch('data/projects.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`projects.json ${res.status}`);
    return res.json();
  }

  /* --------------------------------------------------------------- 渲染块 */

  /* 视频/图片。src 的扩展名决定渲染成哪个，数据里不用声明。
   * controls 默认跟着 autoplay 反着走（自动播的当装饰、不给控制条），
   * 但可以显式传 controls: true 覆盖 —— teaser 和轮播里的样例都这么做，
   * 那些是页面主内容，读者需要能暂停和拖进度条。
   * 传 lazy: true 则只把地址记在 data-src 上、先不加载，等轮播把它切进视野
   * 再由 initCarousel 填上 src（44 个视频同时预载会把 HF CDN 打满）。图片同理。 */
  function renderMedia(src, {
    poster, autoplay = true, controls, alt = '', lazy = false, loop = true,
  } = {}) {
    // src 偶尔会是 { en }（旧数据里中英各一份素材时留下的）。字符串原样返回。
    src = t(src);
    if (isVideo(src)) {
      const wantControls = controls === undefined ? !autoplay : controls;
      const v = el('video', {
        src: lazy ? null : src, poster, playsinline: true, muted: true, loop,
        controls: wantControls, preload: lazy ? 'none' : 'metadata',
        autoplay: autoplay && !lazy ? true : null,
      });
      if (lazy) v.dataset.src = src;
      if (autoplay) v.dataset.autoplay = 'true';
      v.muted = true; // 属性之外还要设 property，否则部分浏览器不允许自动播放
      // 尊重 reduce-motion：不自动播，并且一定给出控制条
      if (autoplay && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        v.removeAttribute('autoplay'); v.controls = true; delete v.dataset.autoplay;
      }
      return v;
    }
    const img = el('img', {
      src: lazy ? null : src, alt, loading: lazy ? null : 'lazy', decoding: 'async',
    });
    if (lazy) img.dataset.src = src;
    return img;
  }

  function renderAuthors(p) {
    const frag = document.createDocumentFragment();
    if (Array.isArray(p.authors) && p.authors.length) {
      const names = p.authors.map((a, i) => {
        const sup = [
          ...(a.affil || []).map(String),
          ...(a.note ? [t(a.note)] : []),
        ].join(',');
        // bold: true 把名字加重（通常是共一 / 项目负责人这类）。加在名字上、
        // 不含上标，省得标注符号也跟着变粗。用 <strong> 而不是纯 CSS 类，
        // 屏幕阅读器也能听出这个强调。
        const nameHTML = a.bold ? `<strong>${esc(t(a.name))}</strong>` : esc(t(a.name));
        const inner = `${nameHTML}${sup ? `<sup>${esc(sup)}</sup>` : ''}`;
        const name = a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${inner}</a>` : inner;
        /* 逗号放进 .author 里面，整块 nowrap（样式在 css）：一个人的名字、
         * 上标和后面那个逗号永远在同一行，换行只发生在人与人之间的空格上。
         * 逗号留在名字这一侧，否则它会单独掉到下一行的行首。 */
        const sep = i < p.authors.length - 1 ? '<span aria-hidden="true">,</span>' : '';
        // breakBefore：作者名单在这个名字前硬换行。给一行排不下的长名单用，
        // 只在数据里显式标了才生效，别的论文不受影响。
        return `${a.breakBefore ? '<br class="author-break" aria-hidden="true">' : ''}`
          + `<span class="author">${name}${sep}</span>`;
      });
      frag.append(el('div', { class: 'authors' }, names.join(' ')));
    }
    if (Array.isArray(p.affiliations) && p.affiliations.length) {
      const list = p.affiliations
        .map((a, i) => {
          /* 机构有两种写法：纯字符串，或 { name, url }。url 给了才变成链接，
           * 新标签页打开，和作者名字的链接同一套。 */
          const hasName = a && typeof a === 'object' && 'name' in a;
          const name = hasName ? a.name : a;
          const url = hasName ? (a.url || '') : '';
          const text = esc(t(name));
          const body = url
            ? `<a href="${esc(url)}" target="_blank" rel="noopener">${text}</a>`
            : text;
          return `<sup>${i + 1}</sup>${body}`;
        })
        .join('<span aria-hidden="true">　</span>');
      frag.append(el('div', { class: 'affils' }, list));
    }
    if (p.authorNotes) frag.append(el('div', { class: 'author-notes' }, esc(t(p.authorNotes))));
    return frag;
  }

  /* 链接按钮行。
   * href 还是占位的 "#"（素材/论文没放出来）就渲染成不可点的 <span>，
   * 不是 <a> —— 点了跳回首页、或者让人以为有东西可看，都比没按钮更糟。
   * 实心那只黑按钮给**第一个真的能点**的链接：EdenLive 的 Paper 是占位，
   * 黑色就落到 Code 上；别的论文第一个就是 arXiv，和原来一样。 */
  function renderLinkRow(links = []) {
    if (!links.length) return null;
    const row = el('div', { class: 'link-row' });
    let primaryTaken = false;
    links.forEach((l) => {
      const href = l.href || '';
      const inner = `${icon(l.icon)}<span>${esc(t(l.label))}</span>`;
      if (!href || href === '#') {
        row.append(el('span', {
          class: 'btn btn--ghost btn--disabled', 'aria-disabled': 'true',
        }, inner));
        return;
      }
      const external = /^https?:/.test(href);
      row.append(el('a', {
        class: `btn${primaryTaken ? ' btn--ghost' : ''}`,
        href,
        target: external ? '_blank' : null,
        rel: external ? 'noopener' : null,
      }, inner));
      primaryTaken = true;
    });
    return row;
  }

  /** 标题里 *星号* 包住的词渲染成品牌色强调；其余部分转义。 */
  function titleHTML(title) {
    return String(t(title) ?? '')
      .split(/(\*[^*]+\*)/g)
      .map((part) =>
        /^\*[^*]+\*$/.test(part)
          ? `<em>${esc(part.slice(1, -1))}</em>`
          : esc(part))
      .join('');
  }

  /* 详情页大标题：在 breakAfter 这个前缀之后插一个硬换行，把长标题切成
   * 人工控制的两行。数据里的字段是 titleBreakAfter，比如
   *   title:           "Mira-Scene: *Pixel-Aligned Layouts* for ... Reconstruction"
   *   titleBreakAfter: "Mira-Scene: *Pixel-Aligned Layouts*"
   * 注意前缀要连星号一起写 —— 匹配是在**原始字符串**上做的，不是渲染后的 HTML。
   *
   * 只有详情页 hero 用这个。列表卡片和切换器仍走 titleHTML()：那两处宽度小得多，
   * 硬塞一个 <br> 会在不该断的地方断开。
   * 前缀对不上（改了标题忘了改前缀）就整句照原样输出，不会渲染出半截标题。 */
  function heroTitleHTML(title, breakAfter) {
    const raw = String(t(title) ?? '');
    const head = String(t(breakAfter) ?? '');
    if (!head || !raw.startsWith(`${head} `)) return titleHTML(raw);
    return `${titleHTML(head)}<br class="hero-title-break">`
      + `<span class="hero-title-tail">${titleHTML(raw.slice(head.length + 1))}</span>`;
  }

  /** 去掉标题里的强调星号，用于 meta、aria-label、切换器这些纯文本场合 */
  const plain = (v) => String(t(v) ?? '').replace(/\*/g, '');

  /** hero 的三层背景，home / list / detail 共用 */
  /** hero 的三层静态背景（晕光 / 网格 / 噪点）。home / list / detail 共用。 */
  function heroBackdrop(host) {
    host.append(el('div', { class: 'hero__aurora', 'aria-hidden': 'true' }));
    host.append(el('div', { class: 'hero__grid', 'aria-hidden': 'true' }));
    host.append(el('div', { class: 'hero__noise', 'aria-hidden': 'true' }));
  }

  /* hero 背景（数据里的 backdrop 字段），标题和按钮压在它上面。
   * 给 EdenLive 这类「一眼看到效果」的项目用，论文页一般不配。
   *
   * 两种形态：
   *   backdrop.rows  两行横向滚动的动态图条带（每项是一张动图的地址，不能填视频）
   *   backdrop.src   单个铺满的素材（图或视频）
   *
   * 和 heroBackdrop() 的三层是互斥的：配了 backdrop 就不画网格和晕光，
   * 否则网格会透在画面上。纯装饰，所以 aria-hidden + 不给控制条；
   * 真正要让读者看的那段视频是下面的 teaser。
   *
   * 滚动逻辑见 initHeroStrip()：这里只建 DOM，动起来要等节点进文档
   * （要量 clientWidth / clientHeight，脱离文档时都是 0）。 */
  function heroFilm(backdrop) {
    if (!backdrop) return null;
    const rows = Array.isArray(backdrop.rows)
      ? backdrop.rows.filter((r) => Array.isArray(r) && r.length)
      : null;
    if (!rows && !backdrop.src) return null;

    const layer = el('div', { class: 'hero__film', 'aria-hidden': 'true' });
    // inert：读屏和 Tab 都不该进到纯装饰的背景里
    layer.inert = true;

    if (rows) {
      const strip = el('div', { class: 'hero__strip' });
      rows.forEach((items, i) => {
        const row = el('div', { class: 'hero__strip-row', dataset: { row: String(i) } });
        const track = el('div', { class: 'hero__strip-track' });
        // 两行反向滚：同向会看成一整条传送带
        track.dataset.dir = i % 2 ? 'back' : 'fwd';
        items.forEach((src) => track.append(heroTile(src)));
        row.append(track);
        strip.append(row);
      });
      layer.append(strip);
    } else {
      layer.append(renderMedia(backdrop.src, {
        poster: backdrop.poster, controls: false, alt: '',
      }));
    }

    // 压一层蒙版，保证文字在任意亮度的画面上都读得清
    layer.append(el('div', { class: 'hero__film-shade' }));
    return layer;
  }

  /** 条带里的一格：一张动态图。src 先放 data-src，由 initHeroStrip() 懒加载。
   *  图到之前这一格是骨架（.hero__tile 的呼吸动画），到了打上 data-loaded 再淡入。 */
  function heroTile(src) {
    const tile = el('div', { class: 'hero__tile' });
    const img = el('img', { alt: '', decoding: 'async' });
    img.dataset.src = src;
    img.addEventListener('load', () => {
      tile.dataset.loaded = 'true';
      // 暂停态下才到的图（比如 prefers-reduced-motion）：直接定格，一帧都不动
      if (tile.closest('.hero__strip')?.dataset.paused === 'true') freezeAnim(tile, true);
    }, { once: true });
    // 跨境链路偶尔会把传输断在半截：先重试一次。还不行就让这一格留空，不要把整条带拖崩
    img.addEventListener('error', () => {
      if (tile.dataset.retried) { tile.dataset.failed = 'true'; return; }
      tile.dataset.retried = 'true';
      setTimeout(() => { if (img.isConnected) img.src = src; }, 1500);
    });
    tile.append(img);
    return tile;
  }

  /* 动态图没有暂停 API。要停，就把它画到一张 canvas 上盖住（img 由 CSS 藏掉），
   * 要动再把 canvas 拿掉。跨域图画上去只是不能回读像素，显示不受影响。
   * 条带的格子和轮播里的动图样例共用。box 的约定：第一个子元素是 <img>，
   * 图完整到了会打 data-loaded —— 没下完的图 drawImage 画不出东西，所以定不了格。 */
  function freezeAnim(box, on) {
    const still = $('canvas', box);
    if (!on) { still?.remove(); return; }
    if (still || !box.dataset.loaded) return;
    const img = box.firstElementChild;
    const c = el('canvas', { width: img.naturalWidth, height: img.naturalHeight });
    c.getContext('2d').drawImage(img, 0, 0);
    img.after(c);   // 紧跟在图后面：轮播里后面还有暂停按钮，不能盖住它
  }

  /* 把一个 .frame 标成动图格子。ratio 是数据里写的画面宽高比（如 "1664 / 480"），
   * 图到之前骨架按它占位；不写就用 css 里的默认值（EdenLive 的 1280 / 704）。 */
  function animFrame(frame, ratio) {
    frame.classList.add('frame--anim');
    if (ratio) frame.style.setProperty('--ratio', ratio);
  }

  /* 动图格子（frame--anim，轮播样例和插图共用）正中央的播放/暂停按钮的图标和读屏文案 */
  function paintToggle(btn, playing) {
    btn.dataset.state = playing ? 'playing' : 'paused';
    btn.innerHTML = icon(playing ? 'pause' : 'play');
    btn.setAttribute('aria-label', ui(playing ? 'samplePause' : 'samplePlay'));
  }

  /* 动图格子的交互：暂停 = 定格（freezeAnim），载入完成打 data-loaded 收掉骨架，
   * 断了重试。轮播里「哪一页才填 src」归 initCarousel 管，这里不碰。 */
  function initAnimFrames(root) {
    $$('.frame--anim', root).forEach((frame) => {
      const img = $('img', frame);
      const btn = $('.csample__toggle', frame);
      if (!img || !btn) return;
      const src = img.dataset.src || img.getAttribute('src');
      const frozen = () => !!$('canvas', frame);
      btn.addEventListener('click', () => { freezeAnim(frame, !frozen()); paintToggle(btn, !frozen()); });
      const loaded = () => {
        frame.dataset.loaded = 'true';
        // reduce-motion：到了就定格，要看的人自己点播放
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) freezeAnim(frame, true);
        paintToggle(btn, !frozen());
      };
      img.addEventListener('load', loaded);
      if (img.complete && img.naturalWidth) loaded();
      // 几 MB 的图在慢链路上容易断在半截：卸掉 src，过会儿再要一次（最多两次）。
      // 轮播里已经翻走的页不重试，翻回来时 initCarousel 会重新填。
      img.addEventListener('error', () => {
        img.removeAttribute('src');
        const n = Number(img.dataset.retries || 0);
        if (n >= 2) return;
        img.dataset.retries = String(n + 1);
        setTimeout(() => {
          if (img.getAttribute('src') || frame.closest('.carousel__page[aria-hidden="true"]')) return;
          img.setAttribute('src', src);
        }, 1500);
      });
    });
  }

  /** 返回上一层的面包屑（详情页 → 所属栏目列表页） */
  function backLink(data, navKey, go) {
    const nav = (data.nav || []).find((n) => n.key === navKey);
    if (!nav) return null;
    const a = el('a', { class: 'hero__back', href: urlFor.list(navKey) },
      `${icon('back')}<span>${esc(t(nav.label))}</span>`);
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go({ view: 'list', navKey });
    });
    return a;
  }

  function renderHero(p, host, { data, navKey, go } = {}) {
    host.innerHTML = '';

    /* 配了 backdrop 的项目：视频只铺在「标题 / 作者 / 按钮」那一条上，
     * 到 TL;DR 为止就结束 —— teaser 和 highlights 留在正常背景上，
     * 不然一段装饰视频会压在真正要看的 teaser 底下。
     * 结构是 .hero__band（含视频层 + 自己的 .wrap）+ 后面另一个 .wrap。 */
    const film = heroFilm(p.backdrop);
    if (!film) heroBackdrop(host);

    // 带视频时上半截单独成一个 band，否则两截共用一个 wrap（和原来一样）
    const band = film ? el('div', { class: 'hero__band' }) : null;
    if (band) {
      band.append(film);
      host.append(band);
    }
    const wrap = el('div', { class: 'wrap' });
    if (band) band.append(wrap); // band 里的内容压在视频上

    // 条带的暂停按钮（只有滚动条带那种 backdrop 才需要，单图/单视频不用）。
    // 图标和 aria-label 由 initHeroStrip() 按当前状态填。
    if (band && $('.hero__strip', band)) {
      band.append(el('button', {
        class: 'hero__strip-toggle', type: 'button', 'aria-label': ui('stripPause'),
      }));
    }

    if (data && navKey && go) {
      const back = backLink(data, navKey, go);
      if (back) wrap.append(back);
    }

    wrap.append(el('h1', { class: 'hero__title', id: 'project-title' },
      heroTitleHTML(p.title, p.titleBreakAfter)));

    // 会议信息：标题下方一行居中排版，两侧发丝线。没写 venue 就整块不出现。
    if (p.venue) {
      const line = esc(t(p.venue)) +
        (p.badge ? `<span class="badge">${esc(t(p.badge))}</span>` : '');
      wrap.append(el('div', { class: 'hero__venue' },
        `<span class="hero__venue-text">${line}</span>`));
      if (p.venueNote) {
        wrap.append(el('p', { class: 'hero__venue-note' }, esc(t(p.venueNote))));
      }
    }

    wrap.append(renderAuthors(p));

    const links = renderLinkRow(p.links);
    if (links) wrap.append(links);

    /* 下半截：开源预告、TL;DR、teaser 和 highlights。带 band 时它们另起一个
     * .wrap，落在视频条外面的正常背景上；不带 band 时沿用上面那个 wrap。 */
    const below = band ? el('div', { class: 'wrap hero__below' }) : wrap;

    // 开源预告：一句话，品牌色，放在 TL;DR 之前。没写 notice 就不出现。
    if (p.notice) {
      below.append(el('p', { class: 'hero__notice' }, esc(t(p.notice))));
    }

    // TL;DR：放在按钮/视频条之后、teaser 之前 —— 标题下面挤着 venue/作者/按钮，
    // 放那儿会被当成副标题读过去。标签复用 .section__eyebrow。
    // subtitle 里写了 <li> 就按要点列表渲染（每条前面一颗星标），
    // 否则仍是一句话。走 rich()：subtitle 是我们自己写的字段，允许 HTML。
    if (p.subtitle) {
      const text = t(p.subtitle);
      const items = String(text).match(/<li>([\s\S]*?)<\/li>/g);
      const body = items
        ? `<ul class="tldr__list">${items.map((li) =>
            `<li><span class="tldr__mark" aria-hidden="true">${icon('spark')}</span>` +
            `<span>${li.replace(/<\/?li>/g, '')}</span></li>`).join('')}</ul>`
        : `<p class="tldr__text">${rich(text)}</p>`;
      below.append(el('div', { class: 'tldr' },
        `<div class="section__eyebrow">${esc(ui('tldr'))}</div>${body}`));
    }

    // teaser
    if (p.teaser && p.teaser.src) {
      const fig = el('figure', { class: 'teaser', style: 'margin-inline:0' });
      const frame = el('div', {
        class: 'frame',
        'data-preview': p.mediaPreview ? 'true' : null,
      });
      // teaser 是页面主内容，给控制条（读者要能暂停、拖进度条）。
      // 默认自动播 + 静音，否则浏览器会拦掉自动播放。数据可以覆盖：
      // autoplay: false / loop: false 用在想让读者自己点开的宣传片上。
      frame.append(renderMedia(p.teaser.src, {
        poster: p.teaser.poster,
        autoplay: p.teaser.autoplay ?? true,
        loop: p.teaser.loop ?? true,
        controls: p.teaser.controls ?? true,
        alt: t(p.teaser.alt) || `${plain(p.title)} teaser`,
      }));
      if (p.mediaPreview && isVideo(t(p.teaser.src))) {
        frame.append(el('button', {
          class: 'media-preview-trigger', type: 'button',
          'aria-label': ui('zoomIn', 'teaser'),
        }, icon('zoom')));
      }
      fig.append(frame);
      if (p.teaser.caption) {
        fig.append(el('figcaption', { class: 'caption' }, rich(t(p.teaser.caption))));
      }
      below.append(fig);
    }

    // highlights
    if (Array.isArray(p.highlights) && p.highlights.length) {
      const stats = el('div', { class: 'stats' });
      // 脚注标记按出现顺序取符号（*、**、***），不用数字
      const notes = [];
      const markOf = (i) => '*'.repeat(i + 1);
      p.highlights.forEach((h) => {
        const mark = h.note ? `<sup>${markOf(notes.push(t(h.note)) - 1)}</sup>` : '';
        stats.append(el('div', { class: 'stat' },
          `<div class="stat__value">${esc(t(h.value))}${mark}</div>` +
          `<div class="stat__label">${esc(t(h.label))}</div>`));
      });
      below.append(stats);
      if (notes.length) {
        below.append(el('p', { class: 'stats__notes' },
          notes.map((n, i) => `<sup>${markOf(i)}</sup> ${esc(n)}`).join('　')));
      }
    }

    // 不带 band 时 wrap 还没挂上去；带 band 时 wrap 已经在 band 里了
    if (!band) host.append(wrap);
    if (below !== wrap && below.childElementCount) host.append(below);
  }

  /* 说明性小图（示意图、掩码配置这类），居中、可控宽度。
   * 独立成函数是因为它不能写在 body 的 HTML 串里 —— body 渲染进 .section__body，
   * 那个盒子为了行宽可读限了 max-width:68ch(≈544px)，图会被压到一半宽
   * 并且跟着那个窄盒子一起偏到左边。这里的 figure 是 .section__body 的兄弟节点，
   * 宽度相对整个 section 算，margin-inline:auto 才是真的居中。
   * width 传 '50%' / '32rem' 之类，默认 34rem。 */
  function asideFigure(f) {
    const fig = el('figure', {
      class: 'aside-fig',
      style: `max-width:${f.width || '34rem'}`,
    });
    const frame = el('div', { class: 'frame' });
    frame.append(renderMedia(f.src, {
      poster: f.poster, alt: t(f.alt) || t(f.caption) || 'figure',
      controls: isVideo(t(f.src)) ? true : undefined,
    }));
    fig.append(frame);
    if (f.caption) fig.append(el('figcaption', { class: 'caption' }, rich(t(f.caption))));
    return fig;
  }

  /* sceneViewer 的单张卡片：预览图 + 载入按钮 + 环境旋转滑块 + 状态行。
   * 模型地址放在 dataset 上，真正的加载在 initSceneViewers 里做。 */
  function sceneViewerCard(it, i, s) {
    const card = el('article', { class: 'viewer-card' });

    const media = el('div', { class: 'viewer-card__preview' });
    if (it.poster) {
      media.append(el('img', {
        src: it.poster, alt: t(it.alt) || '', loading: 'lazy', decoding: 'async',
      }));
    }
    // 查看器 canvas 挂到这里，载入前是空的
    const host = el('div', { class: 'viewer-card__stage', hidden: true });

    const actions = el('div', { class: 'viewer__actions' });
    actions.append(el('button', { class: 'viewer__load', type: 'button' }, esc(ui('viewerLoad'))));
    // CCM workflow 链接：只有配了 workflow 的案例才给（原站也只有前 4 个有）。
    // 新标签页打开：它是个独立应用（不在我们这套 SPA 路由里），同页跳转会丢掉
    // 当前详情页的状态和查看器。
    if (it.workflow) {
      actions.append(el('a', {
        class: 'viewer__link', href: it.workflow, target: '_blank', rel: 'noopener',
      }, esc(ui('ccmWorkflow'))));
    }

    // 环境全景的水平旋转。载入后才显示 —— 没场景时拖它没意义。
    const rot = el('label', { class: 'viewer-card__rot', hidden: true });
    rot.append(el('span', {}, esc(ui('viewerEnvRotation'))));
    rot.append(el('input', {
      type: 'range', min: '-180', max: '180', step: '1', value: '90',
    }));
    rot.append(el('output', {}, '90°'));

    const status = el('p', { class: 'viewer__status', 'aria-live': 'polite' }, esc(ui('viewerIdle')));

    card.dataset.model = it.model;
    card.dataset.env = it.environment || '';
    card.dataset.caseId = it.id || `case-${i}`;
    if (it.caption) card.dataset.caption = plain(it.caption);

    card.append(media, host, actions, rot, status);
    if (it.caption) card.append(el('p', { class: 'viewer-card__caption' }, rich(t(it.caption))));
    return card;
  }

  /* ---- 各 section 类型 ---- */
  const SECTION_RENDERERS = {
    text(s) {
      return el('div', { class: 'prose section__body' }, rich(t(s.body)));
    },

    figure(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      // figureClass: 数据里可以挂 'figure--compact' 把图限到 35rem（示意图别铺满）
      const fig = el('figure', { class: s.figureClass || '', style: 'margin:2rem 0 0' });
      const frame = el('div', {
        class: 'frame',
        'data-preview': s.mediaPreview ? 'true' : null,
      });
      frame.append(renderMedia(s.src, {
        poster: s.poster, alt: t(s.alt) || t(s.title) || 'figure',
      }));
      if (s.mediaPreview && isVideo(t(s.src))) {
        frame.append(el('button', {
          class: 'media-preview-trigger', type: 'button',
          'aria-label': ui('zoomIn', t(s.title) || 'video'),
        }, icon('zoom')));
      }
      // 动图插图和轮播里的动图样例一样：骨架占位 + 暂停按钮（接线在 initAnimFrames）
      if (isAnim(t(s.src))) {
        animFrame(frame, s.ratio);
        frame.append(el('button', {
          class: 'csample__toggle', type: 'button', 'aria-label': ui('samplePause'),
        }, icon('pause')));
      }
      fig.append(frame);
      if (s.caption) fig.append(el('figcaption', { class: 'caption' }, rich(t(s.caption))));
      box.append(fig);
      return box;
    },

    video(s) {
      return SECTION_RENDERERS.figure(s);
    },

    /* 可交互三维场景网格。每张卡默认只是预览图 + 一个「载入 3D 场景」按钮，
     * 点了才 import() three.js 并抓 GLB —— 单个模型 10~44MB，绝不能自动加载。
     * 真正的 WebGL 逻辑在 js/viewers/scene-viewer.js，这里只铺 DOM 和接线。
     * 同时存活的查看器数量有上限（viewerBudget），超了自动释放最早的那个，
     * 否则十几个 WebGL context 会把显存吃干、浏览器直接丢 context。 */
    sceneViewer(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const items = (s.items || []).filter((it) => it && it.model);
      if (!items.length) return box;

      const grid = el('div', {
        class: 'viewer-grid', dataset: { cols: String(s.columns || 3) },
        style: 'margin-top:1.5rem',
      });
      items.forEach((it, i) => grid.append(sceneViewerCard(it, i, s)));
      box.append(grid);
      return box;
    },

    /* 并排双查看器。版式照原项目页：**顶上一行缩略图选择条，下面两块常驻的
     * 查看器站位**（左「从零搭建」右「用 Mira-Scene」）。点缩略图切换案例，
     * 两块同时换成那个案例的两种做法。
     *
     * 和 sceneViewer 的关键差别：这里没有「载入」按钮。两块查看器一直占着位子，
     * 选中哪个案例就直接加载那一对 —— 因为这节的意义就是对比，让读者先点一次
     * 载入再点缩略图是多余的一步。我们在原站基础上还改了一点：**默认选中并
     * 加载第一个案例**，进来就有东西看，不是两个空框。
     *
     * 每块自带工具条：视角下拉（读 GLB 的相机列表）、Reset view、剖切、线框、全屏。
     * Reset view 能回到「和参考图对齐的视角」靠的是 model_info.cameras 里
     * default:true 那一项 —— 所以 load() 必须把相机元数据一起传进去，
     * 只传 URL 的话 defaultCamera 会退化成 overview（见 cameras 字段的来源说明）。 */
    compareViewer(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const cases = (s.cases || []).filter((c) => c && c.left && c.right);
      if (!cases.length) return box;

      const wrap = el('div', { class: 'cmpv', style: 'margin-top:1.5rem' });

      // 缩略图选择条。listbox 语义 + roving tabindex：整条只占一个 Tab 停留点，
      // 进去以后用左右方向键在案例之间走（见 initSceneViewers 里的键盘处理）。
      const thumbs = el('div', {
        class: 'cmpv__thumbs', role: 'listbox', 'aria-label': ui('viewerPickCase'),
      });
      cases.forEach((c, i) => {
        const b = el('button', {
          class: 'cmpv__thumb', type: 'button', role: 'option',
          'aria-selected': i === 0 ? 'true' : 'false',
          tabindex: i === 0 ? '0' : '-1',
          'aria-label': t(c.label) || ui('viewerCase', i + 1),
          dataset: { case: String(i) },
        });
        if (c.poster) {
          b.append(el('img', { src: c.poster, alt: '', loading: 'lazy', decoding: 'async' }));
        }
        thumbs.append(b);
      });
      wrap.append(thumbs);

      // 两块常驻站位。空态文案在 stage 里，选中案例后被 canvas 替换掉。
      const pair = el('div', { class: 'cmpv__panes' });
      const mkPane = (side, label) => {
        const pane = el('section', { class: 'cmpv__pane', dataset: { side } });
        pane.append(el('h4', { class: 'cmpv__pane-title' }, esc(label)));

        const bar = el('div', { class: 'cmpv__bar' });
        const viewL = el('label', {}, `<span>${esc(ui('viewerView'))}</span>`);
        viewL.append(el('select', { class: 'cmpv__camera', 'aria-label': `${label} · ${ui('viewerView')}` }));
        const reset = el('button', { class: 'cmpv__reset', type: 'button' }, esc(ui('viewerReset')));
        const secL = el('label', {}, `<span>${esc(ui('viewerSection'))}</span>`);
        secL.append(el('input', {
          class: 'cmpv__section', type: 'range', min: '0', max: '100', value: '100',
          'aria-label': `${label} · ${ui('viewerSection')}`,
        }));
        const wireL = el('label', { class: 'cmpv__check' });
        wireL.append(el('input', { class: 'cmpv__wire', type: 'checkbox' }));
        wireL.append(el('span', {}, esc(ui('viewerWireframe'))));
        const full = el('button', { class: 'cmpv__full', type: 'button' }, esc(ui('viewerFullscreen')));
        bar.append(viewL, reset, secL, wireL, full);

        const stage = el('div', { class: 'cmpv__canvas cmpv__canvas--empty' });
        stage.append(el('p', {}, esc(ui('viewerNotLoaded', label))));
        const status = el('p', { class: 'viewer__status', role: 'status' }, esc(ui('viewerNoSelection')));
        pane.append(bar, stage, status);
        return pane;
      };
      pair.append(
        mkPane('left', t(cases[0].leftLabel) || ui('viewerFromScratch')),
        mkPane('right', t(cases[0].rightLabel) || ui('viewerWithMira')),
      );
      wrap.append(pair);

      // 交互逻辑统一在 initSceneViewers 里接
      wrap.dataset.cases = JSON.stringify(cases.map((c) => ({
        id: c.id || '', left: c.left, right: c.right,
        leftLabel: t(c.leftLabel) || ui('viewerFromScratch'),
        rightLabel: t(c.rightLabel) || ui('viewerWithMira'),
      })));
      if (s.cameras) wrap.dataset.cameras = s.cameras;
      box.append(wrap);
      return box;
    },

    gallery(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const grid = el('div', { class: 'gallery', dataset: { cols: String(s.columns || 3) }, style: 'margin-top:1.5rem' });
      (s.items || []).forEach((it) => {
        const cap = t(it.caption) || '';
        const tile = el('button', {
          class: 'tile', type: 'button',
          'aria-label': ui('zoomIn', cap || 'sample'),
          dataset: { src: it.src, caption: cap },
        });
        const media = el('div', { class: 'tile__media' });
        media.append(renderMedia(it.src, { poster: it.poster, alt: cap || 'sample', autoplay: true }));
        media.append(el('span', { class: 'tile__zoom', 'aria-hidden': 'true' }, icon('zoom')));
        tile.append(media);
        if (cap) tile.append(el('div', { class: 'tile__caption' }, rich(cap)));
        grid.append(tile);
      });
      box.append(grid);
      return box;
    },

    /* 轮播。给横屏视频用：一页上下叠 perPage 个（默认 2），左右按钮翻页。
     * 和 gallery 的取舍：gallery 是网格 + 点开进灯箱，缩略图小、适合竖图或多图速览；
     * 横屏视频挤在网格里每个都太小，所以这里一次只放两个、给足宽度。
     * 默认只提供中央播放/暂停按钮；controls: true 保留原生控制条。
     * 详情页 mediaPreview: true 可另外开启图片和视频的放大预览。 */
    carousel(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      // 说明用的小图（比如注意力掩码示意）。必须放在 .section__body 外面：
      // 那个盒子有 max-width:68ch 保证行宽可读，图塞进去会被压窄并跟着一起偏左。
      if (s.figure && s.figure.src) box.append(asideFigure(s.figure));

      const items = (s.items || []).filter((it) => it && it.src);
      if (!items.length) return box;
      const per = Math.max(1, Number(s.perPage) || 2);
      const pages = [];
      for (let i = 0; i < items.length; i += per) pages.push(items.slice(i, i + per));

      const car = el('div', {
        class: `carousel${s.layout === 'centered' ? ' carousel--centered' : ''}` +
          `${s.kind === 'image-grid' ? ' carousel--image-grid' : ''}` +
          `${s.kind === 'video-grid' ? ' carousel--video-grid' : ''}`,
        dataset: { per: String(per) }, style: 'margin-top:1.5rem',
        role: 'group', 'aria-roledescription': 'carousel',
        'aria-label': `${plain(s.title) || ui('samples')}`,
      });

      const prev = el('button', {
        class: 'carousel__nav carousel__nav--prev', type: 'button',
        'aria-label': ui('prevGroup'),
      }, icon('back'));
      const next = el('button', {
        class: 'carousel__nav carousel__nav--next', type: 'button',
        'aria-label': ui('nextGroup'),
      }, icon('arrow'));

      const viewport = el('div', { class: 'carousel__viewport' });
      const track = el('div', { class: 'carousel__track' });
      pages.forEach((page, pi) => {
        const pageEl = el('div', {
          class: 'carousel__page', dataset: { page: String(pi) },
          role: 'group', 'aria-label': ui('groupOf', pi + 1, pages.length),
        });
        page.forEach((it) => {
          const cap = t(it.caption) || '';
          const fig = el('figure', { class: 'csample' });
          const frame = el('div', {
            class: 'frame',
            'data-preview': s.mediaPreview ? 'true' : null,
          });
          // Lazy media is hydrated by initCarousel when the page enters view.
          frame.append(renderMedia(it.src, {
            poster: it.poster, alt: cap || 'sample', controls: true, lazy: true,
          }));
          // 默认轮播只显示中央播放/暂停按钮；数据可以用 controls: true 保留原生条。
          const v = $('video', frame);
          if (s.mediaPreview && v) {
            frame.append(el('button', {
              class: 'media-preview-trigger', type: 'button',
              'aria-label': ui('zoomIn', cap || 'sample'),
            }, icon('zoom')));
          }
          if (v && !s.controls) { v.removeAttribute('controls'); v.controls = false; }
          // 动图样例（.avif / .gif）给同一个按钮：对它来说暂停 = 定格（freezeAnim）。
          // frame--anim 另外挂上骨架：第一帧到之前格子在呼吸，按 s.ratio 占位，见 css。
          const anim = !v && isAnim(t(it.src));
          if (anim) animFrame(frame, s.ratio);
          if ((v && !s.controls) || anim) {
            frame.append(el('button', {
              class: 'csample__toggle', type: 'button',
              'aria-label': ui('samplePause'),
            }, icon('pause')));
          }
          fig.append(frame);
          if (cap) fig.append(el('figcaption', { class: 'csample__caption' }, rich(cap)));
          pageEl.append(fig);
        });
        track.append(pageEl);
      });
      viewport.append(track);

      const dots = el('div', { class: 'carousel__dots' });
      pages.forEach((_, pi) => {
        dots.append(el('button', {
          class: 'carousel__dot', type: 'button',
          dataset: { page: String(pi) }, 'aria-label': ui('goToGroup', pi + 1),
        }));
      });

      const count = el('p', { class: 'carousel__count', 'aria-live': 'polite' });

      car.append(prev, viewport, next);
      box.append(car);
      // 只有一页时翻页控件没意义：藏掉左右按钮和页脚，视频本体照常渲染
      if (pages.length > 1) {
        const foot = el('div', { class: 'carousel__foot' });
        foot.append(dots, count);
        box.append(foot);
      } else {
        car.dataset.single = 'true';
      }

      if (s.caption) box.append(el('p', { class: 'caption' }, rich(t(s.caption))));
      return box;
    },

    compare(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const beforeLabel = t(s.before.label) || 'Before';
      const afterLabel = t(s.after.label) || 'After';
      const c = el('div', { class: 'compare', style: 'margin-top:1.5rem' });
      c.append(el('img', { src: s.before.src, alt: beforeLabel, loading: 'lazy' }));
      const after = el('div', { class: 'compare__after' });
      after.append(el('img', { src: s.after.src, alt: afterLabel, loading: 'lazy' }));
      c.append(after);
      c.append(el('div', { class: 'compare__bar' }));
      c.append(el('div', { class: 'compare__handle' }, icon('slider')));
      c.append(el('span', { class: 'compare__tag compare__tag--l' }, esc(beforeLabel)));
      c.append(el('span', { class: 'compare__tag compare__tag--r' }, esc(afterLabel)));
      c.append(el('input', {
        class: 'compare__range', type: 'range', min: '0', max: '100', value: '50', step: '0.5',
        'aria-label': ui('compareHint', afterLabel),
      }));
      box.append(c);
      if (s.caption) box.append(el('p', { class: 'caption' }, rich(t(s.caption))));
      return box;
    },

    table(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const scroll = el('div', { class: 'table-scroll', style: 'margin-top:1.5rem' });
      const table = el('table', { class: 'data' + (s.wrap ? ' data--wrap' : '') });
      table.append(el('thead', {},
        `<tr>${(s.columns || []).map((c) => `<th scope="col">${esc(t(c))}</th>`).join('')}</tr>`));
      const hl = new Set(s.highlightRows || []);
      const groups = new Set(s.groupRows || []);
      const body = el('tbody');
      (s.rows || []).forEach((r, i) => {
        if (groups.has(i)) {
          body.append(el('tr', { class: 'data__group' },
            `<th scope="rowgroup" colspan="${Math.max(1, (s.columns || []).length)}">${esc(t(r[0]))}</th>`));
          return;
        }
        const styles = (s.cellStyles || {})[i] || {};
        const cells = r.map((cell, j) => {
          const classes = Array.isArray(styles[j]) ? styles[j].join(' ') : '';
          const classAttr = classes ? ` class="${esc(classes)}"` : '';
          return j === 0
            ? `<th scope="row"${classAttr} style="font-weight:inherit">${esc(t(cell))}</th>`
            : `<td${classAttr}>${esc(t(cell))}</td>`;
        }).join('');
        body.append(el('tr', { dataset: hl.has(i) ? { highlight: 'true' } : {} }, cells));
      });
      table.append(body);
      scroll.append(table);
      box.append(scroll);
      if (s.footnote) box.append(el('p', { class: 'table-note' }, rich(t(s.footnote))));
      return box;
    },

    /* Keep comparison blocks under one TOC entry, with headings inside it. */
    group(s) {
      const box = el('div', { class: 'result-group' });
      (s.items || []).forEach((item, i) => {
        const block = el('div', {
          class: `result-group__block${i && item.separate !== false ? ' result-group__block--separated' : ''}`,
          id: item.id || null,
        });
        if (item.title) {
          const head = el('div', { class: 'result-group__head' });
          if (item.eyebrow) head.append(el('div', { class: 'section__eyebrow' }, esc(t(item.eyebrow))));
          head.append(el('h3', { class: 'result-group__title' }, esc(t(item.title))));
          block.append(head);
        }
        const renderer = SECTION_RENDERERS[item.type];
        if (renderer) block.append(renderer(item));
        box.append(block);
      });
      return box;
    },

    features(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const grid = el('div', { class: 'cards', style: 'margin-top:1.5rem' });
      (s.items || []).forEach((it) => {
        grid.append(el('div', { class: 'card' },
          `<div class="card__icon">${icon(it.icon || 'spark')}</div>` +
          `<h3 class="card__title">${esc(t(it.title))}</h3>` +
          `<div class="card__body">${rich(t(it.body))}</div>`));
      });
      box.append(grid);
      return box;
    },

    steps(s) {
      const box = el('div');
      if (s.body) box.append(el('div', { class: 'prose section__body' }, rich(t(s.body))));
      const ol = el('ol', { class: 'steps', style: 'margin-top:1.5rem' });
      (s.items || []).forEach((it) => {
        ol.append(el('li', {},
          `<div><div class="step__title">${esc(t(it.title))}</div>` +
          `<div class="step__body">${rich(t(it.body))}</div></div>`));
      });
      box.append(ol);
      return box;
    },
  };

  function renderSection(s, index) {
    const renderer = SECTION_RENDERERS[s.type];
    if (!renderer) {
      console.warn(`[project-page] unknown section type: "${s.type}" — skipped`);
      return null;
    }
    const sec = el('section', {
      class: `section${index % 2 === 1 ? ' section--alt' : ''}`,
      id: s.id || `section-${index}`,
      dataset: { reveal: '' },
    });
    const wrap = el('div', { class: 'wrap' + (s.layout === 'centered' ? ' wrap--carousel' : '') });
    if (s.title) {
      const head = el('div', { class: 'section__head' });
      if (s.eyebrow) head.append(el('div', { class: 'section__eyebrow' }, esc(t(s.eyebrow))));
      head.append(el('h2', { class: 'section__title' }, esc(t(s.title))));
      wrap.append(head);
    }
    wrap.append(renderer(s));
    sec.append(wrap);
    return sec;
  }

  function renderAbstract(p) {
    if (!p.abstract) return null;
    const sec = el('section', { class: 'section', id: 'abstract', dataset: { reveal: '' } });
    const wrap = el('div', { class: 'wrap' });
    const box = el('div', { class: 'abstract' });
    box.append(el('div', { class: 'section__head' },
      `<div class="section__eyebrow">${esc(ui('overview'))}</div>` +
      `<h2 class="section__title">${esc(ui('abstract'))}</h2>`));
    box.append(el('div', { class: 'abstract__text' }, rich(t(p.abstract))));
    wrap.append(box); sec.append(wrap);
    return sec;
  }

  function renderBibtex(p) {
    if (!p.bibtex) return null;
    const sec = el('section', { class: 'section section--alt', id: 'bibtex', dataset: { reveal: '' } });
    const wrap = el('div', { class: 'wrap' });
    wrap.append(el('div', { class: 'section__head' },
      `<div class="section__eyebrow">${esc(ui('citeUs'))}</div>` +
      `<h2 class="section__title">${esc(ui('bibtex'))}</h2>`));
    const block = el('div', { class: 'bibtex-block' });
    // bibtex 本身是代码，不分语言
    block.append(el('pre', {}, `<code>${esc(p.bibtex)}</code>`));
    block.append(el('button', {
      class: 'copy-btn', type: 'button',
    }, `${icon('copy')}<span>${esc(ui('copy'))}</span>`));
    wrap.append(block);
    if (p.acknowledgements) {
      wrap.append(el('div', { class: 'prose', style: 'margin-top:2.5rem' },
        `<h3 class="card__title">${esc(ui('ack'))}</h3>` +
        `<p style="color:var(--text-muted)">${rich(t(p.acknowledgements))}</p>`));
    }
    sec.append(wrap);
    return sec;
  }

  /* =========================================================== 首页 / 列表 ===
   * 条目卡片在两处复用：首页的栏目预览、栏目列表页。
   * ====================================================================== */

  /** 一条内容的卡片。project / research 显示 venue 或日期，blog 显示日期和阅读时长。 */
  function itemCard(item, navKey, go) {
    const card = el('a', {
      class: 'item', href: urlFor.detail(item.id),
      'aria-label': plain(item.title),
    });
    card.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go({ view: 'detail', item, navKey });
    });

    if (item.thumb) {
      const media = el('div', { class: 'item__media' });
      media.append(el('img', { src: item.thumb, alt: '', loading: 'lazy' }));
      card.append(media);
    }

    // 元信息行：blog 用日期 + 阅读时长；其余栏目用 venue + 荣誉，
    // 没有 venue（项目栏目通常没有）就退回日期，不留空行
    const meta = (navKey === 'blog'
      ? [item.date, item.readingTime]
      : [item.venue || item.date, item.badge]).map(t).filter(Boolean).join(' · ');

    const sub = String(t(item.subtitle) || '').replace(/<[^>]+>/g, '');

    card.append(el('div', { class: 'item__body' },
      (meta ? `<div class="item__meta">${esc(meta)}</div>` : '') +
      `<h3 class="item__title">${titleHTML(item.title)}</h3>` +
      (sub ? `<p class="item__sub">${esc(sub)}</p>` : '') +
      `<span class="item__more">` +
      `${esc(navKey === 'blog' ? ui('readMore') : ui('viewProject'))} ${icon('arrow')}</span>`));

    return card;
  }

  function itemGrid(data, navKey, go, limit) {
    const items = itemsOf(data, navKey);
    const shown = limit ? items.slice(0, limit) : items;
    const grid = el('div', { class: 'item-grid' });
    shown.forEach((it) => grid.append(itemCard(it, navKey, go)));
    return { grid, total: items.length, shown: shown.length };
  }

  /** 首页 hero：团队一句话主张 + 简介 */
  function renderHomeHero(data, host) {
    host.innerHTML = '';
    heroBackdrop(host);
    const h = data.home || {};
    const wrap = el('div', { class: 'wrap' });
    wrap.append(el('h1', { class: 'hero__title hero__title--home' },
      titleHTML(h.title || data.site?.team || 'Team')));
    if (h.intro) wrap.append(el('p', { class: 'hero__subtitle' }, rich(t(h.intro))));
    host.append(wrap);
  }

  /** 首页正文：每个栏目一段，各显示前几条 + "查看全部"。
   * 数据里标了 hidden: true 的栏目跳过（见 renderNav 里同一个判断）。 */
  function renderHomeSections(data, main, go) {
    (data.nav || []).filter((n) => !n.hidden).forEach((nav, i) => {
      const { grid, total, shown } = itemGrid(data, nav.key, go, 3);
      if (!shown) return;

      const sec = el('section', {
        class: `section${i % 2 === 1 ? ' section--alt' : ''}`,
        id: nav.key, dataset: { reveal: '' },
      });
      const wrap = el('div', { class: 'wrap' });

      const head = el('div', { class: 'section__head section__head--row' });
      head.append(el('div', {},
        `<h2 class="section__title">${esc(t(nav.title) || t(nav.label))}</h2>` +
        (nav.intro ? `<p class="section__body">${rich(t(nav.intro))}</p>` : '')));

      if (total > shown) {
        const all = el('a', { class: 'link-more', href: urlFor.list(nav.key) },
          `${esc(ui('viewAll', total))} ${icon('arrow')}`);
        all.addEventListener('click', (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          go({ view: 'list', navKey: nav.key });
        });
        head.append(all);
      }
      wrap.append(head);
      wrap.append(grid);
      sec.append(wrap);
      main.append(sec);
    });
  }

  /** 列表页 hero：栏目名 + 说明，比首页克制 */
  function renderListHero(data, navKey, host) {
    host.innerHTML = '';
    heroBackdrop(host);
    const nav = (data.nav || []).find((n) => n.key === navKey) || {};
    const wrap = el('div', { class: 'wrap' });
    wrap.append(el('h1', { class: 'hero__title hero__title--list' },
      esc(t(nav.title) || t(nav.label) || navKey)));
    if (nav.intro) wrap.append(el('p', { class: 'hero__subtitle' }, rich(t(nav.intro))));
    host.append(wrap);
  }

  /** 列表页正文：该栏目全部条目 */
  function renderList(data, navKey, main, go) {
    const { grid, total } = itemGrid(data, navKey, go);
    const sec = el('section', { class: 'section', id: 'list', dataset: { reveal: '' } });
    const wrap = el('div', { class: 'wrap' });
    if (!total) {
      wrap.append(el('p', { class: 'prose' }, esc(ui('empty'))));
    } else {
      wrap.append(grid);
    }
    sec.append(wrap);
    main.append(sec);
  }

  /* -------------------------------------------------------------- 章节导航 */
  function renderToc(entries) {
    const toc = $('#toc');
    if (!entries.length) { toc.hidden = true; return; }
    toc.hidden = false;
    toc.innerHTML = '';
    const inner = el('div', { class: 'toc__inner' });
    entries.forEach(({ id, label, depth }) => {
      // data-label 给窄屏那套「圆点 + 悬停浮出标题」用：那时 a 自己是
      // color:transparent，标题只能走 ::after 的 content: attr(data-label)。
      // title 属性一并带上，键盘/读屏和原生 tooltip 都能拿到全名（列表里
      // 长标题是 ellipsis 截断的）。
      // data-depth: 2 的项在目录里缩进（见数据里的 tocDepth）。
      inner.append(el('a', {
        href: `#${id}`, 'data-label': label, title: label,
        dataset: { depth: String(depth || 1) },
      }, esc(label)));
    });
    toc.append(inner);
  }

  /* ---------------------------------------------------------------- 交互 */

  /** 轮播：左右翻页 + 圆点跳页 + 键盘左右键。
   * 视频是懒加载的（渲染时只把地址放在 data-src），这里负责：
   *   1. 把当前页和相邻页的 src 填上（相邻页预热一下，翻页时不至于白屏）
   *   2. 翻出视野的页暂停播放 —— 不然十几个视频在后台一起解码，风扇直接起飞
   * 每个轮播的监听都绑在自己新建的 DOM 上，所以不需要 bound 标志位。 */
  function initCarousel(root) {
    $$('.carousel', root).forEach((car) => {
      const track = $('.carousel__track', car);
      const pages = $$('.carousel__page', track);
      if (!pages.length) return;
      const foot = car.parentElement?.querySelector('.carousel__foot');
      const dots = foot ? $$('.carousel__dot', foot) : [];
      const count = foot ? $('.carousel__count', foot) : null;
      const prev = $('.carousel__nav--prev', car);
      const next = $('.carousel__nav--next', car);
      let cur = 0;

      // 样例视频的播放/暂停按钮：正中央那个，只有悬停时才看得见。
      // 状态全靠视频自己的 paused，按钮只负责切换和同步图标。
      // 动图样例的按钮不在这里接，见 initAnimFrames。
      const syncToggle = (v) => {
        const btn = v.parentElement?.querySelector('.csample__toggle');
        if (btn) paintToggle(btn, !v.paused);
      };
      $$('.csample__toggle', car).forEach((btn) => {
        const v = btn.parentElement.querySelector('video');
        if (!v) return;
        btn.addEventListener('click', () => {
          if (!v.getAttribute('src')) return;   // 还没填 src（不在视野里）就别播
          if (v.paused) {
            delete v.dataset.userPaused;
            const pr = v.play(); if (pr?.catch) pr.catch(() => {});
          } else {
            v.dataset.userPaused = 'true';
            v.pause();
          }
        });
        v.addEventListener('play', () => {
          if (v.closest('.carousel__page')?.dataset.active === 'true') delete v.dataset.userPaused;
          syncToggle(v);
        });
        v.addEventListener('pause', () => {
          if (v.closest('.carousel__page')?.dataset.active === 'true' && !v.ended) {
            v.dataset.userPaused = 'true';
          }
          syncToggle(v);
        });
        syncToggle(v);
      });

      // 把某一页的视频地址填上。填过的页会打上标记，避免翻回来重复请求。
      // 但请求失败不能算填过：本地的 python http.server（3.11 及更早）不响应
      // Range，浏览器读元数据时会把连接掐掉，视频停在空画面。标记清掉之后，
      // 翻回这一页（或还停在这一页）会再要一次。
      const retry = (v) => {
        if (v.dataset.retryArmed) return;
        v.dataset.retryArmed = 'true';
        v.addEventListener('error', () => {
          const page = v.closest('.carousel__page');
          v.removeAttribute('src');
          v.load();
          if (page) delete page.dataset.hydrated;
          const n = Number(v.dataset.retries || 0);
          if (n >= 2 || page !== pages[cur]) return;
          v.dataset.retries = String(n + 1);
          setTimeout(() => { if (page === pages[cur]) hydrate(cur); }, 500);
        });
      };
      const hydrate = (pi) => {
        const page = pages[pi];
        if (!page || page.dataset.hydrated === 'true') return;
        page.dataset.hydrated = 'true';
        $$('video[data-src]', page).forEach((v) => {
          retry(v);
          if (v.getAttribute('src')) return;
          // 用 setAttribute 而不是 v.src = ...：后者赋的是 property，
          // 读回来会被解析成绝对地址，属性选择器和 getAttribute 也不好判断是否已填。
          v.setAttribute('src', v.dataset.src);
          v.preload = 'metadata';
        });
      };

      // 首屏之外的轮播先别加载：等 IntersectionObserver 说进视野了再放行。
      // 没有 IO 的老浏览器直接放行（宁可多下点流量，也不能不显示）。
      let live = !('IntersectionObserver' in window);

      const show = (pi, { focusPage = false } = {}) => {
        cur = Math.max(0, Math.min(pages.length - 1, pi));
        track.style.transform = `translateX(-${cur * 100}%)`;
        if (live) {
          hydrate(cur);
          hydrate(cur + 1);   // 预热下一页
          hydrate(cur - 1);
          // 图片只填当前页，不预热：视频的相邻页只取元数据，图一填 src 就是下整个文件
          // （动图样例一张几 MB），会和当前页抢带宽
          $$('img[data-src]:not([src])', pages[cur]).forEach((img) => img.setAttribute('src', img.dataset.src));
        }
        pages.forEach((page, i) => {
          const on = i === cur;
          if (!on) page.dataset.active = 'false';
          // aria-hidden + inert：读屏和 Tab 都不该进到看不见的页里
          page.setAttribute('aria-hidden', on ? 'false' : 'true');
          if (on) page.removeAttribute('inert'); else page.setAttribute('inert', '');
          // 翻走时还没下完的图先停掉，带宽让给当前页；翻回来会重新要
          if (!on) $$('img[data-src][src]', page).forEach((img) => { if (!img.complete) img.removeAttribute('src'); });
          $$('video', page).forEach((v) => {
            if (on) {
              // 当前页自动播。lazy 视频的 autoplay 属性是空的（渲染时还没有 src），
              // 所以这里要显式 play()。用户主动暂停过的不再强行起播，尊重他的选择。
              if (!live || !v.getAttribute('src') || v.dataset.autoplay !== 'true'
                || v.dataset.userPaused === 'true' || !v.paused) return;
              const pr = v.play();
              if (pr?.catch) pr.catch(() => {});
            } else {
              // Remember native-control pauses before hiding this page.
              if (v.controls && page.dataset.active === 'true') {
                v.dataset.userPaused = String(v.paused);
              }
              if (!v.paused) v.pause();
            }
          });
          if (on) page.dataset.active = String(live);
        });
        dots.forEach((d, i) => {
          d.dataset.on = i === cur ? 'true' : 'false';
          d.setAttribute('aria-current', i === cur ? 'true' : 'false');
        });
        if (count) count.textContent = ui('groupOf', cur + 1, pages.length);
        // 不循环：到头就禁用按钮，比悄悄卡住更好懂
        if (prev) prev.disabled = cur === 0;
        if (next) next.disabled = cur === pages.length - 1;
        if (focusPage) {
          const first = $('video, img', pages[cur]);
          if (first) first.focus?.({ preventScroll: true });
        }
      };

      prev?.addEventListener('click', () => show(cur - 1));
      next?.addEventListener('click', () => show(cur + 1));
      dots.forEach((d) => {
        d.addEventListener('click', () => show(Number(d.dataset.page)));
      });

      // 原生视频控制条保留左右键快退/快进；其他位置用来翻页。
      car.addEventListener('keydown', (e) => {
        if (e.target.closest('video')) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      });

      show(0);   // 先摆好版式、页码、按钮状态（此时 live 还是 false，不下载）

      // 进视野才真正开始加载：一篇论文里有 6 个轮播、几十个视频，
      // 一进页面全预载会把 HF CDN 打满，首屏也会被拖慢。
      if (!live) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            live = true;
            io.unobserve(en.target);
            show(cur);   // 这次 live 是 true，会真的填 src 并起播
          });
        }, { rootMargin: '200px' });
        io.observe(car);
      }
    });
  }

  /** 图片对比滑块 */
  function initCompare(root) {
    $$('.compare', root).forEach((c) => {
      const range = $('.compare__range', c);
      const set = (v) => c.style.setProperty('--pos', `${v}%`);
      set(range.value);
      range.addEventListener('input', () => set(range.value));
    });
  }

  /* ---------------------------------------------------- 三维查看器（three.js）
   * 两个 section type（sceneViewer / compareViewer）的交互都在这里接。
   *
   * 三条硬约束，都是被显存和流量逼出来的：
   *   1. three.js（vendored 2.2MB）和 GLB（单个 10~44MB）一律点了才下载。
   *      模块用动态 import() 缓存，第二次点就不再走网络。
   *   2. 同时存活的 WebGL context 不超过 MAX_LIVE 个。浏览器对 context 数量
   *      有硬上限（Chrome 约 16），超了会静默丢掉最早的那个、画面变黑。
   *      所以这里自己做 LRU：超额时 dispose 最早载入的。
   *   3. 切语言会 rerender 整个视图，旧的 canvas 必须显式 dispose，
   *      不然 GPU 资源泄漏、几次切换就卡死。见 disposeAllViewers()。 */
  /* MAX_LIVE 数的是「查看器条目」不是 WebGL context —— 并排对比一个条目占
   * 两个 context，所以它入场时按 MAX_LIVE-1 收。最坏情况 5 个对比条目 = 10 个
   * context，加上单场景也就 11 个，仍在浏览器上限（Chrome 约 16）之下。 */
  const MAX_LIVE = 6;
  let viewerMod = null;          // 动态 import 的缓存
  let compareMod = null;
  const liveViewers = [];        // LRU：[0] 是最早载入的

  /* 把当前语言的文案注给查看器模块（它们不 import app.js）。
   *
   * 注意两个模块对 `loaded` 的期待不一样，别混：
   *   scene-viewer   用 S.loaded 当**字符串**（它不统计网格数和字节数）
   *   compare-viewer 用 S.loaded(meshes, mb) 当**函数**（状态行要报这两个数）
   * 所以下面基础版给字符串，compareStrings() 再覆盖成函数版。
   * 早先两边都塞字符串，compare-viewer 加载完的那一刻会 "S.loaded is not a
   * function" —— 偏偏是成功路径上才触发，失败路径反而看不出来。 */
  function viewerStrings() {
    return {
      loading: ui('viewerLoading'), loaded: ui('viewerLoaded'),
      parsing: ui('viewerParsing'),
      progressPct: (p) => ui('viewerProgressPct', p),
      progressMB: (mb) => ui('viewerProgressMB', mb),
      failed: (m) => ui('viewerFailed', m),
      canvasLabel: ui('viewerCanvas'),
      overview: ui('viewerOverview'),
    };
  }

  /** compare-viewer 专用：loaded 要函数版，canvasLabel 要带 WASD 说明 */
  function compareStrings() {
    return {
      ...viewerStrings(),
      loaded: (meshes, mb) => ui('viewerLoadedFull', meshes, mb),
      canvasLabel: ui('viewerCanvasRoam'),
    };
  }

  /** 释放一个查看器条目并把 UI 退回「未载入」。
   * 两种 entry 都走这里：sceneViewer 的有 button / poster / rot（要退回预览图 +
   * 把按钮改回「载入」），compareViewer 的没有按钮（两块查看器常驻站位，
   * 释放后只是变回空态）。所以下面每个可选部件都得先判断存在性 ——
   * 早先这里对 entry.button 无条件赋值，对比查看器被 LRU 淘汰时会直接抛
   * TypeError，把整条淘汰链打断、后面的 context 就泄漏了。 */
  function releaseViewer(entry, message) {
    entry.viewers.forEach((v) => { try { v?.dispose(); } catch { /* 已经没了就算了 */ } });
    entry.viewers = [];
    const i = liveViewers.indexOf(entry);
    if (i >= 0) liveViewers.splice(i, 1);
    if (entry.emptyLabels) {
      // 对比查看器：清空 canvas 并恢复「尚未载入」的空态占位
      entry.hosts.forEach((h, k) => {
        h.replaceChildren(el('p', {}, esc(ui('viewerNotLoaded', entry.emptyLabels[k]))));
        h.classList.add('cmpv__canvas--empty');
      });
      (entry.statuses || []).forEach((st) => {
        st.textContent = message || ui('viewerNoSelection');
      });
      return;
    }
    entry.hosts.forEach((h) => { h.replaceChildren(); h.hidden = true; });
    if (entry.poster) entry.poster.hidden = false;
    if (entry.rot) entry.rot.hidden = true;
    if (entry.status) entry.status.textContent = message || ui('viewerIdle');
    if (entry.button) {
      entry.button.textContent = ui('viewerLoad');
      entry.button.setAttribute('aria-expanded', 'false');
    }
  }

  /** 视图切换/切语言前把所有查看器清干净，避免 GPU 资源泄漏 */
  function disposeAllViewers() {
    [...liveViewers].forEach((e) => releaseViewer(e));
    liveViewers.length = 0;
  }

  function initSceneViewers(root) {
    /* ---- 单场景网格 ---- */
    $$('.viewer-card', root).forEach((card) => {
      const button = $('.viewer__load', card);
      const status = $('.viewer__status', card);
      const host = $('.viewer-card__stage', card);
      const poster = $('.viewer-card__preview', card);
      const rot = $('.viewer-card__rot', card);
      if (!button || !status || !host) return;

      const entry = { viewers: [], hosts: [host], status, button, poster, rot };

      button.addEventListener('click', async () => {
        // 已经载入 → 这次点击是「释放」
        if (entry.viewers.length) return releaseViewer(entry);

        while (liveViewers.length >= MAX_LIVE) {
          releaseViewer(liveViewers[0], ui('viewerReleased'));
        }
        host.hidden = false;
        if (poster) poster.hidden = true;
        if (rot) rot.hidden = false;
        status.textContent = ui('viewerInit');
        button.textContent = ui('viewerRelease');
        button.setAttribute('aria-expanded', 'true');
        try {
          if (!viewerMod) viewerMod = await import('./viewers/scene-viewer.js');
          viewerMod.setStrings(viewerStrings());
          const input = rot ? $('input', rot) : null;
          const output = rot ? $('output', rot) : null;
          const v = new viewerMod.StaticStage2Viewer(
            host, status, card.dataset.caseId, input, output,
          );
          entry.viewers = [v];
          liveViewers.push(entry);
          await v.load(card.dataset.model, card.dataset.env);
        } catch (err) {
          if (entry.viewers.length) releaseViewer(entry, ui('viewerRetry'));
          status.textContent = ui('viewerFailed', err.message);
          button.textContent = ui('viewerRetry');
          if (poster) poster.hidden = false;
        }
      });
    });

    /* ---- 并排对比 ---- */
    $$('.cmpv', root).forEach((wrap) => {
      let cases;
      try { cases = JSON.parse(wrap.dataset.cases || '[]'); } catch { return; }
      if (!cases.length) return;

      const thumbs = $$('.cmpv__thumb', wrap);
      const panes = $$('.cmpv__pane', wrap).map((pane) => ({
        pane,
        title: $('.cmpv__pane-title', pane),
        camera: $('.cmpv__camera', pane),
        reset: $('.cmpv__reset', pane),
        section: $('.cmpv__section', pane),
        wire: $('.cmpv__wire', pane),
        full: $('.cmpv__full', pane),
        stage: $('.cmpv__canvas', pane),
        status: $('.viewer__status', pane),
      }));
      if (panes.length !== 2) return;

      // 相机元数据（Reset view 要用）。整张表一次性取回来缓存住 —— 才 18KB，
      // 比每切一个案例发一次请求划算。取不到就降级：defaultCamera 退成 overview，
      // 除了「回到参考视角」之外的功能都照常。
      let cameraTable = null;
      const camerasFor = async () => {
        if (cameraTable || !wrap.dataset.cameras) return cameraTable;
        try {
          const r = await fetch(wrap.dataset.cameras, { cache: 'force-cache' });
          cameraTable = r.ok ? await r.json() : {};
        } catch { cameraTable = {}; }
        return cameraTable;
      };

      // emptyLabels / statuses 让 releaseViewer 认出这是对比查看器：
      // 被 LRU 淘汰时恢复成空态占位，而不是去找不存在的「载入」按钮。
      const entry = {
        viewers: [], hosts: panes.map((p) => p.stage),
        statuses: panes.map((p) => p.status),
        emptyLabels: [
          t(cases[0].leftLabel) || ui('viewerFromScratch'),
          t(cases[0].rightLabel) || ui('viewerWithMira'),
        ],
      };
      let active = -1;
      let token = 0;

      // 每块的工具条接到它自己那个查看器上
      const bind = (p, v) => {
        p.reset.onclick = () => v.setCamera(v.defaultCamera);
        p.section.oninput = () => v.setSection(Number(p.section.value));
        p.wire.onchange = () => v.setWireframe(p.wire.checked);
        p.full.onclick = async () => {
          try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await p.stage.requestFullscreen();
          } catch (err) { p.status.textContent = ui('viewerFullscreenFail', err.message); }
        };
      };

      const select = async (i) => {
        if (i === active && entry.viewers.length === 2) return;
        active = i;
        const c = cases[i];
        const request = ++token;   // 连点缩略图时，只让最后一次的结果落地

        // 先把旧的两个 context 释放掉，再腾配额
        entry.viewers.forEach((v) => { try { v?.dispose(); } catch {} });
        entry.viewers = [];
        if (!liveViewers.includes(entry)) {
          while (liveViewers.length >= MAX_LIVE - 1) {
            releaseViewer(liveViewers[0], ui('viewerReleased'));
          }
          liveViewers.push(entry);
        }

        thumbs.forEach((b) => {
          const on = Number(b.dataset.case) === i;
          b.setAttribute('aria-selected', String(on));
          b.tabIndex = on ? 0 : -1;
        });

        const labels = [c.leftLabel, c.rightLabel];
        panes.forEach((p, k) => {
          p.title.textContent = labels[k];
          p.stage.replaceChildren();
          p.stage.classList.remove('cmpv__canvas--empty');
          p.status.textContent = ui('viewerInitSide', labels[k]);
          p.section.value = '100';
          p.wire.checked = false;
        });

        try {
          if (!compareMod) compareMod = await import('./viewers/compare-viewer.js');
          if (request !== token) return;
          compareMod.setStrings(compareStrings());

          const table = await camerasFor();
          if (request !== token) return;
          const meta = (table || {})[c.id] || {};

          const made = panes.map((p, k) => {
            const v = new compareMod.AstraSceneViewer(p.stage, p.status, p.camera);
            bind(p, v);
            return v;
          });
          entry.viewers = made;
          await Promise.all([
            made[0].load(c.left, meta.from_scratch),
            made[1].load(c.right, meta.with_mira_scene),
          ]);
          if (request !== token) return;
        } catch (err) {
          if (request !== token) return;
          panes.forEach((p, k) => {
            p.status.textContent = ui('viewerFailSide', labels[k], err.message);
          });
        }
      };

      thumbs.forEach((b) => {
        b.addEventListener('click', () => select(Number(b.dataset.case)));
      });

      // roving tabindex：整条缩略图只占一个 Tab 停留点，内部用方向键走。
      // Home/End 跳首尾，和 listbox 的通用约定一致。
      wrap.querySelector('.cmpv__thumbs').addEventListener('keydown', (e) => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        e.preventDefault();
        const cur = thumbs.findIndex((b) => b.tabIndex === 0);
        const last = thumbs.length - 1;
        const next = e.key === 'Home' ? 0
          : e.key === 'End' ? last
          : e.key === 'ArrowLeft' ? Math.max(0, cur - 1)
          : Math.min(last, cur + 1);
        thumbs[next].focus();
        select(next);
      });

      // 改动一处原站行为：默认选中并加载第一个案例，进来就有东西看，
      // 不是两个空框等着读者先点一下。
      select(0);
    });
  }

  /** 灯箱。文档级监听只装一次，避免每次切项目都叠加一层。 */
  let lightboxBound = false;
  let closeLightbox = () => {};
  function initLightbox(root) {
    const box = $('#lightbox');
    const stage = $('#lightbox-stage');
    const cap = $('#lightbox-caption');
    let lastFocus = null;
    let suspended = [];

    const open = (src, caption) => {
      suspended = $$('video', root).filter((video) => !video.paused);
      suspended.forEach((video) => video.pause());
      stage.innerHTML = '';
      stage.append(renderMedia(src, { autoplay: false, alt: caption || '' }));
      cap.textContent = caption || '';
      box.dataset.open = 'true';
      document.body.style.overflow = 'hidden';
      lastFocus = document.activeElement;
      $('#lightbox-close').focus();
    };
    const close = () => {
      box.dataset.open = 'false';
      stage.innerHTML = '';
      document.body.style.overflow = '';
      suspended.forEach((video) => {
        if (document.contains(video) && video.dataset.userPaused !== 'true') {
          const promise = video.play();
          if (promise?.catch) promise.catch(() => {});
        }
      });
      suspended = [];
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    };
    closeLightbox = close;

    $$('.tile', root).forEach((tile) => {
      tile.addEventListener('click', () => open(tile.dataset.src, tile.dataset.caption));
    });
    // Explicitly opted-in teaser, figure, and carousel media can be opened.
    $$('[data-preview]', root).forEach((frame) => {
      const media = $('img, video', frame);
      if (!media) return;
      const caption = frame.closest('figure')?.querySelector('figcaption')?.textContent
        || media.getAttribute('alt') || 'media preview';
      const show = (event) => {
        const src = media.getAttribute('src') || media.dataset.src;
        if (src) { event.preventDefault(); open(src, caption); }
      };
      if (media.tagName === 'VIDEO') return;
      media.tabIndex = 0;
      media.setAttribute('role', 'button');
      media.setAttribute('aria-label', ui('zoomIn', caption));
      media.addEventListener('click', show);
      media.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') show(event);
      });
    });
    $$('.media-preview-trigger', root).forEach((button) => {
      button.addEventListener('click', (event) => {
        const frame = button.closest('[data-preview]');
        const media = frame && $('img, video', frame);
        const src = media?.getAttribute('src') || media?.dataset.src;
        if (src) { event.preventDefault(); open(src, button.getAttribute('aria-label') || 'media preview'); }
      });
    });
    $('#lightbox-close').onclick = close;
    box.onclick = (e) => { if (e.target === box) close(); };
    if (!lightboxBound) {
      lightboxBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && box.dataset.open === 'true') closeLightbox();
      });
    }
  }

  /** BibTeX 复制 */
  function initCopy(root) {
    $$('.copy-btn', root).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.parentElement.querySelector('code')?.textContent || '';
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // clipboard API 在 http/file 下可能不可用，退回 execCommand
          const ta = el('textarea', { style: 'position:fixed;opacity:0' });
          ta.value = text; document.body.append(ta); ta.select();
          document.execCommand('copy'); ta.remove();
        }
        btn.dataset.copied = 'true';
        btn.querySelector('span').textContent = ui('copied');
        setTimeout(() => {
          btn.dataset.copied = 'false';
          btn.querySelector('span').textContent = ui('copy');
        }, 1800);
      });
    });
  }

  /** 滚动进场动画 */
  function initReveal(root) {
    const items = $$('[data-reveal]', root);
    if (!('IntersectionObserver' in window)) {
      items.forEach((i) => (i.dataset.shown = 'true'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.dataset.shown = 'true'; io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    items.forEach((i) => io.observe(i));
  }

  /* 目录的显隐：配了视频背景条的页面，滑过那条之后才让目录浮出来 ——
   * 条上压着标题和按钮，右侧再浮一列章节名会打架。
   * 没有 band 的页面（论文页、没配 backdrop 的项目）一直显示，和原来一样。
   *
   * 用 IntersectionObserver 盯 band 的下边界，不自己算 scrollY：
   * 条高是 min(760px, 100vh)，跟视口走，算出来的阈值会在 resize 后失效。 */
  /* hero 背景条带：两行动态图横向匀速滚动。
   *
   * 关键取舍：
   * - 位移用 rAF 按「每秒多少 px」算，不用 CSS animation —— 要能随时暂停、
   *   并且在 resize 改了格宽之后接着原进度走，不是跳回起点。
   * - 一格滚出左边就 append 到队尾（offset 减掉一个 stride），所以无论屏多宽
   *   都不会露出空边，也不用把素材复制好几遍。
   * - **每格是一张动态图（AVIF），不是 <video>**。原来是 27 路 30 秒的视频同时播，
   *   每路约 4Mbps，带宽根本供不上；换成 12 秒的小动图后每格约 190KB。
   * - 懒加载：只有滚到视野附近的格子才填 src，没到的是骨架。
   * - 整条带在视口外、切到别的标签页、或用户按了暂停时，rAF 停。
   *   用户暂停时所有格子还要定格（freezeAnim）—— 动图自己停不下来。
   * - prefers-reduced-motion 默认就是暂停态（用户可以手动播）。 */
  let heroStripStop = null;
  function initHeroStrip() {
    if (heroStripStop) { heroStripStop(); heroStripStop = null; }
    const strip = $('#hero .hero__strip');
    if (!strip) return;

    const band = strip.closest('.hero__band') || strip.parentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SPEED = 42; // px/s。刻意慢 —— 这是背景，不该抢注意力
    const rows = $$('.hero__strip-track', strip).map((track) => ({
      track,
      row: track.parentElement,
      back: track.dataset.dir === 'back',
      count: track.children.length,
      offset: 0,
      stride: 0,
    }));
    if (!rows.length) return;

    let paused = reduce.matches;
    let visible = true;
    let raf = 0;
    let last = 0;
    let mediaAt = 0;

    const running = () => !paused && visible && !document.hidden;

    /* 懒加载 + 定格。每 ~150ms 跑一次，不必每帧都查。 */
    function updateMedia() {
      const vw = strip.clientWidth;
      rows.forEach((st) => {
        const { stride } = st;
        if (!stride) return;
        // track 自己的位移。反向行的 transform 是 offset - stride，
        // 算可见范围要用同一个值，否则判定会整体偏一格。
        const shift = st.back ? st.offset - stride : -st.offset;
        [...st.track.children].forEach((tile, i) => {
          const img = tile.firstElementChild;
          if (!img || tile.dataset.failed) return;
          // 这一格左边缘相对条带视口的位置
          const left = i * stride + shift;
          const near = left < vw + stride && left + stride > -stride;
          if (near && !img.getAttribute('src')) img.src = img.dataset.src;
          freezeAnim(tile, paused);
        });
      });
    }

    function step(now) {
      if (!running()) { raf = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      rows.forEach((st) => {
        if (!st.stride) return;
        st.offset += dt * SPEED;
        /* 滚过一格就回收一格，offset 退回一个 stride，视觉上接得上。
         * 两个方向的回收端是相反的，搞反了就会看到「画面播着忽然换一段」：
         *   正向（往左跑）滚出左边的是首格 → append 到队尾
         *   反向（往右跑）滚出右边的是末格 → prepend 到队首
         * 回收永远发生在视野外，所以每一格始终在循环播自己那张动图。 */
        while (st.offset >= st.stride) {
          st.offset -= st.stride;
          if (st.back) st.track.prepend(st.track.lastElementChild);
          else st.track.append(st.track.firstElementChild);
        }
        const x = st.back ? st.offset - st.stride : -st.offset;
        st.track.style.transform = `translate3d(${x}px, 0, 0)`;
      });
      if (now - mediaAt > 150) { mediaAt = now; updateMedia(); }
      raf = requestAnimationFrame(step);
    }

    function sync() {
      strip.dataset.paused = String(paused);
      if (running()) {
        if (!raf) { last = 0; raf = requestAnimationFrame(step); }
      } else if (raf) {
        cancelAnimationFrame(raf); raf = 0; last = 0;
      }
      updateMedia();
    }

    /* 格宽跟着行高走（保持 832:480），并补足格数把整行铺满 —— 超宽屏上
     * 15 格可能不够一屏，不补就会露空边。 */
    function measure() {
      rows.forEach((st) => {
        const h = st.row.clientHeight;
        if (!h) return;
        const w = Math.min(832, h * 832 / 480);
        st.track.style.setProperty('--tile-w', `${w}px`);
        const gap = parseFloat(getComputedStyle(st.track).gap) || 0;
        const stride = w + gap;
        // resize 时按比例保留进度，不要跳回起点
        if (st.stride) st.offset = st.offset / st.stride * stride;
        st.stride = stride;
        // 不够铺满就整轮复制（保持原顺序，不然会出现相邻重复）
        const need = strip.clientWidth + stride * 2;
        while (st.track.children.length * stride < need) {
          const base = [...st.track.children].slice(0, st.count);
          base.forEach((tile) => {
            const src = tile.firstElementChild?.dataset.src;
            if (src) st.track.append(heroTile(src));
          });
          if (!st.count) break;
        }
        const x = st.back ? st.offset - st.stride : -st.offset;
        st.track.style.transform = `translate3d(${x}px, 0, 0)`;
      });
      updateMedia();
    }

    const ro = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(strip);
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); })
      : null;
    if (io) io.observe(band);

    const onVis = () => sync();
    const onReduce = (e) => { paused = e.matches; sync(); };
    document.addEventListener('visibilitychange', onVis);
    reduce.addEventListener('change', onReduce);

    // 暂停按钮：动效和流量都该能被用户掐掉
    const btn = $('#hero .hero__strip-toggle');
    const refreshBtn = () => {
      if (!btn) return;
      btn.innerHTML = paused ? ICONS.play : ICONS.pause;
      btn.setAttribute('aria-label', ui(paused ? 'stripPlay' : 'stripPause'));
    };
    const onToggle = () => { paused = !paused; refreshBtn(); sync(); };
    if (btn) btn.addEventListener('click', onToggle);
    refreshBtn();

    measure();
    sync();

    heroStripStop = () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect(); io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      reduce.removeEventListener('change', onReduce);
      btn?.removeEventListener('click', onToggle);
      // 卸掉 src：切走之后，还没下完的图不该接着下
      $$('img', strip).forEach((img) => img.removeAttribute('src'));
    };
  }

  let tocGateObserver = null;
  function initTocGate() {
    if (tocGateObserver) { tocGateObserver.disconnect(); tocGateObserver = null; }
    const toc = $('#toc');
    const band = $('#hero .hero__band');
    if (!band || !('IntersectionObserver' in window)) {
      delete toc.dataset.gated;
      return;
    }
    toc.dataset.gated = 'hidden';
    tocGateObserver = new IntersectionObserver(([e]) => {
      // band 完全滑出视口上方 = 读者已经进到正文，这时才放出目录
      toc.dataset.gated = e.isIntersecting ? 'hidden' : 'shown';
    }, { threshold: 0 });
    tocGateObserver.observe(band);
  }

  /** TOC 高亮当前章节 */
  let tocObserver = null;
  function initTocHighlight() {
    if (tocObserver) tocObserver.disconnect();
    const links = $$('#toc a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach((a) => {
      const target = document.getElementById(a.hash.slice(1));
      if (target) map.set(target, a);
    });
    tocObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        map.get(e.target)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    map.forEach((_, target) => tocObserver.observe(target));
  }

  /** header 阴影 + 顶部阅读进度条，合并到一个滚动回调里（rAF 节流） */
  function initScrollChrome() {
    const header = $('#site-header');
    const bar = $('#progress');
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      header.dataset.scrolled = String(y > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? String(Math.min(1, y / max)) : '0');
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  /** 页面固定白底。VAST 规范不跟随系统深色模式，主题按钮藏起来。
   * refreshThemeLabel 仍留给切语言时调用，这里是空操作。 */
  let refreshThemeLabel = () => {};
  function initTheme() {
    document.documentElement.dataset.theme = 'light';
    const btn = $('#theme-toggle');
    if (btn) btn.hidden = true;
  }

  /* ---------------------------------------------------------- 静态文案 ---
   * 把骨架里的 aria-label 和兜底文案刷成 UI 表里的英文。 */
  function initLang() {
    const paint = () => {
      document.documentElement.lang = 'en';
      $('#skip-link').textContent = ui('skip');
      $('#header-nav').setAttribute('aria-label', ui('navLabel'));
      $('#toc').setAttribute('aria-label', ui('tocLabel'));
      $('#footer-links').setAttribute('aria-label', ui('footerLabel'));
      $('#switcher-menu').setAttribute('aria-label', ui('pickProject'));
      $('#lightbox-close').setAttribute('aria-label', ui('closePreview'));
      const ph = $('#hero-placeholder');
      if (ph) ph.textContent = ui('loading');
      refreshThemeLabel();
    };
    paint();
  }

  /* ---------------------------------------------------------- 项目切换器 ---
   * 只列出同一栏目的条目：research 的项目之间互切，blog 的文章之间互切。
   * 跨栏目跳转走 header 主导航，不塞进这个菜单里。 */
  let switcherBound = false;
  function initSwitcher(data, navKey, current, onPick) {
    const btn = $('#switcher-btn');
    const menu = $('#switcher-menu');
    const label = $('#switcher-label');

    const items = itemsOf(data, navKey);
    const nav = (data.nav || []).find((n) => n.key === navKey) || {};

    label.textContent = plain(current.short || current.title);

    menu.innerHTML = '';
    menu.append(el('div', { class: 'switcher__menu-head' },
      `${esc(t(nav.label) || navKey)} · ${items.length}`));
    items.forEach((p) => {
      const item = el('button', {
        class: 'switcher__item', type: 'button', role: 'option',
        'aria-current': String(p.id === current.id),
      });
      if (p.thumb) item.append(el('img', { class: 'thumb', src: p.thumb, alt: '', loading: 'lazy' }));
      item.append(el('span', { class: 'meta' },
        `<span class="name">${esc(plain(p.short || p.title))}</span>` +
        `<span class="sub">${esc([p.venue, p.date].map(t).filter(Boolean).join(' · '))}</span>`));
      item.append(el('span', { class: 'tick', 'aria-hidden': 'true' }, icon('check')));
      item.addEventListener('click', () => { setOpen(false); onPick(p.id); });
      menu.append(item);
    });

    const setOpen = (open) => {
      menu.dataset.open = String(open);
      btn.setAttribute('aria-expanded', String(open));
    };

    btn.onclick = (e) => {
      e.stopPropagation();
      setOpen(menu.dataset.open !== 'true');
    };
    if (!switcherBound) {
      switcherBound = true;
      const closeAll = () => {
        menu.dataset.open = 'false';
        btn.setAttribute('aria-expanded', 'false');
      };
      document.addEventListener('click', (e) => {
        if (!$('#switcher').contains(e.target)) closeAll();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
    }
    setOpen(false);
  }

  /* ================================================================= 路由 ===
   * 三种视图，全靠 query string 区分，没有真实子页面：
   *   index.html                 → home    首页（团队简介 + 各栏目预览）
   *   index.html?s=project       → list    栏目列表页（project|research|blog）
   *   index.html?p=<id>          → detail  项目/文章详情页
   * ====================================================================== */

  /** 栏目 key -> 数据里对应的数组名。加新栏目只改这张表和 data 里的 nav[]。 */
  const NAV_SOURCE = { project: 'projects', research: 'papers', blog: 'posts' };

  /** 栏目 key -> 该栏目下的条目数组 */
  function itemsOf(data, key) {
    return data[NAV_SOURCE[key]] || [];
  }

  /** 在所有栏目里找 id，并带回它属于哪个栏目 */
  function findItem(data, id) {
    for (const nav of data.nav || []) {
      const hit = itemsOf(data, nav.key).find((x) => x.id === id);
      if (hit) return { item: hit, navKey: nav.key };
    }
    return null;
  }

  /** 解析当前 URL 想要哪个视图 */
  function parseRoute(data) {
    const q = new URLSearchParams(location.search);
    const p = q.get('p');
    if (p) {
      const found = findItem(data, p);
      if (found) return { view: 'detail', ...found };
    }
    const s = q.get('s');
    if (s && (data.nav || []).some((n) => n.key === s)) {
      return { view: 'list', navKey: s };
    }
    return { view: 'home' };
  }

  const urlFor = {
    home: () => location.pathname,
    list: (key) => `${location.pathname}?s=${encodeURIComponent(key)}`,
    detail: (id) => `${location.pathname}?p=${encodeURIComponent(id)}`,
  };

  /* -------------------------------------------------------------- meta 改写 */
  function updateMeta(data, { view, item, navKey }) {
    const team = t(data.site?.team) || '';
    const set = (sel, attr, val) => { const n = $(sel); if (n) n.setAttribute(attr, val); };
    const strip = (s) => String(t(s) ?? '').replace(/<[^>]+>/g, '').replace(/\*/g, '');

    let title = team;
    let desc = strip(data.site?.tagline);
    let canonical = urlFor.home();
    let image = null;

    if (view === 'detail') {
      title = `${strip(item.title)}${team ? ` · ${team}` : ''}`;
      desc = strip(item.abstract || item.subtitle).slice(0, 200);
      canonical = urlFor.detail(item.id);
      if (item.teaser?.src && !isVideo(t(item.teaser.src))) image = t(item.teaser.src);
      if (Array.isArray(item.keywords) && item.keywords.length) {
        set('meta[name="keywords"]', 'content', item.keywords.map(t).join(', '));
      }
    } else if (view === 'list') {
      const nav = (data.nav || []).find((n) => n.key === navKey) || {};
      title = `${strip(nav.title) || strip(nav.label) || navKey}${team ? ` · ${team}` : ''}`;
      desc = strip(nav.intro).slice(0, 200);
      canonical = urlFor.list(navKey);
    } else {
      desc = strip(data.home?.intro) || desc;
      desc = desc.slice(0, 200);
    }

    document.title = title;
    set('meta[name="description"]', 'content', desc);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', desc);
    if (image) set('meta[property="og:image"]', 'content', new URL(image, location.href).href);
    set('link[rel="canonical"]', 'href', `${location.origin}${canonical}`);
  }

  /* ------------------------------------------------------------ header 装配 */
  /** 主导航每次切视图都要重画（要更新 aria-current），所以单独一个函数 */
  function renderNav(data, route, go) {
    const nav = $('#header-nav');
    nav.innerHTML = '';
    // hidden: true 的栏目不进导航。数据全留着，?s= 和 ?p= 仍然能直达 ——
    // 只是不主动暴露入口（见 data/projects.js 里 nav[] 的说明）。
    (data.nav || []).filter((n) => !n.hidden).forEach((n) => {
      const active = route.navKey === n.key;
      const a = el('a', {
        href: urlFor.list(n.key),
        'aria-current': active ? 'page' : null,
      }, esc(t(n.label)));
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go({ view: 'list', navKey: n.key });
      });
      nav.append(a);
    });
  }

  /** 品牌名和页脚的文字。切语言要重画，所以和下面的一次性绑定分开。 */
  function renderChromeText(data) {
    const site = data.site || {};
    const team = t(site.team) || 'Team';
    if (site.logo) $('#brand-logo').src = site.logo;
    $('#brand-full').textContent = team;
    $('#brand-short').textContent = t(site.teamShort) || team.slice(0, 8);

    const f = site.footer || {};
    $('#footer-team').textContent = team;
    $('#footer-note').textContent = t(f.note) || t(site.tagline) || '';
    // credit 可选：没写就整行隐藏，否则会留下一条空的分隔线
    const credit = $('#footer-credit');
    credit.textContent = t(f.credit) || '';
    credit.hidden = !credit.textContent;
    const fl = $('#footer-links');
    fl.innerHTML = '';
    [...(site.links || []),
     ...(f.contact ? [{ label: ui('contact'), href: f.contact }] : [])]
      .forEach((l) => fl.append(el('a', { href: l.href }, esc(t(l.label)))));
  }

  /** 只需要装一次的东西：logo 缺失时移除、品牌链接的点击路由 */
  function initChrome(data, go) {
    if (!data.site?.logo) $('#brand-logo').remove();
    const home = $('#brand-link');
    home.href = urlFor.home();
    home.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go({ view: 'home' });
    });
  }

  /* ------------------------------------------------------------ 主渲染流程 */
  function render(data, route, { pushState = false, scrollTop = true } = {}) {
    const go = (next, opts) => render(data, next, { pushState: true, ...opts });

    if (pushState) {
      const url = route.view === 'detail' ? urlFor.detail(route.item.id)
                : route.view === 'list'   ? urlFor.list(route.navKey)
                : urlFor.home();
      history.pushState(null, '', url);
    }

    updateMeta(data, route);
    renderChromeText(data);
    renderNav(data, route, go);

    const hero = $('#hero');
    const main = $('#sections');
    // 清 DOM 前先把 WebGL 查看器 dispose 掉。innerHTML='' 只摘 DOM 节点，
    // canvas 背后的 GPU 资源和 rAF 循环不会自己停，切几次视图就把显存吃干。
    closeLightbox();
    disposeAllViewers();
    main.innerHTML = '';

    // 切换器只在详情页出现
    const switcher = $('#switcher');
    switcher.hidden = route.view !== 'detail';

    if (route.view === 'home') {
      renderHomeHero(data, hero);
      renderHomeSections(data, main, go);
      renderToc([]);
    } else if (route.view === 'list') {
      renderListHero(data, route.navKey, hero);
      renderList(data, route.navKey, main, go);
      renderToc([]);
    } else {
      renderDetail(data, route, hero, main, go);
    }

    initAnimFrames(main);
    initCarousel(main);
    initCompare(main);
    initSceneViewers(main);
    initLightbox(main);
    initCopy(main);
    initReveal(document);
    initTocHighlight();
    initTocGate();
    initHeroStrip();
    fitCardSummaries(main);

    if (scrollTop) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /** 详情页：hero + abstract + sections + bibtex + TOC + 切换器 */
  function renderDetail(data, route, hero, main, go) {
    const p = route.item;
    renderHero(p, hero, { data, navKey: route.navKey, go });

    const tocEntries = [];
    const abs = renderAbstract(p);
    if (abs) { main.append(abs); tocEntries.push({ id: 'abstract', label: ui('abstract') }); }

    (p.sections || []).forEach((s, i) => {
      const node = renderSection(s, i + (abs ? 1 : 0));
      if (!node) return;
      main.append(node);
      // tocDepth: 2 让这一节在目录里缩进成子项（数据里标，渲染层不猜层级）。
      // 正文里的章节标题不受影响 —— 只改目录的呈现。
      if (s.title) tocEntries.push({ id: node.id, label: t(s.title), depth: s.tocDepth || 1 });
    });

    const bib = renderBibtex(p);
    if (bib) { main.append(bib); tocEntries.push({ id: 'bibtex', label: ui('bibtex') }); }

    renderToc(tocEntries);
    // 切换器只列出同栏目的条目：research 项目之间互切，blog 文章之间互切
    initSwitcher(data, route.navKey, p, (id) => {
      const found = findItem(data, id);
      if (found) go({ view: 'detail', ...found });
    });
  }

  /* 首页 / 列表的卡片简介默认截三行。标题排到三行时把简介收到两行，
   * 让同一行里的卡片高度更齐 —— 标题长短不一是卡片高矮不齐的主要来源。
   * 只看实际排出来的行数，不靠字符数猜：中英文、强调词和容器宽度都会变。 */
  let cardSummaryFitBound = false;
  function fitCardSummaries(root = document) {
    const titles = $$('.item__title', root);
    if (!titles.length) return;
    const apply = () => {
      titles.forEach((title) => {
        const sub = title.parentElement?.querySelector('.item__sub');
        if (!sub) return;
        const lh = parseFloat(getComputedStyle(title).lineHeight);
        if (!lh) return;
        sub.classList.toggle('item__sub--tight', title.getBoundingClientRect().height > lh * 2.5);
      });
    };
    apply();
    if (cardSummaryFitBound) return;
    cardSummaryFitBound = true;
    // 窄屏标题会重新折行，阈值要跟着重算
    let timer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => fitCardSummaries(), 150);
    });
  }

  /* ------------------------------------------------------------------ boot */
  async function boot() {
    let data;
    try {
      data = await loadData();
    } catch (err) {
      $('#hero').innerHTML =
        '<div class="wrap"><div class="prose" style="padding:4rem 0">' +
        `<h1 class="section__title">${esc(ui('loadFailTitle'))}</h1>` +
        `<p style="color:var(--text-muted)">${ui('loadFailBody')}</p></div></div>`;
      console.error(err);
      return;
    }

    const hasContent = Object.values(NAV_SOURCE).some((k) => data[k]?.length);
    if (!hasContent) {
      $('#hero').innerHTML =
        `<div class="wrap"><p style="padding:4rem 0">${esc(ui('noContent'))}</p></div>`;
      return;
    }

    const go = (next, opts) => render(data, next, { pushState: true, ...opts });
    initChrome(data, go);
    initScrollChrome();
    initTheme();
    // 站点只有英文；initLang 把骨架里的静态文案和 aria-label 刷成 UI 表里的英文
    initLang();

    render(data, parseRoute(data), { scrollTop: false });

    window.addEventListener('popstate', () => {
      render(data, parseRoute(data), { scrollTop: false });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
