/* =============================================================================
 * 站点内容 —— 你平时只需要改这个文件（图片视频在 R2，见下面 ASSETS 的注释）
 * -----------------------------------------------------------------------------
 * 内容只写英文，直接写字符串。人名、会议名、数字、代码、URL 也一样。
 *
 * 三个栏目各有一个数组：
 *   nav key "project"  -> projects[]   对外发布的项目 / 系统 / 工具
 *   nav key "research" -> papers[]     论文
 *   nav key "blog"     -> posts[]      文章
 * 三个数组的 id 共用 ?p= 命名空间，不要重名。
 *
 * 这个文件把数据挂在 window.SITE_DATA 上，好处是双击 index.html 就能预览，
 * 不用起本地服务器（file:// 下 fetch json 会被浏览器拦掉）。
 * ========================================================================== */

/* 页面素材（视频、动图、图片、三维模型、PDF）都在 Cloudflare R2 的 eden-page-assets 桶里，
 * 经 assets.vast-eden.ai 走 Cloudflare CDN 访问，不进仓库。桶里的 key 都以 assets/ 开头，
 * 下面的常量就是这几个目录的完整地址。上传和缓存的做法见 CLAUDE.md 的「素材」一节。
 * 进桶之前都压过：视频转成动态 AVIF，图片转 WebP；宣传片例外，用原片、不转码。
 * 原件在 HuggingFace dataset（huanngzh/page-assets、ToRealU/eden-page-assets）里，路径和
 * 这里一一对应 —— 要换参数重转就从那边取，别拿压过的再压一遍。
 *
 * pages/ccm-workflow/data/manifest.json 里也写死了同一个地址，换的话两处一起换。 */
const ASSETS = 'https://assets.vast-eden.ai/';

/* StereoWorld：assets/stereo-world/{videos,images,stereo_video,stereo_depth,flex_demo,ar_demo,inpaint_demo}/ */
const SW = ASSETS + 'assets/stereo-world/';

/* Mira-Scene 的素材在 assets/mira-scene/ 下：
 *   images/      teaser.webp、layout_representation.webp、pipeline.avif（动图）
 *   videos/      demo.mp4（teaser）
 *   simulation/  blender/sim1..4.avif、isaac/interaction1..3.avif
 *   scenes/      12 张场景查看器的预览图（文件名 = manifest 里的 case id）
 *   astra/       6 张 Astra 对比案例的缩略图（01..06 前缀 = 原站的展示顺序）
 *
 * 三维素材另算，见下面的 MS3。 */
const MS = ASSETS + 'assets/mira-scene/';

/* 三维素材和 CCM workflow 的中间结果，在 assets/mira-scene/3d/ 下：
 *   viewers/scenes/<caseId>/{scene.glb,environment.webp}       12 个可旋转场景 + 环境全景图
 *   viewers/astra/<caseId>/{from_scratch,with_mira_scene}.glb  6 组并排对比
 *   workflow/<caseId>/...                                      CCM 分步工作流那一页
 *
 * 这些模型单个 7~78MB，一律「点了才下载」：section 默认只渲染预览图，
 * 读者点「载入 3D 场景」才动态 import three.js 并抓 GLB。
 * 查看器实现在 js/viewers/，接线在 js/app.js 的 initSceneViewers()。 */
const MS3 = MS + '3d/';

/* 列表卡片的缩略图。四篇论文的封面都在仓库内（assets/research/*.jpg），
 * 直接相对路径引用，见各条目的 thumb。做法见 CLAUDE.md 的「工作封面」一节：
 * 一律从该工作自己的结果素材里裁，不画示意图。
 * R2 上 assets/thumbs/ 还留着更早的示意图版本。
 * 这个常量目前没有其他引用，保留是为了以后要回 R2 或加新缩略图时直接用。 */
const TH = ASSETS + 'assets/thumbs/';
/* OPTD 的素材在 R2 的 assets/optd/ 下（64 张 PNG + 32 段 mp4，约 172MB），
 * 和站点其余素材一样不进仓库。图片文件名带空格（"image 1.png"），
 * URL 里的空格由浏览器转义，引用处照原名写。 */
const OPTD_ASSET = ASSETS + 'assets/optd/';
const OPTD_IMAGE_FILES = [
  'image.png', ...Array.from({ length: 59 }, (_, i) => `image ${i + 1}.png`),
];
const OPTD_IMAGE_ITEMS = OPTD_IMAGE_FILES.map((file) => ({ src: `${OPTD_ASSET}images/${file}` }));
const OPTD_VIDEO_FILES = [
  'rank_00_batch_00.mp4', '0053.mp4', '0063.mp4', '0066.mp4',
  '0103.mp4', '0106.mp4', '0114.mp4', '0151.mp4', '0159.mp4',
  '0217.mp4', '0276.mp4', '0354.mp4', '0263.mp4', '0300.mp4',
  '0860.mp4', '0426.mp4',
];
const OPTD_VIDEO_ITEMS = OPTD_VIDEO_FILES.map((file) => ({ src: `${OPTD_ASSET}videos/${file}` }));
const OPTD_CAUSAL_VIDEO_FILES = [
  'rank_00_batch_02.mp4', 'rank_00_batch_03.mp4', 'rank_00_batch_10.mp4',
  'rank_00_batch_11.mp4', 'rank_00_batch_13.mp4', 'rank_00_batch_15.mp4',
  'rank_00_batch_22.mp4', 'rank_00_batch_24.mp4', 'rank_00_batch_26.mp4',
  'rank_00_batch_28.mp4', 'rank_01_batch_00.mp4', 'rank_01_batch_10.mp4',
  'rank_01_batch_24.mp4', 'rank_01_batch_33.mp4', 'rank_02_batch_10.mp4',
  'rank_02_batch_15.mp4',
];
const OPTD_CAUSAL_VIDEO_ITEMS = OPTD_CAUSAL_VIDEO_FILES.map((file) => ({
  src: `${OPTD_ASSET}videos/causal/${file}`,
}));

/* MultiLive 的页面素材（宣传片、12 张动图、5 张图片、论文 PDF）。 */
const ML = ASSETS + 'assets/multilive/';

/* EdenLive 的素材在 assets/edenlive/clips/ 下。文件名是随机短码，不带分辨率和模型名。
 * 短码与本地 artifacts/ 原文件名的对照在 data/edenlive-clips.md。
 *
 * 宣传片 e64ab20b.mp4 是原片；其余都是同名的 <短码>.avif 动图（60 张共 153MB）：
 *   作品带 27 格：clip 前 12 秒（5 秒 wipe + 7 秒生成画面）缩到 500×288，每张约 190KB。
 *     27 路 832×480、约 4Mbps 的视频同时播，带宽供不上。生成命令见 CLAUDE.md「滚动条带」。
 *   四节应用轮播 33 张：整段转，见 app-game 的注释。
 * 原视频在 HF dataset 里，重新生成动图从那边取。
 *
 * 条带的挑选（本地目录 edenlive-wipe-480 里实际有 31 个，这里只用 27 个）：
 * 三个 elda 文件夹（025/026/028）内容高度相似，只留 025 的 wan21；
 * 两个火箭发射（082/084）只留 082。相似的格子挨着滚过去会看成同一段在重播。
 * 后来换过一批：拿掉 doodle-jump、elda 的 wan22、合金弹头、光剑切箱子、草原疾驰，
 * 补上运河小船 / 提灯划小船、闪身步 / 地下遗迹 / 火星车漫游，外加 025 的 wan21。
 * 奥特曼飞行小游戏渲过但不稳定，没有放进条带。第一行 12 格、第二行 15 格。 */
const EL = ASSETS + 'assets/edenlive/clips/';

