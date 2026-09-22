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

  /* ================================================================ i18n ===
   * 数据里任何面向读者的字段都可以写成 { zh: "中文", en: "English" }，
   * 也可以直接写一个字符串（那就两种语言共用，比如人名、数字、代码）。
   * t() 负责按当前语言取值，缺失的语言回落到另一种，不会渲染出 undefined。
   * ====================================================================== */
  const LANGS = ['zh', 'en'];
  const LANG_KEY = 'pp-lang';

  /** 首次访问按浏览器语言猜，之后跟随用户的选择 */
  function initialLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
    return /^zh\b/i.test(navigator.language || '') ? 'zh' : 'en';
  }
  let LANG = initialLang();

  /** 取当前语言的值。传入字符串/数字则原样返回。 */
  function t(v) {
    if (v === null || v === undefined) return '';
    if (typeof v !== 'object' || Array.isArray(v)) return v;
    // 只认 zh/en 两个键，别的对象原样返回（避免误伤结构化数据）
    if (!LANGS.some((k) => k in v)) return v;
    const other = LANGS.find((k) => k !== LANG);
    return v[LANG] ?? v[other] ?? '';
  }

  /** 界面文案（按钮、提示这类不属于内容的字） */
  const UI = {
    zh: {
      skip: '跳到正文', loading: '正在加载…', empty: '这个栏目还没有内容。',
      noContent: '还没有任何内容。',
      readMore: '阅读全文', viewProject: '查看项目',
      viewAll: (n) => `查看全部 ${n} 项`,
      abstract: '摘要', overview: '概览', bibtex: 'BibTeX', citeUs: '引用',
      ack: '致谢',
      copy: '复制', copied: '已复制',
      navLabel: '主导航', tocLabel: '章节导航', footerLabel: '页脚链接',
      pickProject: '选择项目', zoomIn: (c) => `放大查看：${c}`,
      closePreview: '关闭预览', compareHint: (a) => `对比滑块：向右显示 ${a}`,
      samples: '样例', prevGroup: '上一组样例', nextGroup: '下一组样例',
      groupOf: (i, n) => `第 ${i} 组，共 ${n} 组`,
      goToGroup: (i) => `跳到第 ${i} 组`,
      /* 三维查看器（sceneViewer / compareViewer 两个 section type 用） */
      viewerLoad: '载入 3D 场景',
      viewerRelease: '释放 3D 查看器',
      viewerRetry: '重新载入 3D 场景',
      viewerIdle: '场景尚未载入。',
      viewerInit: '正在初始化 3D 查看器…',
      viewerReleased: '查看器已释放 · 可再次载入',
      viewerLoading: '正在载入场景与全景图…',
      viewerLoaded: '已载入 · 拖动旋转 · 滚轮缩放',
      viewerParsing: '正在解析几何与贴图…',
      viewerProgressPct: (p) => `正在载入模型 ${p}%`,
      viewerProgressMB: (mb) => `正在载入模型 ${mb} MB`,
      viewerLoadedFull: (m, mb) => `已载入 · ${m} 个网格 · ${mb} MB · 点一下画面，然后用 W/A/S/D 移动`,
      viewerFailed: (msg) => `3D 载入失败：${msg}`,
      viewerCanvas: '可交互的 3D 场景。拖动旋转，滚轮缩放。',
      viewerCanvasRoam: '可旋转缩放的 3D 场景。W/A/S/D 移动，R/F 升降，Shift 加速。',
      viewerEnvRotation: '环境旋转',
      viewerOverview: '全景视角',
      viewerView: '视角',
      viewerReset: '重置视角',
      viewerSection: '剖切高度',
      viewerWireframe: '线框',
      viewerFullscreen: '全屏',
      viewerFromScratch: '从零搭建',
      viewerWithMira: '用 Mira-Scene',
      viewerPickCase: '选择案例',
      viewerCase: (i) => `案例 ${i}`,
      // 中文不加空格：英文那条是 "X is not loaded."，直译过来中间会多一个空格
      viewerNotLoaded: (side) => `${side}尚未载入。`,
      viewerNoSelection: '未选择场景。',
      viewerInitSide: (side) => `正在初始化「${side}」查看器…`,
      viewerFailSide: (side, msg) => `「${side}」载入失败：${msg}`,
      viewerFullscreenFail: (msg) => `无法进入全屏：${msg}`,
      ccmWorkflow: '查看 CCM 工作流 →',
      toLight: '切换到浅色模式', toDark: '切换到深色模式',
      switchLang: '切换到 English', langShort: '中',
      contact: '联系我们',
      loadFailTitle: '内容加载失败',
      loadFailBody:
        '没能读到站点数据。确认 <code>data/projects.js</code> 存在并被 index.html 引用；' +
        '如果你改成了 <code>data/projects.json</code>，需要通过 http 打开页面' +
        '（例如 <code>python -m http.server</code>），file:// 协议下浏览器会拦掉 fetch。',
    },
    en: {
      skip: 'Skip to content', loading: 'Loading…', empty: 'Nothing here yet.',
      noContent: 'No content yet.',
      readMore: 'Read more', viewProject: 'View project',
      viewAll: (n) => `View all ${n}`,
      abstract: 'Abstract', overview: 'Overview', bibtex: 'BibTeX', citeUs: 'Cite us',
      ack: 'Acknowledgements',
      copy: 'Copy', copied: 'Copied',
      navLabel: 'Main navigation', tocLabel: 'On this page', footerLabel: 'Footer links',
      pickProject: 'Select a project', zoomIn: (c) => `Zoom in: ${c}`,
      closePreview: 'Close preview', compareHint: (a) => `Comparison slider: drag right for ${a}`,
      samples: 'samples', prevGroup: 'Previous samples', nextGroup: 'Next samples',
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
      switchLang: '切换到中文', langShort: 'EN',
      contact: 'Contact',
      loadFailTitle: 'Failed to load content',
      loadFailBody:
        'Could not read the site data. Make sure <code>data/projects.js</code> exists and is ' +
        'referenced from index.html. If you switched to <code>data/projects.json</code>, serve the ' +
        'page over http (e.g. <code>python -m http.server</code>) — browsers block fetch on file://.',
    },
  };
  /** 界面文案取值：ui('readMore')，带参数的 ui('viewAll', 3) */
  const ui = (key, ...args) => {
    const v = (UI[LANG] || UI.zh)[key];
    return typeof v === 'function' ? v(...args) : (v ?? '');
  };

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
   * 再由 initCarousel 填上 src（44 个视频同时预载会把 HF CDN 打满）。 */
  function renderMedia(src, { poster, autoplay = true, controls, alt = '', lazy = false } = {}) {
    if (isVideo(src)) {
      const wantControls = controls === undefined ? !autoplay : controls;
      const v = el('video', {
        src: lazy ? null : src, poster, playsinline: true, muted: true, loop: true,
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
    return el('img', { src, alt, loading: 'lazy', decoding: 'async' });
  }

  function renderAuthors(p) {
    const frag = document.createDocumentFragment();
    if (Array.isArray(p.authors) && p.authors.length) {
      const names = p.authors.map((a) => {
        const sup = [
          ...(a.affil || []).map(String),
          ...(a.note ? [t(a.note)] : []),
        ].join(',');
        // bold: true 把名字加重（通常是共一 / 项目负责人这类）。加在名字上、
        // 不含上标，省得标注符号也跟着变粗。用 <strong> 而不是纯 CSS 类，
        // 屏幕阅读器也能听出这个强调。
        const nameHTML = a.bold ? `<strong>${esc(t(a.name))}</strong>` : esc(t(a.name));
        const inner = `${nameHTML}${sup ? `<sup>${esc(sup)}</sup>` : ''}`;
        return a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${inner}</a>` : inner;
      });
      frag.append(el('div', { class: 'authors' }, names.join('<span aria-hidden="true">, </span>')));
    }
    if (Array.isArray(p.affiliations) && p.affiliations.length) {
      const list = p.affiliations
        .map((a, i) => `<sup>${i + 1}</sup>${esc(t(a))}`)
        .join('<span aria-hidden="true">　</span>');
      frag.append(el('div', { class: 'affils' }, list));
    }
    if (p.authorNotes) frag.append(el('div', { class: 'author-notes' }, esc(t(p.authorNotes))));
    return frag;
  }

  function renderLinkRow(links = []) {
    if (!links.length) return null;
    const row = el('div', { class: 'link-row' });
    links.forEach((l, i) => {
      const a = el('a', {
        class: `btn${i === 0 ? '' : ' btn--ghost'}`,
        href: l.href || '#',
        target: /^https?:/.test(l.href || '') ? '_blank' : null,
        rel: /^https?:/.test(l.href || '') ? 'noopener' : null,
      }, `${icon(l.icon)}<span>${esc(t(l.label))}</span>`);
      row.append(a);
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
   * 人工控制的两行。数据里的字段是 titleBreakAfter（可双语），比如
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
  function heroBackdrop(host) {
    host.append(el('div', { class: 'hero__aurora', 'aria-hidden': 'true' }));
    host.append(el('div', { class: 'hero__grid', 'aria-hidden': 'true' }));
    host.append(el('div', { class: 'hero__noise', 'aria-hidden': 'true' }));
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
    heroBackdrop(host);

    const wrap = el('div', { class: 'wrap' });

    if (data && navKey && go) {
      const back = backLink(data, navKey, go);
      if (back) wrap.append(back);
    }

    wrap.append(el('h1', { class: 'hero__title', id: 'project-title' },
      heroTitleHTML(p.title, p.titleBreakAfter)));
    if (p.subtitle) wrap.append(el('p', { class: 'hero__subtitle' }, rich(t(p.subtitle))));

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

    // teaser
    if (p.teaser && p.teaser.src) {
      const fig = el('figure', { class: 'teaser', style: 'margin-inline:0' });
      const frame = el('div', { class: 'frame' });
      // teaser 是页面主内容，给控制条（读者要能暂停、拖进度条）。
      // 仍然自动播 + 静音，否则浏览器会拦掉自动播放。
      frame.append(renderMedia(p.teaser.src, {
        poster: p.teaser.poster,
        controls: true,
        alt: t(p.teaser.alt) || `${plain(p.title)} teaser`,
      }));
      fig.append(frame);
      if (p.teaser.caption) {
        fig.append(el('figcaption', { class: 'caption' }, rich(t(p.teaser.caption))));
      }
      wrap.append(fig);
    }

    // highlights
    if (Array.isArray(p.highlights) && p.highlights.length) {
      const stats = el('div', { class: 'stats' });
      p.highlights.forEach((h) => {
        stats.append(el('div', { class: 'stat' },
          `<div class="stat__value">${esc(t(h.value))}</div>` +
          `<div class="stat__label">${esc(t(h.label))}</div>`));
      });
      wrap.append(stats);
    }

    host.append(wrap);
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
      controls: isVideo(f.src) ? true : undefined,
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
      const frame = el('div', { class: 'frame' });
      frame.append(renderMedia(s.src, {
        poster: s.poster, alt: t(s.alt) || t(s.title) || 'figure',
      }));
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
     * 注意这里的样例**不进灯箱**：视频带了控制条，再套一层「点击放大」的 button
     * 会抢掉播放/拖进度条的点击。要放大用浏览器全屏按钮。 */
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
        class: 'carousel', dataset: { per: String(per) }, style: 'margin-top:1.5rem',
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
          const frame = el('div', { class: 'frame' });
          // lazy：44 个视频一起预载会把 CDN 打满，交给 initCarousel 按页填 src
          frame.append(renderMedia(it.src, {
            poster: it.poster, alt: cap || 'sample', controls: true, lazy: true,
          }));
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
      const table = el('table', { class: 'data' });
      table.append(el('thead', {},
        `<tr>${(s.columns || []).map((c) => `<th scope="col">${esc(t(c))}</th>`).join('')}</tr>`));
      const hl = new Set(s.highlightRows || []);
      const body = el('tbody');
      (s.rows || []).forEach((r, i) => {
        const cells = r.map((cell, j) =>
          j === 0 ? `<th scope="row" style="font-weight:inherit">${esc(t(cell))}</th>`
                  : `<td>${esc(t(cell))}</td>`).join('');
        body.append(el('tr', { dataset: hl.has(i) ? { highlight: 'true' } : {} }, cells));
      });
      table.append(body);
      scroll.append(table);
      box.append(scroll);
      if (s.footnote) box.append(el('p', { class: 'table-note' }, rich(t(s.footnote))));
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
    const wrap = el('div', { class: 'wrap' });
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
    entries.forEach(({ id, label }) => {
      // data-label 给窄屏那套「圆点 + 悬停浮出标题」用：那时 a 自己是
      // color:transparent，标题只能走 ::after 的 content: attr(data-label)。
      // title 属性一并带上，键盘/读屏和原生 tooltip 都能拿到全名（列表里
      // 长标题是 ellipsis 截断的）。
      inner.append(el('a', {
        href: `#${id}`, 'data-label': label, title: label,
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

      // 把某一页的视频地址填上（只填一次，填过就跳过）
      const hydrate = (pi) => {
        const page = pages[pi];
        if (!page || page.dataset.hydrated === 'true') return;
        page.dataset.hydrated = 'true';
        $$('video[data-src]', page).forEach((v) => {
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
        }
        pages.forEach((page, i) => {
          const on = i === cur;
          // aria-hidden + inert：读屏和 Tab 都不该进到看不见的页里
          page.setAttribute('aria-hidden', on ? 'false' : 'true');
          if (on) page.removeAttribute('inert'); else page.setAttribute('inert', '');
          $$('video', page).forEach((v) => {
            if (on) {
              // 只自动播原本标了 autoplay 的（reduce-motion 下不会有这个标记）。
              // 还没填 src 的先不管：hydrate 之后的那次 show() 会来播。
              if (v.dataset.autoplay === 'true' && v.getAttribute('src')) {
                const pr = v.play(); if (pr?.catch) pr.catch(() => {});
              }
            } else if (!v.paused) {
              v.pause();
            }
          });
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

      // 键盘左右键翻页。焦点在视频控制条上时不抢 —— 那时左右键是快退/快进。
      car.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'VIDEO') return;
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

    const open = (src, caption) => {
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
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    };
    closeLightbox = close;

    $$('.tile', root).forEach((tile) => {
      tile.addEventListener('click', () => open(tile.dataset.src, tile.dataset.caption));
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

  /** 主题切换（跟随系统 → light → dark 循环，存 localStorage）。
   * 换语言时按钮的 aria-label 要跟着变，所以把刷新逻辑存成模块级函数。 */
  let refreshThemeLabel = () => {};
  function initTheme() {
    const btn = $('#theme-toggle');
    const KEY = 'pp-theme';
    const isDark = () =>
      document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const apply = (mode) => {
      if (mode === 'light' || mode === 'dark') document.documentElement.dataset.theme = mode;
      else delete document.documentElement.dataset.theme;
      const dark = isDark();
      btn.innerHTML = dark ? ICONS.sun : ICONS.moon;
      btn.setAttribute('aria-label', dark ? ui('toLight') : ui('toDark'));
    };
    refreshThemeLabel = () => {
      btn.setAttribute('aria-label', isDark() ? ui('toLight') : ui('toDark'));
    };
    let mode = localStorage.getItem(KEY) || 'auto';
    apply(mode);
    btn.addEventListener('click', () => {
      mode = isDark() ? 'light' : 'dark';
      localStorage.setItem(KEY, mode);
      apply(mode);
    });
  }

  /* ---------------------------------------------------------- 语言切换 ---
   * 切语言不改 URL、不动滚动位置，只是把整页按新语言重画一遍。
   * 选择存 localStorage，下次访问沿用。 */
  function initLang(rerender) {
    const btn = $('#lang-toggle');
    const paint = () => {
      btn.textContent = ui('langShort');
      btn.setAttribute('aria-label', ui('switchLang'));
      document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
      $('#skip-link').textContent = ui('skip');
      $('#header-nav').setAttribute('aria-label', ui('navLabel'));
      $('#toc').setAttribute('aria-label', ui('tocLabel'));
      $('#footer-links').setAttribute('aria-label', ui('footerLabel'));
      $('#switcher-menu').setAttribute('aria-label', ui('pickProject'));
      $('#lightbox-close').setAttribute('aria-label', ui('closePreview'));
      // 首屏那句"正在加载…"：数据还没渲染上来时也跟着语言走
      const ph = $('#hero-placeholder');
      if (ph) ph.textContent = ui('loading');
      refreshThemeLabel();
    };
    paint();
    btn.addEventListener('click', () => {
      LANG = LANG === 'zh' ? 'en' : 'zh';
      localStorage.setItem(LANG_KEY, LANG);
      paint();
      rerender();
    });
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
      if (item.teaser?.src && !isVideo(item.teaser.src)) image = item.teaser.src;
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

    initCarousel(main);
    initCompare(main);
    initSceneViewers(main);
    initLightbox(main);
    initCopy(main);
    initReveal(document);
    initTocHighlight();

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
      if (s.title) tocEntries.push({ id: node.id, label: t(s.title) });
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
    // 切语言：原地重画当前视图，不动 URL 也不跳回顶部
    initLang(() => render(data, parseRoute(data), { scrollTop: false }));

    render(data, parseRoute(data), { scrollTop: false });

    window.addEventListener('popstate', () => {
      render(data, parseRoute(data), { scrollTop: false });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
