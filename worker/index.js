/* =============================================================================
 * 社交预览图（og:image）按条目注入
 * -----------------------------------------------------------------------------
 * 站点是纯静态的，index.html 里只有一份写死的 og:image。微信、X、Slack 这类
 * 爬虫不执行 JS，所以 js/app.js 的 updateMeta() 改的标签它们看不到 —— 引用
 * 任何 ?p= 链接拿到的都是那一张默认图。
 *
 * 这里在返回 HTML 之前，按 ?p=<id> 从 data/projects.js 里找出那一条，把
 * og:image（和 og:title / og:description / twitter:image）替换成它自己的。
 * 封面图的选取顺序和 updateMeta() 一致：teaser 是静态图就用它，否则用 poster，
 * 再退回列表卡片的 thumb。
 *
 * 只处理文档请求（浏览器地址栏、爬虫），不影响 css / js / 图片这些子资源。
 * 数据解析失败时原样返回静态 HTML，预览图退回 index.html 里的默认值。
 * ========================================================================== */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 只有 GET 的页面文档需要改写。HEAD 没有正文可改，其余方法原样转发。
    if (request.method !== 'GET') return env.ASSETS.fetch(request);

    const id = url.searchParams.get('p');
    if (!id) return env.ASSETS.fetch(request);

    // 先确认这次请求的就是页面本身。带 ?p= 的 js/css 请求不存在，但稳妥起见
    // 只改写 HTML 响应。
    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;

    let html = await response.text();
    try {
      const data = await readSiteData(env);
      const item = data && findItem(data, id);
      if (item) html = applyMeta(html, item, data, url);
    } catch (err) {
      // 解析失败不影响页面，只是预览图退回默认值。
      console.error('og rewrite skipped:', err);
    }

    // 预览图跟着 query string 变，而静态资源默认按路径缓存、不看查询串。
    // 标成私有，避免边缘把某个 ?p= 的页面缓存下来再发给别的链接。
    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.delete('content-length');
    headers.set('cache-control', 'private, no-cache');
    return new Response(html, { status: response.status, headers });
  },
};

/** 读 data/projects.js，抽出 window.SITE_DATA。结果按 isolate 缓存。 */
let cached = null;
async function readSiteData(env) {
  if (cached) return cached;
  const res = await env.ASSETS.fetch(new Request('https://assets.local/data/projects.js'));
  if (!res.ok) throw new Error(`projects.js ${res.status}`);
  cached = extractSiteData(await res.text());
  return cached;
}

/** 三个数组共用 ?p= 命名空间，和 js/app.js 的 findItem() 一样先找到先返回。 */
function findItem(data, id) {
  for (const key of ['projects', 'papers', 'posts']) {
    const hit = (data[key] || []).find((it) => it && it.id === id);
    if (hit) return hit;
  }
  return null;
}

/** 在 worker 里跑一遍数据文件，拿到 window.SITE_DATA。
 *  文件只做常量声明和一次赋值，没有 DOM 依赖；用 Function 而不是 eval，
 *  并且不给它任何宿主对象。 */
function extractSiteData(source) {
  const window = {};
  new Function('window', source)(window);
  if (!window.SITE_DATA) throw new Error('SITE_DATA missing');
  return window.SITE_DATA;
}

/** 和 js/app.js 的 updateMeta() 用同一套规则挑图、取文案。 */
function shareImage(item) {
  const teaser = item.teaser || {};
  const src = str(teaser.src);
  if (src && !isVideo(src)) return src;
  return str(teaser.poster) || str(item.thumb);
}

function applyMeta(html, item, data, url) {
  const team = plain(data.site && data.site.team);
  const title = `${plain(item.title)}${team ? ` · ${team}` : ''}`;
  const desc = plain(item.abstract || item.subtitle).slice(0, 200);
  const image = shareImage(item);

  if (title) html = setMeta(html, 'property', 'og:title', title);
  if (desc) {
    html = setMeta(html, 'property', 'og:description', desc);
    html = setMeta(html, 'name', 'description', desc);
  }
  if (image) {
    const abs = new URL(image, url).href;
    html = setMeta(html, 'property', 'og:image', abs);
    html = setMeta(html, 'name', 'twitter:image', abs);
  }
  html = setMeta(html, 'property', 'og:url', url.href);
  return html;
}

/** 替换已有的 meta，没有就插到 </head> 前。 */
function setMeta(html, attr, key, value) {
  const content = escAttr(value);
  const re = new RegExp(
    `<meta\\s+${attr}=(["'])${key}\\1\\s+content=(["'])[\\s\\S]*?\\2\\s*/?>`,
    'i',
  );
  if (re.test(html)) {
    return html.replace(re, `<meta ${attr}="${key}" content="${content}">`);
  }
  const tag = `<meta ${attr}="${key}" content="${content}">`;
  return html.includes('</head>') ? html.replace('</head>', `${tag}\n</head>`) : html;
}

const isVideo = (src) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src);

/** 内容字段归一化，对齐 js/app.js 的 t()：字符串原样，只含 en 的旧对象取 en。 */
function str(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).every((k) => k === 'en')) {
    return v.en ?? '';
  }
  return '';
}

/** 剥掉富文本标签和标题里的 *强调*，给纯文本的 meta 用。 */
function plain(v) {
  return str(v).replace(/<[^>]+>/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

function escAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