window.SITE_DATA = {
  /* ---------------------------------------------------------------- 站点级 */
  site: {
    team: "Eden",
    // teamShort 是窄屏下 header 里的缩写。"Eden" 本身够短，两处写一样即可。
    teamShort: "Eden",
    tagline: "Generative models for interaction and simulation.",
    // header 用 VAST [EdenLive] 组合字标；favicon 在 index.html 里单独指定
    logo: "assets/eden-logo-black.svg",
    // 页脚链接（header 主导航是 Project / Research / Blog，见下面的 nav）
    links: [
      { label: "X", href: "https://x.com/VastAIResearch", icon: "twitter" },
    ],
    footer: {
      note: "We build generative models for interaction and simulation.",
      // 页脚最下面那行小字。省略的话整行（含上方分隔线）会隐藏。
      credit: "© 2026 VAST",
      contact: "mailto:huanngzh@gmail.com",
    },
  },

  /* -------------------------------------------------------------- 首页文案 */
  /* 打开 index.html（不带任何 query）时看到的东西。
   * title 里 *星号* 包住的词会显示成品牌色。 */
  home: {
    title: "We build *generative models* for interaction and simulation.",
    // intro 省掉了：主标题已经把话说完，底下再跟一段同义的展开是重复。
    // 想加回来就补一个 intro 字符串，渲染层会自动显示（没有就整段隐藏）。
  },

  /* ------------------------------------------------------- 栏目（列表页） */
  /* 每个栏目对应 header 里一个导航项，URL 是 index.html?s=<key>
   * key 决定条目来源：project -> projects[]，research -> papers[]，blog -> posts[] */
  nav: [
    {
      // EdenLive 进来之后这个栏目就有真内容了，入口放出来。
      // 想临时藏回去就加一行 hidden: true —— 数据和路由都还在，
      // ?s=project / ?p=<id> 仍然能直达。
      key: "project",
      label: "Project",
      title: "Projects",
      intro: "Systems, models, and tools we release.",
    },
    {
      key: "research",
      label: "Research",
      title: "Research",
      intro: "Our research papers.",
    },
    {
      // 同上：内容仍是占位，先隐藏入口
      hidden: true,
      key: "blog",
      label: "Blog",
      title: "Blog",
      intro: "Engineering notes and ideas.",
    },
  ],

  /* ---------------------------------------------------------------- 项目 */
  /* Project 栏目（放在 Research 上面）。适合放对外发布的系统、模型、工具 ——
   * 通常没有 venue，但有 demo / 代码 / 权重链接。
   * 字段和 papers[] 完全一样，用不到的删掉即可。 */
  projects: [
    /* ======================================================== EdenLive ===
     * 页面结构（sections 的顺序就是页面顺序）：
     *   hero（backdrop 视频打底：标题 / 作者 / 按钮压在上面）
     *   → TL;DR（subtitle 字段）
     *   → teaser（宣传片）
     *   → Abstract
     *   → overview     输入输出 + 整体流程
     *   → interaction  交互回路（紧跟 overview：都是在讲「怎么跑」）
     *   → highlights   四个特点
     *   → method       视觉编码器 / 数据 / 蒸馏
     *   → apps         应用方向展开（本页重点，每个一节，tocDepth: 2）
     *   → comparison   和其他路线的对比
     *
     * 素材目前全是占位的 assets/placeholder/*.svg，真素材进来后按下面每处
     * 的注释替换（视频一律 mp4，teaser 记得配 poster）。 */
    {
      id: "edenlive",
      title: "EdenLive: *Real-Time Generative Rendering* from Any Visual Reference",
      titleBreakAfter: "EdenLive: *Real-Time Generative Rendering*",
      short: "EdenLive",
      /* TL;DR 是两条要点，不是一句话：
       *   1. 思想 —— 面向交互世界，把状态演化与外观解耦：状态由 code agent 或 engine 维护；
       *   2. 性能 —— reference video 实时渲染成 enhanced video，24 fps 起，消费级 GPU 也能跑。
       * 写 <li> 是因为 rich() 允许 HTML。详细的输入输出留给下面的 overview 一节。 */
      subtitle: "<li>Decouple state evolution and appearance for interactive worlds: state is " +
            "maintained by a code agent or engine, while EdenLive renders.</li>" +
            "<li>EdenLive renders reference videos to enhanced videos in real time at 24 fps " +
            "or higher, even on a consumer GPU (RTX 5090).</li>",
      date: "2026-10",
      /* 首页卡片的封面。别的条目用的是生成的示意图，这个是拿 088（第一人称
       * 冰冻枪）擦除片的首帧裁成 16:10 做的 —— 左边 proxy、右边成片，本来就
       * 把 EdenLive 在做的事画在一张图里了。文字压在左半边，那边加了一层蒙版。
       * 重做见 scripts/cover.py。 */
      thumb: ASSETS + "assets/edenlive/cover.jpg",
      keywords: [
        "generative rendering",
        "real-time video generation",
        "proxy-to-fine",
        "interactive world",
      ],

      /* 标题下方的作品带：两行横向滚动的动态图
       * 第一行 12 格、第二行 15 格，共 27 张。
       * 两行方向相反，视觉上更像「一片正在跑的素材」而不是一条传送带。
       *
       * 每格是同名 clip 前 12 秒做成的动态 AVIF（见文件顶部 EL 的注释），不是视频。
       * 纯装饰：aria-hidden，并且是懒加载的 —— 只有滚到视野附近的格子才下载，
       * 没到的显示骨架。读者要看的是下面的 teaser。
       * 右下角有个暂停按钮（动效 + 流量都能被用户掐掉）。 */
      backdrop: {
        rows: [
          [
            EL + "c901fab6.avif",
            EL + "f4bb3f37.avif",
            EL + "afb26e68.avif",
            EL + "4c37c8d1.avif",
            EL + "34bd577a.avif",
            EL + "948449bc.avif",
            EL + "ca38f196.avif",
            EL + "6d9632a9.avif",
            EL + "1cbd0d35.avif",
            EL + "c6e8434c.avif",
            EL + "0890969e.avif",
            EL + "71585601.avif",
          ],
          [
            EL + "8da956a9.avif",
            EL + "4d69026d.avif",
            EL + "075191ee.avif",
            EL + "d0a94370.avif",
            EL + "cffd5edf.avif",
            EL + "8dd568c5.avif",
            EL + "2cd581b1.avif",
            EL + "5c88a24a.avif",
            EL + "e2521235.avif",
            EL + "ee67545b.avif",
            EL + "00282906.avif",
            EL + "801ad06f.avif",
            EL + "a4195340.avif",
            EL + "92849ce6.avif",
            EL + "7eb84745.avif",
          ],
        ],
      },

      authors: [
        { name: "Zehuan Huang", affil: [1], note: "*", bold: true },
        { name: "Tian-Xing Xu", affil: [1], note: "*", bold: true },
        { name: "Chunli Peng", affil: [1], note: "*", bold: true },
        { name: "Cheng Zhang", affil: [1], note: "*", bold: true },
        { name: "Zeyi Zheng", affil: [1], note: "†", breakBefore: true },
        { name: "Yifei Song", affil: [1], note: "†" },
        { name: "Zekai Gu", affil: [1], note: "†" },
        { name: "Zhipeng Yu", affil: [1] },
        { name: "Peng Wang", affil: [1], note: "‡", bold: true },
        { name: "Yan-Pei Cao", affil: [1], note: "✉", bold: true },
      ],
      affiliations: [{ name: "VAST", url: "https://www.tripo3d.ai/" }],
      authorNotes: "* Equal contribution　† Intern at VAST　‡ Project lead　✉ Corresponding author",

      links: [
        { label: "Paper", href: ASSETS + "assets/edenlive/EdenLive-tech-report.pdf", icon: "arxiv" },
        { label: "Code", href: "https://github.com/VAST-AI-Research/EdenLive", icon: "github" },
        { label: "Weights", href: "https://huggingface.co/VAST-AI/EdenLive", icon: "hf" },
        { label: "Live Demo", href: "#", icon: "demo" },
      ],

      /* 宣传片。TL;DR 之后、摘要之前的那一段。带声音，所以仍是视频，用原片、不转码（117MB）。 */
      teaser: {
        src: EL + "e64ab20b.mp4",
      },

      /* 数字以最终模型实测为准，现在填的是对外口径的下限 */
      highlights: [
        { value: ">24 FPS", label: "real-time" },
        { value: "Minutes", label: "continuous" },
        { value: "480P/720P", label: "output" },
        { value: "Single GPU", label: "deployment",
          note: "Single-GPU deployment applies to the 5B model (720P)." },
      ],

      /* 英文是论文摘要的原文，只把 \footnote{\url{...}} 改成了正文里的链接
       * （网页没有脚注机制）。中文按同一段话翻，不要另起一套说法。 */
      abstract: "We present EdenLive, a real-time generative video renderer for interactive applications " +
            "in the Project Eden series " +
            "(<a href=\"https://www.tripo3d.ai/research/project-eden\">project-eden</a>). " +
            "EdenLive continuously renders enhanced and stylized video from reference videos of " +
            "different geometric granularities that range from proxy videos, namely simplified " +
            "renderings produced by a coding agent or a game engine, to directly recorded videos, " +
            "with a target first frame and a text prompt as input to guide the appearance. " +
            "This design conveys the world state to the model through the reference video and thereby " +
            "decouples its interaction-induced evolution from visual rendering: the upstream code or " +
            "engine maintains the game logic and world state explicitly and precisely, whereas EdenLive " +
            "renders reference video into detailed visual output. " +
            "This separation enables the world state to be inspected, modified, and tested directly, " +
            "and interaction can extend to any quantity exposed by the upstream program. " +
            "It also relieves the neural model from learning both state transitions and appearance, " +
            "allowing the limited model capacity available for real-time deployment to concentrate on " +
            "visual synthesis. " +
            "To handle references for diverse rendering scenarios, we employ a vision encoder that maps " +
            "them into a shared feature space despite their differences in geometric granularity and " +
            "appearance, and condition the video generation model on these features, which mitigates " +
            "leakage of the reference appearance into the generated video. " +
            "To enable streaming generation, we distill the generator into a few-step chunk-wise " +
            "autoregressive model and deploy it in a serving system that pipelines program simulation, " +
            "reference encoding, and generation with a one-chunk lookahead, so that the system presents " +
            "the generated video in real time and responds to user interaction. " +
            "Experiments on short- and long-horizon generation show that EdenLive achieves good " +
            "reference control and visual quality, while generating 720P videos in real time " +
            "at over 24 FPS on a single GPU.",

      sections: [
        /* ---------------------------------------------------------- overview */
        {
          type: "figure",
          id: "overview",
          eyebrow: "Overview",
          title: "Inputs, Outputs, and the Pipeline",
          body: "<p>EdenLive operates on three <b>inputs</b>: a <b>proxy or reference video (stream)</b> " +
                "that specifies layout, camera, and motion; a <b>target first frame</b> that " +
                "determines the overall visual appearance; and a <b>text prompt</b> that supplies stylistic and fine-grained details. "+
                "The proxy can originate from arbitrary sources — a 2D or 3D scene assembled by a " +
                "coding agent, animation or simulation frames from an existing engine or " +
                "workbench, or even a screen recording. The <b>output</b> is a refined video or a " +
                "continuous video stream.</p>" +
                "<p>The paradigm of EdenLive can be summarized as <b>proxy-to-fine</b>: it leverages the " +
                "structural and motion information provided by the proxy, without requiring the " +
                "reference to attain a specific level of geometric detail or to be produced through a particular " +
                "rendering pipeline (e.g., G-buffers). Its two defining properties are " +
                "<b>real-time</b> generation (24 fps or more on a single GPU<sup class=\"fn\">*</sup>) and <b>long-horizon</b> " +
                "synthesis (minutes of continuous generation). Together, they allow rendering to be " +
                "embedded in a live interaction loop.</p>" +
                "<p class=\"fn-note\"><sup class=\"fn\">*</sup> Single-GPU deployment applies to the 5B model (720P).</p>",
          src: "assets/edenlive/pipeline-en.svg",
          caption: "<b>Pipeline.</b> Input sources (coding agent, engine or workbench, existing " +
                "video) → proxy or reference stream → EdenLive generative rendering, " +
                "conditioned on the target first frame and prompt → refined video stream. " +
                "Custom interaction is defined upstream in code or the engine; the user " +
                "acts on what they see, closing the loop.",
        },
        {
          type: "figure",
          id: "interaction",
          eyebrow: "Interaction loop",
          title: "Logic First, Pixels Follow",
          body: "<p>Consider a game as a representative setting. A coding agent first " +
                "generates the scene proxy and the engine code, which jointly maintain world " +
                "state and interaction logic. During gameplay, mouse and keyboard input is " +
                "routed to the engine, which updates the interaction state and emits simplified " +
                "frames. The resulting <b>proxy frame stream</b> is forwarded to EdenLive, which, " +
                "conditioned on the target first frame and a text prompt, continuously " +
                "synthesizes refined frames. The user observes the rendered output and issues " +
                "the subsequent action. <b>Rules, collisions, state, and feedback remain under " +
                "upstream control throughout</b>, and are thereby decoupled from the video " +
                "diffusion model — precisely <b>the class of signals that purely " +
                "action-conditioned world models are ill-equipped to maintain</b>, including " +
                "health bars, skill cooldowns, NPC state, and success or failure feedback.</p>",
          src: "assets/edenlive/interaction-en.svg",
          caption: "<b>Interaction loop.</b> User input → engine updates state → proxy frame " +
                "stream → EdenLive renders continuously → frames shown → next input. " +
                "End-to-end latency, from input to the corresponding frame appearing, is " +
                "currently in the hundreds of milliseconds.",
        },

        /* ----------------------------------------------------------- method */
        {
          type: "features",
          id: "highlights",
          eyebrow: "Highlights",
          title: "Key Properties of EdenLive",
          items: [
            {
              title: "Diverse reference inputs",
              body: "Accepts 2D and 3D proxies as well as reference video. The model " +
                    "exploits the structure and motion conveyed by the reference, without " +
                    "constraining its level of geometric detail or the pipeline by which it was produced.",
              icon: "spark",
            },
            {
              title: "Layout-preserving, appearance-controllable",
              body: "Camera, layout, and motion remain constrained by the reference, while " +
                    "target appearance and style are specified by the first frame and the " +
                    "prompt. A single reference can thus be rendered in multiple distinct styles.",
              icon: "video",
            },
            {
              title: "Real-time and long-horizon",
              body: "Generates at 24 fps or above and sustains minute-scale continuous " +
                    "synthesis, enabling rendering to consume a continuously evolving live " +
                    "reference stream. The 5B model runs in real time on a consumer GPU (RTX 5090).",
              icon: "bolt",
            },
            {
              title: "Open source",
              body: "Releases 5B and 14B weights for both bidirectional and few-step (chunk-AR) " +
                    "inference, real-time streaming inference code, a skill that turns a text " +
                    "prompt into a coarse playable game, and a frontend for the full " +
                    "prompt-to-game pipeline.",
              icon: "github",
            },
          ],
        },
        {
          type: "features",
          id: "method",
          eyebrow: "Method",
          title: "Core Techniques",
          body: "EdenLive's faithful adherence to the reference and its real-time generation " +
                "capability rest on three core techniques. Please refer to the paper for " +
                "further details.",
          items: [
            {
              title: "Structure-and-motion encoder",
              body: "Extracts layout, camera, and motion from the reference while discarding " +
                    "appearance information. This design allows the reference to remain coarse " +
                    "and enables a single proxy to be rendered in diverse styles.",
              icon: "spark",
            },
            {
              title: "High-quality data pipeline",
              body: "Constructs paired data from coarse references to refined frames, " +
                    "spanning 2D and 3D proxies, engine renderings, and real-world video, " +
                    "so that the model generalizes across diverse reference modalities.",
              icon: "data",
            },
            {
              title: "Real-time video distillation",
              body: "Distills a multi-step diffusion model into a few-step streaming " +
                    "generator, enabling real-time generation above 24 fps and minute-scale " +
                    "continuous synthesis.",
              icon: "bolt",
            },
          ],
        },

        /* ------------------------------------------------------------- apps */
        {
          type: "text",
          id: "applications",
          eyebrow: "Applications",
          // 不写「四类」：下面只是举了四个方向，不是说总共就这么多
          title: "Application Areas",
          body: "<p>We next describe several application areas that share a common premise: " +
                "<b>the reference constrains layout and motion, while appearance is specified " +
                "by the first frame and the prompt</b>. The method is therefore applicable " +
                "whenever scene structure is already available and only visual presentation " +
                "remains to be synthesized.</p>",
        },
        {
          type: "carousel",
          id: "app-game",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: "Application",
          title: "Interactive Game Preview",
          body: "<p>This application most clearly illustrates the decoupling of state from " +
                "rendering. A coding agent generates the scene proxy and the engine code, " +
                "and maintains state together with interaction control; EdenLive serves as " +
                "the real-time renderer, continuously synthesizing high-fidelity frames.</p>",
          perPage: 1,
          layout: "centered",
          // 动图样例：同名 clip 整段（30 秒、1280×704、24fps）转的循环 AVIF，
          // 9 张共 60MB，原视频是 185MB。转换命令见 CLAUDE.md 的「轮播和插图里的动图」。
          // 动图没有控制条，所以不写 controls（写了也不起作用）。
          items: [
            { src: EL + "bafe32b9.avif" },
            { src: EL + "cf2421f7.avif" },
            { src: EL + "edf33f08.avif" },
            { src: EL + "56ac4b6b.avif" },
            { src: EL + "e60f6083.avif" },
            { src: EL + "1c70aa33.avif" },
            { src: EL + "bb6c2841.avif" },
            { src: EL + "e7d6e8a9.avif" },
            { src: EL + "8811e6ec.avif" },
          ],
        },
        {
          type: "carousel",
          id: "app-preview",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: "Application",
          title: "Scene and Animation Preview",
          body: "Renders distinct appearances under a shared layout and camera trajectory. " +
                "This is useful before art assets are available: layout, camera, and motion " +
                "are already specified by the proxy, so style remains the only free variable.",
          perPage: 1,
          layout: "centered",
          // 和上一节一样是整段转的动图（见 app-game 的注释）
          items: [
            { src: EL + "ae454d05.avif" },
            { src: EL + "2819fbee.avif" },
            { src: EL + "65e47fb6.avif" },
            // 新增的成片：DMD 720p 优先，wan21 14b 480p 排在后面
            { src: EL + "efd72737.avif" },
            { src: EL + "de031217.avif" },
            { src: EL + "33bb38e6.avif" },
            { src: EL + "096ca570.avif" },
            { src: EL + "3ebf1fa9.avif" },
            { src: EL + "3d9a9e41.avif" },
            { src: EL + "67ead996.avif" },
            { src: EL + "32b05736.avif" },
            { src: EL + "537bd181.avif" },
          ],
        },
        {
          type: "carousel",
          id: "app-restyle",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: "Application",
          title: "Video Re-Rendering and Restyling",
          body: "Taking existing video as the reference, EdenLive preserves layout and " +
                "motion while altering appearance, enabling real-time replacement of " +
                "characters, content, or overall style.",
          perPage: 1,
          layout: "centered",
          // 和 app-game 一样是整段转的动图
          items: [
            { src: EL + "c7560051.avif" },
            { src: EL + "1515283e.avif" },
            { src: EL + "60e3c4d9.avif" },
            { src: EL + "6becd8f3.avif" },
            { src: EL + "72a254b9.avif" },
            { src: EL + "2f8eeb65.avif" },
          ],
        },
        {
          type: "carousel",
          id: "app-embodied",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: "Application",
          title: "Embodied Data Augmentation",
          body: "Converts real human manipulation footage into a robot viewpoint, or " +
                "replaces objects in existing egocentric video and restyles the result.",
          perPage: 1,
          layout: "centered",
          // 和 app-game 一样是整段转的动图
          items: [
            { src: EL + "748848e0.avif" },
            { src: EL + "ef7f3a46.avif" },
            { src: EL + "80ac72ba.avif" },
            { src: EL + "1fb017f8.avif" },
            { src: EL + "29e08b3c.avif" },
            { src: EL + "5a96da28.avif" },
          ],
        },

        /* ------------------------------------------------------- comparison */
        {
          type: "table",
          id: "comparison",
          eyebrow: "Comparison",
          title: "Comparison with Related Approaches",
          body: "The table below clarifies differences in positioning rather than ranking " +
                "methods. These lines of work address distinct problems.",
          columns: [
            "Approach",
            "Mechanism",
            "Difference from EdenLive",
          ],
          // 这张表是说明文字，不是数字。wrap 让单元格在栏宽内折行，
          // 否则 nowrap 会把右列挤出视口，只能横着拖。
          wrap: true,
          rows: [
            [
              "Interactive world models (Lingbot World, Pixverse R, …)",
              "Generates interactive frames conditioned on actions or text",
              "Decouples state from rendering: the proxy maintains state and interaction " +
                    "control, while EdenLive is responsible only for rendering, so that health, " +
                    "cooldowns, NPC state, and success or failure feedback can be preserved",
            ],
            [
              "Vidu S2",
              "Also performs real-time reference-driven generation",
              "Vidu S2 is largely restricted to portrait scenes, whereas EdenLive " +
                    "handles diverse forms of reference",
            ],
            [
              "Blockout (Seedance 2.5, MiniMax H3)",
              "Offline controllable video generation",
              "EdenLive supports real-time generation and can be placed inside a live " +
                    "interaction loop",
            ],
            [
              "DLSS 5",
              "Upscaling and frame generation on top of an existing render pipeline",
              "EdenLive is a generative renderer: appearance can be altered wholesale, " +
                    "unconstrained by the original assets",
            ],
          ],
          // 不设 highlightRows：这张表讲的是定位差别，没有「我们那一行」可高亮
        },

      ],

      /* 还没有 arXiv 预印本，所以用 @misc + url（指向本项目页）而不是 @article。
       * 等论文挂到 arXiv 之后换成 @article 并补 journal={arXiv preprint arXiv:XXXX.XXXXX}。
       * 十位作者全列出来，不用 "and others"。每个名字必须是 "Last, First" ——
       * 逗号不能省：没有逗号 BibTeX 会把 "Huang Zehuan" 读成名=Huang 姓=Zehuan，
       * 参考文献里渲染成反的。 */
      bibtex:
        "@misc{huang2026edenlive,\n" +
        "  title={EdenLive: Real-Time Generative Rendering from Any Visual Reference},\n" +
        "  author={Huang, Zehuan and Xu, Tian-Xing and Peng, Chunli and " +
        "Zhang, Cheng and Zheng, Zeyi and Song, Yifei and Gu, Zekai and " +
        "Yu, Zhipeng and Wang, Peng and Cao, Yan-Pei},\n" +
        "  year={2026},\n" +
        // TODO: 换成正式的项目页地址（仓库里没写死主站域名，canonical 是运行时
        // 按 location.origin 生成的；素材域名 assets.vast-eden.ai 不是主站）
        "  url={https://github.com/VAST-AI-Research/EdenLive}\n" +
        "}",
    },
  ],

  /* ---------------------------------------------------------------- 论文 */
  /* Research 栏目。有 venue / authors[] / affiliations[] / bibtex 这些论文字段。
   * sections 是有序数组，type 决定渲染方式，目前支持：
   *   text | figure | gallery | video | compare | table | features | steps  */
  papers: [
    {
    id: 'optd',
    thumb: 'assets/research/optd.jpg',
    title: 'On-Policy Trajectory Distillation for *Few-Step Generative Modeling*',
    titleBreakAfter: 'On-Policy Trajectory Distillation for', short: 'OPTD',
    subtitle: 'Matching the frozen teacher endpoint over the same interval from a state visited by the student.',
    date: '2026', keywords: ['few-step diffusion distillation', 'on-policy learning', 'image generation', 'video generation'],
    authors: [
      { name: 'Haoran Feng', affil: [1] }, { name: 'Yuzhen Wang', affil: [2] },
      { name: 'Yifan Niu', affil: [2] }, { name: 'Yang-Tian Sun', affil: [3] },
      { name: 'Lu Sheng', affil: [2], breakBefore: true }, { name: 'Yan-Pei Cao', affil: [4], note: '*' },
      { name: 'Zehuan Huang', affil: [4], note: '*†' },
    ],
    affiliations: ['Tsinghua University', 'Beihang University', 'The University of Hong Kong', 'VAST'],
    authorNotes: '* Corresponding author　† Project lead', links: [],
    teaser: {
      src: OPTD_ASSET + 'teaser-cropped.png',
      alt: 'OPTD overview across image, bidirectional video, and causal video generation',
      caption: 'OPTD applies a common endpoint contract to image, bidirectional video, and causal video generation.',
    },
    mediaPreview: true,
    abstract: 'Few-step diffusion models replace a long teacher trajectory with a small number of student updates, but a mismatch between training queries and deployed states can accumulate through later steps. OPTD starts from a state visited by the current student, integrates the frozen teacher across the same interval, and uses the terminal state as the only paired target. The query therefore follows the trajectory the student will actually execute while the supervision remains directly paired with the teacher. We further introduce boundary-matched adversarial refinement for local realism at the same condition and noise boundary, together with an optional perceptual loss in frozen visual features. The same endpoint construction applies to image, bidirectional video, and causal video generation.',
    sections: [
      {
        type: 'figure', id: 'method', eyebrow: 'Core method', title: 'One interval, one paired endpoint',
        mediaPreview: true,
        body: '<p>The student first rolls out without gradients to a boundary <code>zᵢ</code>, then takes one coarse update. Starting from the same <code>zᵢ</code>, the frozen teacher takes <code>Kᵢ</code> fine updates across the complete next student interval. The loss compares only the two endpoints. The rollout prefix and teacher trajectory are detached.</p>',
        src: OPTD_ASSET + 'method-cropped.png', alt: 'OPTD endpoint distillation with boundary-matched adversarial refinement and perceptual loss',
        caption: '<strong>Endpoint contract.</strong> The student matches the frozen teacher endpoint over the same interval. The adversarial and perceptual branches act on that same student endpoint.',
      },
      {
        type: 'features', id: 'contributions', eyebrow: 'Contributions', title: 'A unified objective for on-policy few-step distillation',
        items: [
          { icon: 'check', title: 'On-policy endpoint regression', body: 'Queries are sampled from the current student rollout, directly addressing the train–test state mismatch in few-step sampling.' },
          { icon: 'spark', title: 'Boundary-aligned supervision', body: 'The student transition is paired with the frozen teacher endpoint over the identical interval, retaining dense and target-specific supervision.' },
          { icon: 'bolt', title: 'Boundary-matched adversarial refinement', body: 'A conditional discriminator compares generated and real latents at the same next-boundary noise level to improve local distributional fidelity.' },
          { icon: 'video', title: 'Unified multimodal formulation', body: 'The endpoint construction extends to images, bidirectional video, and causal video with detached autoregressive context.' },
        ],
      },
      {
        type: 'carousel', id: 'image-more-results', eyebrow: 'Experiment Results', title: 'Image Generation',
        kind: 'image-grid', mediaPreview: true, perPage: 10, items: OPTD_IMAGE_ITEMS,
      },
      {
        type: 'carousel', id: 'video-more-results', eyebrow: 'Experiment Results', title: 'Bidirectional Video Generation',
        kind: 'video-grid', controls: true, mediaPreview: true, perPage: 4, items: OPTD_VIDEO_ITEMS,
      },
      {
        type: 'carousel', id: 'causal-video-generation', eyebrow: 'Experiment Results', title: 'Causal Video Generation',
        kind: 'video-grid', controls: true, mediaPreview: true, perPage: 4, items: OPTD_CAUSAL_VIDEO_ITEMS,
      },
      {
        type: 'group', id: 'image-generation', eyebrow: 'Comparison Results', title: 'Image Comparison',
        items: [
          {
            type: 'figure', id: 'image-qualitative', eyebrow: 'Qualitative Results',
            mediaPreview: true,
            title: 'Qualitative Image Comparison',
            body: '<p>At four steps, OPTD preserves the requested content, coherent composition, and local detail across the shown prompts. Compared with the other distilled models, its outputs show fewer severe crops, missing objects, and texture artifacts.</p>',
            src: OPTD_ASSET + 'image-comparison-cropped.png',
            alt: 'Image comparison among FLUX.2, TDM, DMD2, rCM, and OPTD',
            caption: 'OPTD preserves semantics and local detail with four sampling steps.',
          },
          {
            type: 'table', id: 'image-quantitative', eyebrow: 'Quantitative Results',
            title: 'Quantitative Image Comparison',
            body: '<p>NFE denotes the number of function evaluations. Lower FID and higher values for the other metrics are better.</p>',
            columns: ['Method', 'NFE', 'FID ↓', 'CLIP ↑', 'ImageReward ↑', 'LPIPS ↑', 'GenEval ↑'],
            rows: [
              ['Pretrained Models', '', '', '', '', '', ''],
              ['SD3.5-M', '50', '20.83', '0.3423', '1.0137', '0.7292', '0.700'],
              ['SD3.5-L', '50', '19.99', '0.3388', '1.0722', '0.7233', '0.710'],
              ['FLUX.2-klein-base-4B', '50', '21.03', '0.3369', '0.9492', '0.7436', '0.760'],
              ['Released Distilled Models', '', '', '', '', '', ''],
              ['SD3.5-L-Turbo', '4', '26.26', '0.3399', '0.9524', '0.6745', '0.700'],
              ['FLUX.2-klein-4B', '4', '22.44', '0.3427', '1.1096', '0.6860', '0.820'],
              ['Distillation Methods', '', '', '', '', '', ''],
              ['LCM', '4', '32.51', '0.3261', '0.4669', '0.6709', '0.680'],
              ['DMD2', '4', '18.91', '0.3322', '0.7767', '0.6940', '0.690'],
              ['PFM', '4', '49.09', '0.2771', '0.4676', '0.4322', '0.370'],
              ['TDM', '4', '31.31', '0.3292', '0.7706', '0.6754', '0.740'],
              ['rCM', '4', '32.52', '0.3160', '0.6005', '0.7261', '0.589'],
              ['OPTD', '4', '21.95', '0.3363', '0.8349', '0.7152', '0.745'],
              ['OPTD + Perceptual', '4', '23.62', '0.3420', '1.0093', '0.6913', '0.750'],
              ['OPTD + GAN', '4', '15.06', '0.3360', '0.7221', '0.7053', '0.780'],
              ['OPTD + GAN + Perceptual', '4', '19.23', '0.3369', '0.8651', '0.6982', '0.791'],
              ['OPTD (4 → 2)', '2', '16.86', '0.3361', '0.6257', '0.6952', '0.756'],
              ['OPTD (2 → 1)', '1', '16.82', '0.3356', '0.5922', '0.6984', '0.749'],
            ],
            groupRows: [0, 4, 7],
            cellStyles: {
              3: { 5: ['cell-best'] },
              6: { 3: ['cell-best'], 4: ['cell-best'], 6: ['cell-best'] },
              12: { 5: ['cell-red'] },
              13: { 5: ['cell-orange'] },
              14: { 3: ['cell-red'], 4: ['cell-red'] },
              15: { 2: ['cell-red', 'cell-best'], 6: ['cell-orange'] },
              16: { 3: ['cell-orange'], 4: ['cell-orange'], 6: ['cell-red'] },
              17: { 2: ['cell-best'] },
              18: { 2: ['cell-orange'] },
            },
            footnote: 'Red and orange cells mark the best and second-best values among the Distillation Methods. Black bold marks the best remaining value in each full column, following the paper table.',
          },
          {
            type: 'text', id: 'image-analysis', separate: false,
            body: '<p>At four steps, base OPTD surpasses all non-OPTD baselines in the Distillation Methods group on CLIP, ImageReward, and GenEval while retaining competitive diversity. OPTD + GAN achieves the lowest FID in the full table (15.06), whereas OPTD + Perceptual leads the method group in CLIP and ImageReward. Combining both refinements yields the group’s highest GenEval score (0.791), with strong counting and positioning performance. One- and two-step OPTD also outperform four-step DMD2 in FID and GenEval with comparable diversity, at the cost of lower ImageReward.</p>',
          },
        ],
      },
      {
        type: 'group', id: 'video-generation', eyebrow: 'Comparison Results', title: 'Bidirectional Video Comparison',
        items: [
          {
            type: 'figure', id: 'video-qualitative', eyebrow: 'Qualitative Results', title: 'Qualitative Bidirectional Video Comparison',
            mediaPreview: true,
            body: '<p>The comparison uses four-step Wan2.1-T2V-1.3B models at 832 × 480 resolution over 81 frames. Compared with the oversaturated, mode-seeking appearance of DMD2 in these examples, OPTD preserves more natural colors and textures with smoother temporal evolution.</p>',
            src: OPTD_ASSET + 'bid_video_comparion.png',
            alt: 'Bidirectional video comparison among Wan, DMD2, AnyFlow, rCM, and OPTD',
            caption: 'OPTD maintains stable appearance and coherent temporal changes across the sampled frames.',
          },
          {
            type: 'table', id: 'video-quantitative', eyebrow: 'Quantitative Results', title: 'Quantitative Bidirectional Video Comparison',
            body: '<p>Total is VBench’s weighted score and Mean is the unweighted mean over its 16 dimensions.</p>',
            columns: ['Method', 'Steps', 'Resolution', 'Frames', 'Total ↑', 'Quality ↑', 'Semantic ↑', 'Mean ↑'],
            rows: [
              ['Pretrained Models', '', '', '', '', '', '', ''],
              ['Wan2.1-T2V-1.3B', '50', '832 × 480', '81', '75.31', '79.57', '58.27', '0.5844'],
              ['Released Distilled Models', '', '', '', '', '', '', ''],
              ['FastWan2.1-T2V-1.3B', '3', '832 × 480', '81', '80.76', '84.34', '66.47', '0.6501'],
              ['T2V-Turbo-v2', '16', '512 × 320', '16', '85.54', '85.70', '84.92', '0.7382'],
              ['AnyFlow', '4', '832 × 480', '81', '83.82', '85.21', '78.24', '0.7036'],
              ['Distillation Methods', '', '', '', '', '', '', ''],
              ['DMD2', '4', '832 × 480', '81', '81.15', '84.15', '69.15', '0.6804'],
              ['rCM', '4', '832 × 480', '81', '79.09', '82.38', '65.95', '0.6386'],
              ['OPTD', '4', '832 × 480', '81', '72.82', '77.46', '54.23', '0.5574'],
              ['OPTD + Perceptual', '4', '832 × 480', '81', '74.76', '79.09', '57.43', '0.5803'],
              ['OPTD + GAN', '4', '832 × 480', '81', '82.64', '85.44', '71.45', '0.6837'],
            ],
            groupRows: [0, 2, 6],
            cellStyles: {
              4: { 4: ['cell-best'], 5: ['cell-best'], 6: ['cell-best'], 7: ['cell-best'] },
              11: { 4: ['cell-red'], 5: ['cell-red'], 6: ['cell-red'], 7: ['cell-red'] },
            },
            footnote: 'Red cells mark the best values among the Distillation Methods. Black bold marks the best value in each full column, following the paper table.',
          },
          {
            type: 'text', id: 'video-analysis', separate: false,
            body: '<p>At four steps, OPTD + GAN leads the Distillation Methods group across all four VBench summary metrics. Total and Semantic scores improve by 13.5% and 31.8% over base OPTD. Its Quality score also slightly exceeds AnyFlow’s (85.44 vs. 85.21), while AnyFlow retains stronger semantic alignment. The detailed VBench results show gains over base OPTD in motion, appearance, and human action, supporting boundary-matched adversarial refinement as a complement to paired endpoint supervision.</p>',
          },
        ],
      },
    ],
    bibtex: `@article{feng2026optd,
  title={On-Policy Trajectory Distillation for Few-Step Generative Modeling},
  author={Feng, Haoran and Wang, Yuzhen and Niu, Yifan and Sun, Yang-Tian and Sheng, Lu and Cao, Yan-Pei and Huang, Zehuan},
  year={2026}
}`,
    },
    {
      id: "multilive",
      title: "MultiLive: On-Policy Distillation of Video and Multi-View Priors for *Multi-View Video Generation*",
      /* 中文标题短、本来就一行，显式写空串。写整句的话 heroTitleHTML()
       * 要求前缀后面跟一个空格才断行，整句匹配不上、结果也是不断行，
       * 但那是靠巧合。
       * 英文断在 "Priors" 后面：高亮词在第二行，第一行不会只剩半句强调。 */
      titleBreakAfter: "MultiLive: On-Policy Distillation of Video and Multi-View Priors",
      short: "MultiLive",
      subtitle: "On-policy dual-teacher distillation combines temporal dynamics from video priors with geometric consistency from multi-view priors in one generator.",
      date: "2026-10",
      thumb: "assets/research/multilive.jpg",
      keywords: [
        "multi-view video",
        "dual-teacher distillation",
        "world model",
        "4-step generation",
      ],

      authors: [
        { name: "Yifan Niu", affil: [1, 2], note: "*", bold: true },
        { name: "Yang-Tian Sun", affil: [1, 3], note: "*,†", bold: true },
        { name: "Haoran Feng", affil: [1, 4] },
        { name: "Lu Sheng", affil: [2] },
        { name: "Yan-Pei Cao", affil: [1], note: "✉", bold: true, breakBefore: true },
        { name: "Zehuan Huang", affil: [1], note: "✉,†", bold: true },
      ],
      affiliations: ["VAST", "BUAA", "HKU", "THU"],
      authorNotes: "* Equal contribution　✉ Corresponding authors　† Project leads",

      links: [
        { label: "PDF", href: ML + "paper.pdf", icon: "paper" },
        { label: "Code", href: "https://github.com/VAST-AI-Research/MultiLive", icon: "github" },
      ],

      // 宣传片用原片、不转码
      teaser: {
        src: ML + "teaser.mp4",
        poster: ML + "teaser.jpg",
        autoplay: false,
        loop: false,
        caption: "MultiLive jointly generates synchronized multi-view videos from text and camera conditions: a video teacher guides temporal dynamics while a multi-view teacher guides geometry and appearance.",
      },

      highlights: [
        { value: "4 views", label: "synchronized views" },
        { value: "4 steps", label: "denoising steps" },
        { value: "No MV video", label: "training data" },
      ],

      abstract: "Multi-view video generation must satisfy cross-view geometric consistency and coherent temporal dynamics, yet synchronized multi-view video data are scarce. MultiLive introduces an on-policy dual-teacher distribution-matching framework: a video teacher constrains motion and temporal dynamics within each view, while a multi-view teacher constrains geometry and appearance across views at each time step. Both objectives operate on the same student-generated multi-view video and distill complementary priors into one camera-aware generator through a shared fake-score model. The result requires no explicit 3D reconstruction or synchronized multi-view video training data, and jointly generates four synchronized views in four denoising steps at inference.",

      sections: [
        {
          type: "figure",
          id: "pipeline",
          title: "Dual-Teacher Distillation",
          body: "<p>The student first generates a complete time-by-view latent grid on-policy. The same sample is read in two ways: per-view temporal trajectories go to the video teacher, while synchronized multi-view slices go to the multi-view teacher. Their distribution-matching gradients update the same generator.</p>",
          src: ML + "pipeline.webp",
          alt: "MultiLive dual-teacher distillation pipeline",
          caption: "One student rollout receives temporal and multi-view supervision simultaneously.",
        },
        {
          type: "figure",
          id: "architecture",
          title: "Model Architecture",
          src: ML + "architecture.jpg",
          alt: "MultiLive model architecture",
          caption: "A camera-aware generator operates on a shared multi-view latent grid, with complementary score supervision from the two teacher branches.",
        },
        {
          type: "figure",
          id: "comparison",
          title: "Qualitative Comparison",
          body: "<p>MultiLive produces cross-view consistent dynamic scenes across diverse content and styles while maintaining coherent motion within each video.</p>",
          src: ML + "comparison.webp",
          alt: "Qualitative comparison with other methods",
        },
        {
          type: "carousel",
          id: "mv-results",
          ratio: "832 / 480",   // 动图的宽高比，图到之前骨架按它占位
          title: "More Results",
          perPage: 1,
          items: [
            { src: ML + "results/lunar-astronaut.avif" },
            { src: ML + "results/eiffel-night.avif" },
            { src: ML + "results/mountain-road.avif" },
            { src: ML + "results/sunset-seaside.avif" },
            { src: ML + "results/flower-meadow.avif" },
            { src: ML + "results/blue-ufo.avif" },
            { src: ML + "results/red-macaw.avif" },
            { src: ML + "results/beach-run.avif" },
          ],
        },
        {
          type: "carousel",
          id: "demos",
          ratio: "1696 / 528",   // 动图的宽高比，图到之前骨架按它占位
          title: "World Model Demos",
          body: "<p>Each clip shows a world-model scene with synchronized views; the action prompts at the bottom visualize interactive control. Use the video controls to pause, scrub, or enter fullscreen.</p>",
          perPage: 1,
          items: [
            { src: ML + "wm-horse.avif", caption: "Horse ride through a valley" },
            { src: ML + "wm-desert.avif", caption: "Desert planet" },
            { src: ML + "wm-forest.avif", caption: "Forest swing" },
            { src: ML + "wm-ocean.avif", caption: "Swimming in the ocean" },
          ],
        },
      ],
    },

    {
      id: "mira-scene",
      title: "Mira-Scene: *Pixel-Aligned Layouts* for Generative 3D Scene Reconstruction",
      /* 详情页大标题在这个前缀之后强制换行，切成两行（不给的话英文标题会挤成三行）。
       * 必须是 title 的**原样前缀**、连星号一起写，对不上就整句不断行。
       * 中文标题短、本来就一行，显式写空串：不写 zh 的话 t() 会回落到英文那串，
       * 虽然正好匹配不上、结果也对，但那是靠巧合，改标题时容易出意外。 */
      titleBreakAfter: "Mira-Scene: *Pixel-Aligned Layouts*",
      short: "Mira-Scene",
      subtitle: "Recovering dense canonical-to-scene correspondences for coherent, " +
            "compositional 3D scene reconstruction from a single image.",
      date: "2026-09",
      thumb: "assets/research/mira-scene.jpg",
      keywords: [
        "3D scene reconstruction",
        "canonical coordinate map",
        "generative 3D",
        "layout",
      ],

      // bold: true = 重点作者（共一 / 项目负责人 / 通讯），渲染成加粗
      authors: [
        { name: "Yang-Tian Sun", url: "https://sunyangtian.github.io/", affil: [1], note: "*", bold: true },
        { name: "Tianjia Liu", affil: [1], note: "*", bold: true },
        { name: "Zehuan Huang", url: "https://huanngzh.github.io/", affil: [2], note: "†", bold: true },
        { name: "Yi-Hua Huang", affil: [1] },
        { name: "Xiaoyang Lyu", affil: [1] },
        { name: "Ziyi Yang", affil: [1] },
        { name: "Zi-Xin Zou", affil: [2] },
        { name: "Yuan-Chen Guo", affil: [2] },
        { name: "Yan-Pei Cao", url: "https://yanpei.me/", affil: [2], note: "✉", bold: true },
        { name: "Xiaojuan Qi", url: "https://xjqi.github.io/", affil: [1], note: "✉", bold: true },
      ],
      affiliations: [
        "The University of Hong Kong",
        "VAST",
      ],
      authorNotes: "* Equal Contribution　† Project Lead　✉ Corresponding Authors",

      links: [
        // 论文放第一个，和 StereoWorld 那条一致（学术页惯例是先给论文）
        { label: "arXiv", href: "https://arxiv.org/pdf/2609.23796", icon: "arxiv" },
        { label: "Code",
          href: "https://github.com/VAST-AI-Research/Mira-Scene", icon: "github" },
        { label: "Checkpoint",
          href: "https://huggingface.co/Yang-Tian/Mira-Scene", icon: "hf" },
        { label: "Dataset",
          href: "https://huggingface.co/datasets/Yang-Tian/Mira-Scene-Dataset", icon: "data" },
      ],

      teaser: {
        src: MS + "videos/demo.mp4",
        poster: MS + "images/teaser.webp",
        caption: "Mira-Scene reconstructs a coherent 3D scene by jointly predicting object " +
              "geometry and pixel-aligned canonical correspondences.",
      },

      abstract: "Single-image 3D object generation can now produce high-fidelity assets, yet " +
            "accurately placing them into a coherent scene layout remains an open challenge. " +
            "A central difficulty lies in how object layout is represented. Holistic methods " +
            "absorb placement into a scene-level generation process, sacrificing object-level " +
            "detail. Compositional methods preserve object fidelity by decoupling geometry from " +
            "layout, but typically parameterize layout as sparse, unbounded pose variables that " +
            "are difficult to learn and generalize poorly under scarce scene-level supervision. " +
            "We present <strong>Mira-Scene</strong>, a compositional 3D scene reconstruction " +
            "framework that replaces sparse pose regression with dense, bounded correspondence " +
            "recovery. At its core is the <strong>Canonical Coordinate Map (CCM)</strong>, a " +
            "pixel-aligned field that maps each visible object pixel to a surface coordinate in " +
            "the object's bounded canonical space. When paired with a scene-space " +
            "<strong>Point Cloud Map (PCM)</strong> from monocular geometry estimation, CCM " +
            "induces dense canonical-to-scene correspondences from which object transformations " +
            "are recovered through robust geometric alignment. Because CCM operates in bounded " +
            "canonical space, it provides a stable prediction target that can be trained from " +
            "scalable object-level 3D data without requiring scene-level layout annotations. " +
            "Mira-Scene further introduces a multimodal diffusion transformer that jointly " +
            "generates object geometry and CCMs, using modality-specific expert streams with " +
            "shared attention and positional encoding to promote geometry-layout consistency. " +
            "Experiments on indoor, outdoor, synthetic, and in-the-wild scenes show that " +
            "Mira-Scene substantially outperforms strong baselines in layout accuracy, achieving " +
            "relative gains of 39.8% in 3D-IoU and 16.5% in 2D-IoU over SAM3D, using limited " +
            "open-source training data.",

      sections: [
        {
          type: "figure",
          id: "motivation",
          title: "Why Pixel-Aligned Layouts?",
          body: "<p>Scene layout is difficult to learn from sparse, unbounded pose variables. " +
                "Mira-Scene instead predicts a <strong>Canonical Coordinate Map (CCM)</strong>: " +
                "every visible object pixel maps to a bounded coordinate on the object's " +
                "canonical surface. Combining CCM with monocular scene-space geometry produces " +
                "dense correspondences for robust object-to-scene alignment.</p>",
          src: MS + "images/layout_representation.webp",
          // 这张是示意图，铺满 1180px 会放糊，跟原项目页一样限到 35rem
          figureClass: "figure--compact",
          alt: "Comparison of scene layout representations",
          caption: "<strong>From sparse poses to dense correspondences.</strong> CCM provides a " +
                "bounded, pixel-aligned layout representation that can be supervised with " +
                "scalable object-level 3D data.",
        },
        {
          type: "figure",
          id: "pipeline",
          ratio: "1280 / 530",   // 动图的宽高比，图到之前骨架按它占位
          title: "Mira-Scene Pipeline",
          src: MS + "images/pipeline.avif",
          alt: "Mira-Scene pipeline",
          caption: "<strong>Mira-Scene.</strong> A multimodal diffusion transformer jointly predicts " +
                "object geometry and CCMs. Geometric alignment between canonical coordinates and " +
                "a scene-space point cloud recovers coherent object transformations.",
        },
        {
          /* 12 个可旋转的重建场景。默认只显示预览图，点「载入 3D 场景」才
           * 动态 import three.js 并抓 GLB（单个 10~44MB）。前 4 个案例另有
           * CCM 分步工作流，走 workflow 字段链到 pages/ccm-workflow/。 */
          type: "sceneViewer",
          id: "scene-results",
          title: "Scene Reconstruction Results",
          body: "<p>Twelve reconstructed scenes. Load any of them to orbit, zoom, and " +
                "rotate the environment panorama. The first four cases also expose " +
                "intermediate results such as CCM \u2014 follow \u201cView CCM workflow\u201d " +
                "on those cards for the step-by-step process.</p>",
          columns: 3,
          items: [
            {
              id: "012_hotel_lobby",
              model: MS3 + "viewers/scenes/012_hotel_lobby/scene.glb",
              environment: MS3 + "viewers/scenes/012_hotel_lobby/environment.webp",
              poster: MS + "scenes/012_hotel_lobby.webp",
              workflow: "pages/ccm-workflow/?case=012_hotel_lobby",
            },
            {
              id: "Gemini_Generated_Image_sjbz27sjbz27sjbz",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_sjbz27sjbz27sjbz/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_sjbz27sjbz27sjbz/environment.webp",
              poster: MS + "scenes/Gemini_Generated_Image_sjbz27sjbz27sjbz.webp",
              workflow: "pages/ccm-workflow/?case=Gemini_Generated_Image_sjbz27sjbz27sjbz",
            },
            {
              id: "003_home_office",
              model: MS3 + "viewers/scenes/003_home_office/scene.glb",
              environment: MS3 + "viewers/scenes/003_home_office/environment.webp",
              poster: MS + "scenes/003_home_office.webp",
              workflow: "pages/ccm-workflow/?case=003_home_office",
            },
            {
              id: "Gemini_Generated_Image_dfwzixdfwzixdfwz",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_dfwzixdfwzixdfwz/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_dfwzixdfwzixdfwz/environment.webp",
              poster: MS + "scenes/Gemini_Generated_Image_dfwzixdfwzixdfwz.webp",
              workflow: "pages/ccm-workflow/?case=Gemini_Generated_Image_dfwzixdfwzixdfwz",
            },
            {
              id: "Gemini_Generated_Image_8rhdjt8rhdjt8rhd",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_8rhdjt8rhdjt8rhd/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_8rhdjt8rhdjt8rhd/environment.webp",
              poster: MS + "scenes/Gemini_Generated_Image_8rhdjt8rhdjt8rhd.webp",
            },
            {
              id: "Gemini_Generated_Image_dh6x0wdh6x0wdh6x",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/environment.webp",
              poster: MS + "scenes/Gemini_Generated_Image_dh6x0wdh6x0wdh6x.webp",
            },
            {
              id: "scene05",
              model: MS3 + "viewers/scenes/scene05/scene.glb",
              environment: MS3 + "viewers/scenes/scene05/environment.webp",
              poster: MS + "scenes/scene05.webp",
            },
            {
              id: "idea_table",
              model: MS3 + "viewers/scenes/idea_table/scene.glb",
              environment: MS3 + "viewers/scenes/idea_table/environment.webp",
              poster: MS + "scenes/idea_table.webp",
            },
            {
              id: "designer-bedroom",
              model: MS3 + "viewers/scenes/designer-bedroom/scene.glb",
              environment: MS3 + "viewers/scenes/designer-bedroom/environment.webp",
              poster: MS + "scenes/designer-bedroom.webp",
            },
            {
              id: "green-room_local_furniture_hq_v1",
              model: MS3 + "viewers/scenes/green-room_local_furniture_hq_v1/scene.glb",
              environment: MS3 + "viewers/scenes/green-room_local_furniture_hq_v1/environment.webp",
              poster: MS + "scenes/green-room_local_furniture_hq_v1.webp",
            },
            {
              id: "italian-style-still-life",
              model: MS3 + "viewers/scenes/italian-style-still-life/scene.glb",
              environment: MS3 + "viewers/scenes/italian-style-still-life/environment.webp",
              poster: MS + "scenes/italian-style-still-life.webp",
            },
            {
              id: "the-white-room-cycles_countrylike_v12_bookshelf_full",
              model: MS3 + "viewers/scenes/the-white-room-cycles_countrylike_v12_bookshelf_full/scene.glb",
              environment: MS3 + "viewers/scenes/the-white-room-cycles_countrylike_v12_bookshelf_full/environment.webp",
              poster: MS + "scenes/the-white-room-cycles_countrylike_v12_bookshelf_full.webp",
            },
          ],
        },
        {
          /* 并排双查看器：同一个案例，左边 GPT-6 Astra 从零搭建、右边 Mira-Scene
           * 重建。每个案例要拉两个 GLB（合计最大 80MB+），所以一次只挂一组，
           * 案例之间用上方按钮切换，切走时把上一组彻底 dispose。 */
          type: "compareViewer",
          id: "astra-results",
          /* 相机元数据表（18KB，本地）。Reset view 要靠它回到「和参考图对齐的
           * 视角」—— 每个 GLB 的 model_info.cameras 里有一项 default:true，
           * 就是原作者渲参考图用的那个机位。不给这张表的话 defaultCamera 会
           * 退化成 overview（斜上方俯视），Reset view 就对不上参考图了。
           * 提取自原站 data/scene-astra/manifest.json，只留 cameras 和
           * export_mesh_objects 两个查看器真正用到的字段。 */
          cameras: "data/astra-cameras.json",
          title: "Compared to GPT-6 Astra From Scratch",
          body: "<p>Pick a case from the thumbnails above. The two viewers below show the " +
                "scene built from scratch by GPT-6 Astra (left) against a Mira-Scene " +
                "reconstruction with the background built by Astra (right); Mira-Scene " +
                "stays more consistent with the input image. " +
                "Each side has its own camera menu, section slider, wireframe toggle, and " +
                "fullscreen. <em>Reset view</em> returns to the reference framing that " +
                "matches the thumbnail; click into a view and use W/A/S/D to roam.</p>",
          cases: [
            {
              label: "Case 1",
              id: "Gemini_Generated_Image_gkkzzjgkkzzjgkkz",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_gkkzzjgkkzzjgkkz/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_gkkzzjgkkzzjgkkz/with_mira_scene.glb",
              poster: MS + "astra/01-Gemini_Generated_Image_gkkzzjgkkzzjgkkz.webp",
            },
            {
              label: "Case 2",
              id: "012_hotel_lobby",
              left:  MS3 + "viewers/astra/012_hotel_lobby/from_scratch.glb",
              right: MS3 + "viewers/astra/012_hotel_lobby/with_mira_scene.glb",
              poster: MS + "astra/02-012_hotel_lobby.webp",
            },
            {
              label: "Case 3",
              id: "Gemini_Generated_Image_dfwzixdfwzixdfwz",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_dfwzixdfwzixdfwz/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_dfwzixdfwzixdfwz/with_mira_scene.glb",
              poster: MS + "astra/03-Gemini_Generated_Image_dfwzixdfwzixdfwz.webp",
            },
            {
              label: "Case 4",
              id: "Gemini_Generated_Image_dh6x0wdh6x0wdh6x",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/with_mira_scene.glb",
              poster: MS + "astra/04-Gemini_Generated_Image_dh6x0wdh6x0wdh6x.webp",
            },
            {
              label: "Case 5",
              id: "002_bedroom_suite",
              left:  MS3 + "viewers/astra/002_bedroom_suite/from_scratch.glb",
              right: MS3 + "viewers/astra/002_bedroom_suite/with_mira_scene.glb",
              poster: MS + "astra/05-002_bedroom_suite.webp",
            },
            {
              label: "Case 6",
              id: "Gemini_Generated_Image_ac4a5mac4a5mac4a",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_ac4a5mac4a5mac4a/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_ac4a5mac4a5mac4a/with_mira_scene.glb",
              poster: MS + "astra/06-Gemini_Generated_Image_ac4a5mac4a5mac4a.webp",
            },
          ],
        },
        {
          type: "carousel",
          id: "simulation-blender",
          ratio: "1920 / 1080",   // 动图的宽高比，图到之前骨架按它占位
          title: "Blender Simulation",
          body: "<p>Mira-Scene scenes can be imported into simulation engines for downstream " +
                "interactive tasks.</p>",
          perPage: 1,
          items: [
            { src: MS + "simulation/blender/sim1.avif",
              caption: "<strong>Gravity.</strong> Gravity influences the reconstructed " +
                             "scene and its objects." },
            { src: MS + "simulation/blender/sim2.avif",
              caption: "<strong>Scene Editing.</strong> Objects can be reorganized into a " +
                             "new layout." },
            { src: MS + "simulation/blender/sim3.avif",
              caption: "<strong>Pick and Place.</strong> A pick-and-place task manipulates " +
                             "objects in the reconstructed scene." },
            { src: MS + "simulation/blender/sim4.avif",
              caption: "<strong>Collision.</strong> Collision interactions are simulated " +
                             "between objects and the scene." },
          ],
        },
        {
          type: "carousel",
          id: "simulation-isaac",
          ratio: "1920 / 1080",   // 动图的宽高比，图到之前骨架按它占位
          title: "Isaac Simulation",
          body: "<p>All action policies are generated by GPT-6 Astra.</p>",
          perPage: 1,
          items: [
            { src: MS + "simulation/isaac/interaction1.avif",
              caption: "<strong>Chair Alignment.</strong> The robot straightens a tilted " +
                             "chair and aligns it parallel to the table." },
            { src: MS + "simulation/isaac/interaction2.avif",
              caption: "<strong>Chair Pull-Out.</strong> The robot pulls a dining chair away " +
                             "from the table to make it accessible for sitting." },
            { src: MS + "simulation/isaac/interaction3.avif",
              caption: "<strong>Side-Table Stacking.</strong> The robot organizes unused " +
                             "furniture by stacking a side table on top of an ottoman." },
          ],
        },
      ],

      bibtex:
        "@article{sun2026mira,\n" +
        "  title={Mira-Scene: Pixel-Aligned Layouts for Generative 3D Scene Reconstruction},\n" +
        // 十位作者全列出来，不用 "and others"。
        // 每个名字必须是 "Last, First" —— 逗号不能省：没有逗号 BibTeX 会把
        // "Sun Yang-Tian" 读成名=Sun 姓=Yang-Tian，参考文献里渲染成反的。
        "  author={Sun, Yang-Tian and Liu, Tianjia and Huang, Zehuan and " +
        "Huang, Yi-Hua and Lyu, Xiaoyang and Yang, Ziyi and Zou, Zi-Xin and " +
        "Guo, Yuan-Chen and Cao, Yan-Pei and Qi, Xiaojuan},\n" +
        "  journal={arXiv preprint arXiv:2609.23796},\n" +
        "  year={2026}\n" +
        "}",
    },

    {
      id: "stereo-world",
      title: "Stereo World Model: Camera-Guided *Stereo Video Generation*",
      short: "StereoWorld",
      subtitle: "Explore the world in stereo with StereoWorld, a model that generates " +
            "view-consistent stereo videos with camera controls.",
      venue: "CVPR 2026",
      date: "2026-06",
      thumb: "assets/research/stereo-world.jpg",
      keywords: ["stereo video", "world model", "camera control", "video generation"],

      // bold: true = 重点作者（一作 / 项目负责人 / 通讯），渲染成加粗
      authors: [
        { name: "Yang-Tian Sun", url: "https://sunyangtian.github.io/", affil: [1], bold: true },
        { name: "Zehuan Huang", url: "https://huanngzh.github.io/", affil: [2], note: "†", bold: true },
        { name: "Yifan Niu", url: "https://openreview.net/profile?id=~Yifan_Niu3", affil: [2] },
        { name: "Lin Ma", url: "https://marlinilram.github.io/", affil: [3] },
        { name: "Yan-Pei Cao", url: "https://yanpei.me/", affil: [2] },
        { name: "Yuewen Ma", url: "https://openreview.net/profile?id=~Yuewen_Ma1", affil: [3] },
        { name: "Xiaojuan Qi", url: "https://xjqi.github.io/", affil: [1], note: "✉", bold: true },
      ],
      affiliations: [
        "The University of Hong Kong",
        "VAST",
        "ByteDance Pico",
      ],
      authorNotes: "† Project Lead　✉ Corresponding Author",

      links: [
        { label: "arXiv", href: "https://arxiv.org/abs/2603.17375", icon: "arxiv" },
        { label: "Code",
          href: "https://github.com/VAST-AI-Research/StereoWorld", icon: "github" },
        { label: "Model",
          href: "https://huggingface.co/Yang-Tian/StereoWorld", icon: "hf" },
      ],

      teaser: {
        src: SW + "videos/demo.mp4",
        poster: SW + "images/teaser.jpg",
        caption: "StereoWorld generates camera-guided stereo video from a single RGB image " +
              "with WASD-style camera controls.",
      },

      abstract: "We introduce StereoWorld, a stereo world model capable of exploration " +
            "from a given initial observation, generating view-consistent stereo videos with " +
            "intrinsic geometric understanding. The model supports WASD-style camera controls " +
            "for translation, yaw, and pitch, with both flexible stereo (independent left/right " +
            "camera control) and fixed-baseline stereo modes.",

      sections: [
        {
          type: "figure",
          id: "motivation",
          ratio: "1920 / 1080",   // 动图的宽高比，图到之前骨架按它占位
          title: "Motivation",
          body: "<ul>" +
                "<li><strong>Stereo vision</strong> — the dominant perceptual mechanism in many " +
                "biological systems — provides direct, robust geometric cues to 3D scene structure.</li>" +
                "<li>Compared to RGB-D systems, it avoids producing and stabilizing explicit " +
                "metric depth maps while retaining strong geometric signals.</li>" +
                "</ul>",
          src: SW + "videos/motivation.avif",
        },
        {
          type: "figure",
          id: "pipeline",
          title: "Pipeline",
          src: SW + "images/pipeline.jpg",
          caption: "<strong>Illustration of StereoWorld.</strong> Given a pair of stereo images and " +
                "a conditional camera trajectory, StereoWorld first encodes conditional and noisy " +
                "video latents from different viewpoints and timesteps using a unified " +
                "camera–frame RoPE representation. It then performs denoising through a DiT " +
                "equipped with stereo attention, ultimately producing the final stereo video.",
        },
        {
          type: "carousel",
          id: "stereo-video",
          ratio: "1664 / 480",   // 动图的宽高比，图到之前骨架按它占位
          title: "Fixed-Baseline Stereo",
          perPage: 2,
          items: [
            { src: SW + "stereo_video/varied_scene_004_lakeside_balcony_w_j_l_demo.avif" },
            { src: SW + "stereo_video/varied_scene_006_volcano_crater_dj_wk_demo.avif" },
            { src: SW + "stereo_video/varied_scene_011_underground_river_arch_w_wl_demo.avif" },
            { src: SW + "stereo_video/varied_scene_012_floating_islands_dj_wk_demo.avif" },
            { src: SW + "stereo_video/varied_scene_021_snowy_mountain_road_w_wk_demo.avif" },
            { src: SW + "stereo_video/varied_scene_022_minimal_gallery_w_j_l_demo.avif" },
            { src: SW + "stereo_video/varied_scene_028_rice_terraces_dj_wk_demo.avif" },
            { src: SW + "stereo_video/varied_scene_034_tea_house_window_w_j_l_demo.avif" },
            { src: SW + "stereo_video/varied_scene_037_northern_lights_cabin_w_wl_wj_demo.avif" },
            { src: SW + "stereo_video/varied_scene_044_music_studio_w_j_l_demo.avif" },
            { src: SW + "stereo_video/varied_scene_059_hospital_operating_room_w_j_l_demo.avif" },
            { src: SW + "stereo_video/varied_scene_067_old_europe_square_w_wl_wj_demo.avif" },
            { src: SW + "stereo_video/varied_scene_071_glacier_lagoon_w_wl_wj_demo.avif" },
            { src: SW + "stereo_video/varied_scene_073_children_playroom_w_j_l_demo.avif" },
            { src: SW + "stereo_video/varied_scene_074_coastal_tunnel_road_w_wk_demo.avif" },
          ],
        },
        {
          type: "carousel",
          id: "stereo-depth",
          ratio: "1920 / 480",   // 动图的宽高比，图到之前骨架按它占位
          title: "Stereo Depth",
          body: "<span style='white-space:nowrap'>Each video shows <strong>stereo video (left)" +
                "</strong> side-by-side with the corresponding <strong>depth estimation (right)" +
                "</strong>.</span>",
          perPage: 2,
          items: [
            { src: SW + "stereo_depth/stereo_video1_with_disp_vis1.avif" },
            { src: SW + "stereo_depth/stereo_video2_with_disp_vis2.avif" },
          ],
        },
        {
          type: "carousel",
          id: "flex-demo",
          ratio: "1664 / 480",   // 动图的宽高比，图到之前骨架按它占位
          title: "Flexible Stereo",
          body: "Flexible stereo mode supports independent left/right camera control with four " +
                "right-camera modes: converging, horizontal offset, depth offset, height offset.",
          perPage: 2,
          items: [
            { src: SW + "flex_demo/flex_converging_prompt_00117_demo.avif",
              caption: "Converging" },
            { src: SW + "flex_demo/flex_converging_prompt_01290_demo.avif",
              caption: "Converging" },
            { src: SW + "flex_demo/flex_converging_prompt_05539_demo.avif",
              caption: "Converging" },
            { src: SW + "flex_demo/flex_converging_prompt_09641_demo.avif",
              caption: "Converging" },
            { src: SW + "flex_demo/flex_depth_offset_prompt_03814_demo.avif",
              caption: "Depth Offset" },
            { src: SW + "flex_demo/flex_depth_offset_prompt_05313_demo.avif",
              caption: "Depth Offset" },
            { src: SW + "flex_demo/flex_depth_offset_prompt_02664_demo.avif",
              caption: "Depth Offset" },
            { src: SW + "flex_demo/flex_depth_offset_prompt_07517_demo.avif",
              caption: "Depth Offset" },
            { src: SW + "flex_demo/flex_height_offset_prompt_02504_demo.avif",
              caption: "Height Offset" },
            { src: SW + "flex_demo/flex_height_offset_prompt_02927_demo.avif",
              caption: "Height Offset" },
            { src: SW + "flex_demo/flex_height_offset_prompt_04808_demo.avif",
              caption: "Height Offset" },
            { src: SW + "flex_demo/flex_height_offset_prompt_08317_demo.avif",
              caption: "Height Offset" },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_03257_demo.avif",
              caption: "Horizontal Offset" },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_04506_demo.avif",
              caption: "Horizontal Offset" },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_06924_demo.avif",
              caption: "Horizontal Offset" },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_08785_demo.avif",
              caption: "Horizontal Offset" },
          ],
        },
        {
          type: "carousel",
          id: "ar-distillation",
          ratio: "1664 / 480",   // 动图的宽高比，图到之前骨架按它占位
          title: "Autoregressive Long Video Distillation",
          body: "A 4-step autoregressive student model trained via self-forcing distillation " +
                "generates extended sequences beyond the single-clip frame budget.",
          // 示意图单独走 figure 字段，不要写进 body 的 HTML 串里 ——
          // body 渲染进限宽 68ch 的盒子，图塞进去会被压窄并偏左。
          figure: {
            src: SW + "images/distillation.jpg",
            alt: "Attention mask in distillation",
            caption: "Attention mask configuration in the distillation process.",
            width: "30rem",
          },
          perPage: 2,
          items: [
            { src: SW + "ar_demo/custom_varied_021.avif" },
            { src: SW + "ar_demo/custom_varied_022.avif" },
            { src: SW + "ar_demo/custom_varied_059.avif" },
          ],
        },
        {
          type: "carousel",
          id: "inpaint-demo",
          ratio: "2496 / 480",   // 动图的宽高比，图到之前骨架按它占位
          title: "View Inpainting",
          body: "Given a fixed reference video, generate the corresponding view from another " +
                "camera.<br>Each clip shows: reference | View 1 | View 2.",
          // 2-fixed：这些片段本身已经是三路并排拼接，塌成一列会看不清
          perPage: 2,
          items: [
            { src: SW + "inpaint_demo/shard_01_teacher_cfg5.0_steps50_0000_seed1_concat.avif" },
            { src: SW + "inpaint_demo/shard_02_teacher_cfg5.0_steps50_0000_seed1_concat.avif" },
            { src: SW + "inpaint_demo/shard_02_teacher_cfg5.0_steps50_0009_seed1_concat.avif" },
            { src: SW + "inpaint_demo/shard_02_teacher_cfg5.0_steps50_0012_seed1_concat.avif" },
            { src: SW + "inpaint_demo/shard_04_teacher_cfg5.0_steps50_0002_seed1_concat.avif" },
            { src: SW + "inpaint_demo/shard_04_teacher_cfg5.0_steps50_0003_seed1_concat.avif" },
          ],
        },
      ],

      bibtex:
        "@article{sun2026stereo,\n" +
        "  title={Stereo World Model: Camera-Guided Stereo Video Generation},\n" +
        "  author={Sun, Yang-Tian and Huang, Zehuan and Niu, Yifan and Ma, Lin and Cao, Yan-Pei and Ma, Yuewen and Qi, Xiaojuan},\n" +
        "  journal={arXiv preprint arXiv:2603.17375},\n" +
        "  year={2026}\n" +
        "}",
    },
  ],

  /* -------------------------------------------------------------- Blog 文章 */
  /* 结构和上面两个数组一样，只是列在 Blog 栏目下、没有 venue/作者列表这些
   * 论文才需要的字段。同样支持 sections，所以正文可以放图、表、代码步骤。
   * URL 也是 index.html?p=<id>，三个数组的 id 不要重名。 */
  posts: [
    {
      id: "post-scaling-notes",
      title: "Doubling Training Throughput: A Not-So-Dignified Tuning Log",
      short: "Throughput tuning log",
      subtitle: "From the profiler screenshot to the one-line fix — the potholes are more " +
            "interesting than the conclusion.",
      date: "2026-07",
      thumb: "assets/placeholder/tile-2.svg",
      author: "First Author",
      readingTime: "8 min read",
      teaser: {
        src: "assets/placeholder/teaser-b.svg",
        caption: "Placeholder: the profiler timeline.",
      },
      abstract: "Placeholder lede. For posts the abstract renders as an intro — keep it shorter " +
            "than a paper abstract.",
      sections: [
        {
          type: "text",
          id: "background",
          title: "How we noticed",
          body: "Placeholder paragraph. Supports <b>bold</b>, <code>code</code>, and " +
                "<a href='#'>links</a>.",
        },
        {
          type: "steps",
          id: "what-we-tried",
          title: "What we tried",
          items: [
            {
              title: "Start with the profiler",
              body: "The timeline from <code>torch.profiler</code>.",
            },
            {
              title: "Tune the dataloader",
              body: "Trading off worker count against prefetch depth.",
            },
            {
              title: "The one-line fix",
              body: "Turns out <code>pin_memory</code> was off the whole time.",
            },
          ],
        },
        {
          type: "table",
          id: "numbers",
          title: "Before and after",
          columns: [
            "Config",
            "samples/s ↑",
            "Memory ↓",
          ],
          rows: [
            ["Before", "142", "38.2 GB"],
            ["After", "301", "23.6 GB"],
          ],
          highlightRows: [1],
        },
      ],
    },
    {
      id: "post-eval-harness",
      title: "Why We Wrote Our Own Eval Harness",
      short: "Our own eval harness",
      subtitle: "Every off-the-shelf option fell slightly short on multimodal inputs — and that " +
            "slight shortfall decided it.",
      date: "2026-05",
      thumb: "assets/placeholder/tile-3.svg",
      author: "Second Lead",
      readingTime: "5 min read",
      abstract: "Second placeholder post. Just an abstract and one text section — minimal structure.",
      sections: [
        {
          type: "text",
          id: "why",
          title: "The trigger",
          body: "Placeholder body text.",
        },
      ],
    },
  ],
};
