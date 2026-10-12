/* =============================================================================
 * 站点内容 —— 你平时只需要改这个文件（以及 assets/ 里的图片视频）
 * -----------------------------------------------------------------------------
 * 双语写法：任何面向读者的字段都可以写成 { zh: "中文", en: "English" }。
 * 也可以直接写一个字符串 —— 那就两种语言共用，适合人名、数字、代码、URL。
 * 某个语言没写会自动回落到另一个，不会渲染出空白。
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

/* StereoWorld 的素材（44 个视频 + 3 张图，合计约 305MB）托管在我们自己的
 * HuggingFace dataset 上，没有拷进本仓库 —— 那么大的二进制文件进 git 会把仓库
 * 拖垮，GitHub Pages 也有 1GB 软限。托管在自己账号下，不像之前外链原作者的
 * 项目页那样、别人改路径我们就全挂。
 *
 * 仓库：https://huggingface.co/datasets/huanngzh/page-assets
 * 目录：assets/stereo-world/{videos,images,stereo_video,stereo_depth,flex_demo,ar_demo,inpaint_demo}/
 *
 * URL 必须用 `resolve/main`（直出文件本体），不是 `blob/main`（那是网页版预览）。
 * HF 会 302 到一个带签名的 CDN 地址，签名有有效期，所以**别把 302 之后的地址
 * 抄进来**，只写下面这个 resolve 形式的稳定地址。
 *
 * 想改成本地托管：把文件拉到 assets/stereoworld/ 下（保持子目录结构），
 * 再把 SW 改成 'assets/stereoworld/' 即可，后面的路径都不用动。 */
const SW = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/stereo-world/';

/* Mira-Scene 的素材同理，托管在同一个 dataset 的 assets/mira-scene/ 下：
 *   images/      teaser.jpg、layout_representation.png、pipeline.gif
 *   videos/      demo.mp4（teaser）
 *   simulation/  blender/sim1..4.mp4、isaac/interaction1..3.mp4
 *   scenes/      12 张场景查看器的预览图（文件名 = manifest 里的 case id）
 *   astra/       6 张 Astra 对比案例的缩略图（01..06 前缀 = 原站的展示顺序）
 *
 * 这些是「轻」素材（图和视频）。三维模型另算，见下面的 MS3。 */
const MS = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/mira-scene/';

/* 三维素材（GLB 场景模型 + 环境全景图 + CCM workflow 的中间结果），
 * 155 个文件约 730MB，同一个 dataset 的 assets/mira-scene/3d/ 下：
 *   viewers/scenes/<caseId>/scene.glb + environment.png   12 个可旋转场景
 *   viewers/astra/<caseId>/{from_scratch,with_mira_scene}.glb   6 组并排对比
 *   workflow/<caseId>/...                                 CCM 分步工作流那一页
 *
 * 这些模型单个 10~44MB，一律「点了才下载」：section 默认只渲染预览图，
 * 读者点「载入 3D 场景」才动态 import three.js 并抓 GLB。
 * 查看器实现在 js/viewers/，接线在 js/app.js 的 initSceneViewers()。 */
const MS3 = MS + '3d/';

/* 列表卡片的缩略图。之前是手画的 SVG，几 KB、能靠半透明自适应深浅色主题，
 * 但太朴素、几张之间看不出差别，也说不清这篇论文在做什么。现在换成生成的
 * 示意图（统一风格，见 CLAUDE.md 的「缩略图」一节），单张 260~320KB，
 * 所以跟其他重素材一样托管在 HF、不进 git。
 *
 * 原图 2400x1500（= 卡片的 16:10）一律按原分辨率保留，不预先缩小 ——
 * 缩到 288px 存盘在高分屏和详情页切换器上都会糊，交给浏览器按 CSS 缩放。 */
const TH = 'https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/thumbs/';

/* MultiLive 的 19 个页面素材（13 段视频、5 张图片、1 份 PDF，约 80 MiB）
 * 托管在 ToRealU/eden-page-assets 的 assets/multilive/ 下。
 * 使用 resolve/main 稳定地址，视频分段请求由 HF 处理。
 * 需要离线预览时，把 ML 改成 'assets/multilive/'（本地视频拖动需要
 * 支持 Range 的服务器）。 */
const ML = 'https://huggingface.co/datasets/ToRealU/eden-page-assets/resolve/main/assets/multilive/';

/* EdenLive 的视频（背景条带、宣传片、四节应用的样例，共 61 个，约 960MB）
 * 托管在 huanngzh/page-assets 的 assets/edenlive/clips/ 下，resolve/main 直出。
 * 文件名是随机短码，不带分辨率和模型名。短码与本地 artifacts/ 原文件名的
 * 对照在 data/edenlive-clips.md。
 *
 * 背景条带 27 个 clip、832×480、各约 30s。懒加载：只有滚到视野附近的格子才下载。
 *
 * 条带的挑选（本地目录 edenlive-wipe-480 里实际有 31 个，这里只用 27 个）：
 * 三个 elda 文件夹（025/026/028）内容高度相似，只留 025 的 wan21；
 * 两个火箭发射（082/084）只留 082。相似的格子挨着滚过去会看成同一段在重播。
 * 后来换过一批：拿掉 doodle-jump、elda 的 wan22、合金弹头、光剑切箱子、草原疾驰，
 * 补上运河小船 / 提灯划小船、闪身步 / 地下遗迹 / 火星车漫游，外加 025 的 wan21。
 * 奥特曼飞行小游戏渲过但不稳定，没有放进条带。第一行 13 格、第二行 14 格。 */

window.SITE_DATA = {
  /* ---------------------------------------------------------------- 站点级 */
  site: {
    team: "Eden",
    // teamShort 是窄屏下 header 里的缩写。"Eden" 本身够短，两处写一样即可。
    teamShort: "Eden",
    tagline: {
      zh: "为交互与仿真构建生成式模型。",
      en: "Generative models for interaction and simulation.",
    },
    // header 里的标志用 logo.svg；浏览器标签页的 favicon 在 index.html 里单独指定
    logo: "assets/logo.svg",
    // 页脚链接（header 主导航是 Project / Research / Blog，见下面的 nav）
    links: [
      { label: "X", href: "https://x.com/VastAIResearch", icon: "twitter" },
    ],
    footer: {
      note: {
        zh: "我们为交互与仿真构建生成式模型。",
        en: "We build generative models for interaction and simulation.",
      },
      // 页脚最下面那行小字。省略的话整行（含上方分隔线）会隐藏。
      credit: {
        zh: "设计参考 Nerfies / academic-project-page 一脉。",
        en: "Design inspired by the Nerfies / academic-project-page lineage.",
      },
      contact: "mailto:huanngzh@gmail.com",
    },
  },

  /* -------------------------------------------------------------- 首页文案 */
  /* 打开 index.html（不带任何 query）时看到的东西。
   * title 里 *星号* 包住的词会显示成品牌色。 */
  home: {
    title: {
      zh: "我们为交互与仿真构建*生成式模型*。",
      en: "We build *generative models* for interaction and simulation.",
    },
    // intro 省掉了：主标题已经把话说完，底下再跟一段同义的展开是重复。
    // 想加回来就补一个 intro: { zh, en }，渲染层会自动显示（没有就整段隐藏）。
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
      label: { zh: "项目", en: "Project" },
      title: { zh: "项目", en: "Projects" },
      intro: {
        zh: "我们发布的系统、模型和工具。",
        en: "Systems, models, and tools we release.",
      },
    },
    {
      key: "research",
      label: { zh: "研究", en: "Research" },
      title: { zh: "研究工作", en: "Research" },
      intro: {
        zh: "我们的研究论文。",
        en: "Our research papers.",
      },
    },
    {
      // 同上：内容仍是占位，先隐藏入口
      hidden: true,
      key: "blog",
      label: { zh: "博客", en: "Blog" },
      title: { zh: "博客", en: "Blog" },
      intro: {
        zh: "工程笔记与想法。",
        en: "Engineering notes and ideas.",
      },
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
      title: {
        zh: "EdenLive：任意参考的*实时生成式渲染*",
        en: "EdenLive: *Real-Time Generative Rendering* from Any Reference",
      },
      titleBreakAfter: { zh: "", en: "EdenLive: *Real-Time Generative Rendering*" },
      short: "EdenLive",
      /* TL;DR 只说一句话。详细的输入输出、布局与外观怎么分工，
       * 留给下面的 overview 一节 —— 这里铺开会变成第二个摘要。 */
      subtitle: {
        zh: "EdenLive 将参考视频流实时转化为生成视频（24 fps 或更高）。",
        en: "EdenLive transforms a reference video stream into generated video " +
            "in real time (24 fps or higher).",
      },
      date: "2026-10",
      /* 首页卡片的封面。别的条目用的是 HF 上的示意图，这个是拿 088（第一人称
       * 冰冻枪）擦除片的首帧裁成 16:10 做的 —— 左边 proxy、右边成片，本来就
       * 把 EdenLive 在做的事画在一张图里了。文字压在左半边，那边加了一层蒙版。
       * 重做见 scripts/cover.py。 */
      thumb: "assets/edenlive/cover.jpg",
      keywords: [
        "generative rendering",
        "real-time video generation",
        "proxy-to-fine",
        "interactive world",
      ],

      /* hero 背景：两行横向滚动的视频条带，标题和按钮压在上面
       * 第一行 13 格、第二行 14 格，共 27 个 clip。
       * 两行方向相反，视觉上更像「一片正在跑的素材」而不是一条传送带。
       *
       * 纯装饰：aria-hidden、不给控制条、静音循环，并且是懒加载的 ——
       * 只有滚到视野附近的格子才真正下载。读者要看的是下面的 teaser。
       * 右下角有个暂停按钮（动效 + 流量都能被用户掐掉）。 */
      backdrop: {
        rows: [
          [
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/c901fab6.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/f4bb3f37.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/afb26e68.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/4c37c8d1.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/34bd577a.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/948449bc.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/ca38f196.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/6d9632a9.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/1cbd0d35.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/c6e8434c.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/0890969e.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/71585601.mp4",
          ],
          [
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/8da956a9.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/4d69026d.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/075191ee.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/d0a94370.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/cffd5edf.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/8dd568c5.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/2cd581b1.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/5c88a24a.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/e2521235.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/ee67545b.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/00282906.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/801ad06f.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/a4195340.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/92849ce6.mp4",
            "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/7eb84745.mp4",
          ],
        ],
      },

      authors: [
        { name: "Zehuan Huang", affil: [1], note: "*", bold: true },
        { name: "Tian-Xing Xu", affil: [1], note: "*", bold: true },
        { name: "Chunli Peng", affil: [1], note: "*", bold: true },
        { name: "Cheng Zhang", affil: [1], note: "*", bold: true },
        { name: "Yifei Song", affil: [1], note: "†", breakBefore: true },
        { name: "Zeyi Zheng", affil: [1], note: "†" },
        { name: "Zhipeng Yu", affil: [1] },
        { name: "Peng Wang", affil: [1], note: "‡", bold: true },
        { name: "Yan-Pei Cao", affil: [1], note: "✉", bold: true },
      ],
      affiliations: [{ name: "VAST", url: "https://www.tripo3d.ai/" }],
      authorNotes: {
        zh: "* 同等贡献　† VAST 实习生　‡ 项目负责人　✉ 通讯作者",
        en: "* Equal contribution　† Intern at VAST　‡ Project lead　✉ Corresponding author",
      },

      links: [
        { label: { zh: "论文", en: "Paper" }, href: "#", icon: "arxiv" },
        { label: { zh: "代码", en: "Code" }, href: "https://github.com/VAST-AI-Research/EdenLive", icon: "github" },
        { label: { zh: "模型权重", en: "Weights" }, href: "https://huggingface.co/VAST-AI/EdenLive", icon: "hf" },
        { label: { zh: "在线试玩", en: "Live Demo" }, href: "#", icon: "demo" },
      ],

      /* 开源预告。渲染在 TL;DR 前面，品牌色高亮。 */
      notice: {
        zh: "EdenLive 将在 2026.10.18 前开源！",
        en: "EdenLive will be open-sourced by 2026.10.18!",
      },

      /* 宣传片。TL;DR 之后、摘要之前的那一段。 */
      teaser: {
        src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/e64ab20b.mp4",
      },

      /* 数字以最终模型实测为准，现在填的是对外口径的下限 */
      highlights: [
        { value: ">24 FPS", label: { zh: "实时生成", en: "real-time" } },
        { value: { zh: "分钟级", en: "Minutes" }, label: { zh: "连续时长", en: "continuous" } },
        { value: "480P/720P", label: { zh: "输出分辨率", en: "output" } },
        { value: { zh: "单 GPU", en: "Single GPU" }, label: { zh: "部署", en: "deployment" },
          note: { zh: "单 GPU 部署仅适用于 5B 模型（720P）。", en: "Single-GPU deployment applies to the 5B model (720P)." } },
      ],

      abstract: {
        zh: "我们提出 EdenLive，Project Eden 系列中面向交互场景的实时生成式视频渲染器。" +
            "它以 proxy 或参考视频作为控制信号，结合目标首帧与文本提示词，" +
            "持续生成照片级真实、更精细或风格化的视频。" +
            "这里的 proxy 是刻画场景布局、相机运动与粗粒度动态的简化渲染画面，" +
            "可由代码 Agent、现有引擎或工作台生成，也可直接用录制视频代替。" +
            "不同于联合建模交互逻辑与视觉内容的方法，EdenLive 将交互状态与渲染解耦：" +
            "游戏逻辑、交互机制与世界状态由上游代码或引擎维护，" +
            "EdenLive 只负责提升视觉呈现、生成风格化画面。" +
            "这样 EdenLive 可以专注于生成质量，" +
            "世界状态则由上游代码以轻量、显式且精确的方式演化。" +
            "EdenLive 能以超过 24 FPS 的速度实时生成，支持分钟级连续合成，输出 480P/720P 分辨率，" +
            "在生成效率与视觉质量之间取得了良好平衡。",
        en: "We introduce EdenLive, a real-time generative video renderer tailored to interactive settings " +
            "within the Project Eden series. Conditioned on a proxy or reference video as the control " +
            "signal, together with a target first frame and a text prompt, EdenLive continuously produces " +
            "photorealistic, refined, or stylized video. A proxy here denotes a simplified " +
            "rendering that captures scene layout, camera motion, and coarse dynamics. Such a proxy can be " +
            "produced by a coding agent, an existing engine, or a workbench; alternatively, recorded videos " +
            "can be used directly in place of a proxy. Unlike methods that jointly model interaction logic " +
            "and visual content, EdenLive decouples interaction state from rendering: game logic, interaction " +
            "mechanisms, and world state are maintained by the upstream code or engine, whereas EdenLive is " +
            "responsible only for enhancing visual presentation and generating stylized output. This design " +
            "enables EdenLive to focus on improving generation quality, while the upstream code governs a " +
            "lightweight, explicit yet precise evolution of the world state. EdenLive achieves real-time " +
            "generation at over 24 FPS, sustains minute-scale continuous synthesis, and supports 480P/720P " +
            "output, striking a good balance between efficiency and visual quality."
      },

      sections: [
        /* ---------------------------------------------------------- overview */
        {
          type: "figure",
          id: "overview",
          eyebrow: { zh: "总览", en: "Overview" },
          title: { zh: "输入、输出与整体流程", en: "Inputs, Outputs, and the Pipeline" },
          body: {
            zh: "<p><b>输入</b>有三路：一路是 <b>proxy 或参考视频（流）</b>，" +
                "提供布局、镜头与运动；一路是 <b>目标首帧</b>，定下画面的外观基调；" +
                "一路是<b>文本提示词</b>，补充画风和细节描述。" +
                "proxy 的来源不限 —— 代码 Agent 搭出来的 2D / 3D 场景、现有引擎或工作台的" +
                "动画与仿真画面、乃至一段录屏，都可以直接用。" +
                "<b>输出</b>是一段精细的视频，或者一条持续的视频流。</p>" +
                "<p>EdenLive 可以概括为 <b>proxy-to-fine</b>：" +
                "它利用 proxy 提供的结构与运动信息，而不要求参考达到某种几何精细程度，" +
                "也不要求它来自特定的渲染管线（例如 G-buffer）。两个亮点是<b>实时</b>（单 GPU<sup class=\"fn\">*</sup> 上不低于 24 fps）" +
                "和<b>长时</b>（分钟级连续生成）—— 这两条合在一起，才让「渲染」能接到" +
                "一个持续变化的交互回路上。</p>" +
                "<p class=\"fn-note\"><sup class=\"fn\">*</sup> 单 GPU 部署仅适用于 5B 模型（720P）。</p>",
            en: "<p>EdenLive operates on three <b>inputs</b>: a <b>proxy or reference video (stream)</b> " +
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
          },
          src: {
            zh: "assets/edenlive/pipeline-zh.svg",
            en: "assets/edenlive/pipeline-en.svg",
          },
          caption: {
            zh: "<b>整体流程。</b>输入来源（代码 Agent / 引擎工作台 / 已有视频）→ " +
                "proxy 或参考视频流 → EdenLive 生成式渲染（叠加目标首帧与提示词）→ " +
                "精细视频流。自定义交互由上游的代码和引擎定义，用户看到画面后继续操作，" +
                "形成闭环。",
            en: "<b>Pipeline.</b> Input sources (coding agent, engine or workbench, existing " +
                "video) → proxy or reference stream → EdenLive generative rendering, " +
                "conditioned on the target first frame and prompt → refined video stream. " +
                "Custom interaction is defined upstream in code or the engine; the user " +
                "acts on what they see, closing the loop.",
          },
        },
        {
          type: "figure",
          id: "interaction",
          eyebrow: { zh: "交互回路", en: "Interaction loop" },
          title: { zh: "交互逻辑在先，画面随参考变化", en: "Logic First, Pixels Follow" },
          body: {
            zh: "<p>以游戏为例：Code Agent 首先生成场景 proxy 与引擎代码，" +
                "并由其维护世界状态与交互逻辑。游戏过程中，鼠标与键盘输入交由引擎处理，" +
                "引擎更新交互状态并输出简化画面；所得 <b>proxy 帧流</b>被送入 EdenLive，" +
                "在目标首帧与文本提示词的条件下持续合成精细画面；" +
                "用户观察渲染结果后发出下一步操作。" +
                "<b>规则、碰撞、状态与反馈始终由上游维护</b>，从而与视频扩散模型解耦" +
                "—— 这正是<b>纯以 action 为条件的世界模型难以可靠表示的部分</b>" +
                "（血条、技能冷却、NPC 状态，以及成功与失败的反馈）。</p>",
            en: "<p>Consider a game as a representative setting. A coding agent first " +
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
          },
          src: {
            zh: "assets/edenlive/interaction-zh.svg",
            en: "assets/edenlive/interaction-en.svg",
          },
          caption: {
            zh: "<b>交互回路。</b>用户操作 → 引擎更新状态 → proxy 帧流 → " +
                "EdenLive 持续生成 → 显示画面 → 继续操作。" +
                "端到端延迟指从用户操作到对应画面出现，目前在百毫秒级。",
            en: "<b>Interaction loop.</b> User input → engine updates state → proxy frame " +
                "stream → EdenLive renders continuously → frames shown → next input. " +
                "End-to-end latency, from input to the corresponding frame appearing, is " +
                "currently in the hundreds of milliseconds.",
          },
        },

        /* ----------------------------------------------------------- method */
        {
          type: "features",
          id: "highlights",
          eyebrow: { zh: "亮点", en: "Highlights" },
          title: { zh: "EdenLive 的四个特点", en: "Key Properties of EdenLive" },
          items: [
            {
              title: { zh: "多种参考输入", en: "Diverse reference inputs" },
              body: {
                zh: "同时支持 2D / 3D proxy 与参考视频。模型利用参考所提供的结构与运动，" +
                    "而不对输入的几何精细程度或制作路径施加限制。",
                en: "Accepts 2D and 3D proxies as well as reference video. The model " +
                    "exploits the structure and motion conveyed by the reference, without " +
                    "constraining its level of geometric detail or the pipeline by which it was produced.",
              },
              icon: "spark",
            },
            {
              title: { zh: "布局保持与外观可控", en: "Layout-preserving, appearance-controllable" },
              body: {
                zh: "相机、布局与运动由参考约束，目标外观与画风由首帧和提示词指定。" +
                    "同一段参考因此可以渲染为多种风格。",
                en: "Camera, layout, and motion remain constrained by the reference, while " +
                    "target appearance and style are specified by the first frame and the " +
                    "prompt. A single reference can thus be rendered in multiple distinct styles.",
              },
              icon: "video",
            },
            {
              title: { zh: "实时且长时", en: "Real-time and long-horizon" },
              body: {
                zh: "生成速度不低于 24 fps，并支持分钟级连续合成，" +
                    "从而可将渲染接入持续变化的实时参考流。",
                en: "Generates at 24 fps or above and sustains minute-scale continuous " +
                    "synthesis, enabling rendering to consume a continuously evolving live " +
                    "reference stream.",
              },
              icon: "bolt",
            },
            {
              title: { zh: "开源", en: "Open source" },
              body: {
                zh: "发布多种规模的模型权重、推理与评测代码，以及一条端到端演示：" +
                    "由提示词生成游戏、试玩、指定首帧，再由 EdenLive 实时渲染。",
                en: "Releases model weights at multiple scales, together with inference and " +
                    "evaluation code and an end-to-end demonstration: a game is generated from " +
                    "a prompt, played, assigned a first frame, and rendered in real time by EdenLive.",
              },
              icon: "github",
            },
          ],
        },
        {
          type: "features",
          id: "method",
          eyebrow: { zh: "方法", en: "Method" },
          title: { zh: "核心技术", en: "Core Techniques" },
          body: {
            zh: "EdenLive 对参考的忠实跟随与实时生成能力主要来自以下三项技术。" +
                "具体细节请参阅论文。",
            en: "EdenLive's faithful adherence to the reference and its real-time generation " +
                "capability rest on three core techniques. Please refer to the paper for " +
                "further details.",
          },
          items: [
            {
              title: { zh: "结构与运动视觉编码器", en: "Structure-and-motion encoder" },
              body: {
                zh: "从参考画面中提取布局、相机与运动信息，同时剥离外观细节。" +
                    "这一设计使参考无需具备精细外观，也使同一段 proxy 能够渲染为不同风格。",
                en: "Extracts layout, camera, and motion from the reference while discarding " +
                    "appearance information. This design allows the reference to remain coarse " +
                    "and enables a single proxy to be rendered in diverse styles.",
              },
              icon: "spark",
            },
            {
              title: { zh: "高质量数据管线", en: "High-quality data pipeline" },
              body: {
                zh: "构建「粗粒度参考 → 精细画面」的配对数据，覆盖 2D / 3D proxy、" +
                    "引擎渲染画面与真实视频，使模型能够泛化到多样的参考形态。",
                en: "Constructs paired data from coarse references to refined frames, " +
                    "spanning 2D and 3D proxies, engine renderings, and real-world video, " +
                    "so that the model generalizes across diverse reference modalities.",
              },
              icon: "data",
            },
            {
              title: { zh: "实时视频蒸馏", en: "Real-time video distillation" },
              body: {
                zh: "将多步扩散模型蒸馏为少步流式生成器，" +
                    "从而实现超过 24 fps 的实时生成与分钟级连续合成。",
                en: "Distills a multi-step diffusion model into a few-step streaming " +
                    "generator, enabling real-time generation above 24 fps and minute-scale " +
                    "continuous synthesis.",
              },
              icon: "bolt",
            },
          ],
        },

        /* ------------------------------------------------------------- apps */
        {
          type: "text",
          id: "applications",
          eyebrow: { zh: "应用", en: "Applications" },
          // 不写「四类」：下面只是举了四个方向，不是说总共就这么多
          title: { zh: "应用方向", en: "Application Areas" },
          body: {
            zh: "<p>下文分节介绍若干应用方向。它们共享同一前提：" +
                "<b>参考约束布局与运动，外观由首帧与提示词指定</b>。" +
                "因此，凡结构已给定、仅缺视觉呈现的场景，均可适用。</p>",
            en: "<p>We next describe several application areas that share a common premise: " +
                "<b>the reference constrains layout and motion, while appearance is specified " +
                "by the first frame and the prompt</b>. The method is therefore applicable " +
                "whenever scene structure is already available and only visual presentation " +
                "remains to be synthesized.</p>",
          },
        },
        {
          type: "carousel",
          id: "app-game",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: { zh: "应用", en: "Application" },
          title: { zh: "游戏类交互式预览", en: "Interactive Game Preview" },
          body: {
            zh: "<p>该类应用最能体现状态与渲染解耦的设计。" +
                "Code Agent 生成场景 proxy 与引擎代码，并维护状态与交互控制；" +
                "EdenLive 作为实时渲染器持续合成高保真画面。</p>",
            en: "<p>This application most clearly illustrates the decoupling of state from " +
                "rendering. A coding agent generates the scene proxy and the engine code, " +
                "and maintains state together with interaction control; EdenLive serves as " +
                "the real-time renderer, continuously synthesizing high-fidelity frames.</p>",
          },
          perPage: 1,
          layout: "centered",
          items: [
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/bafe32b9.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/cf2421f7.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/edf33f08.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/56ac4b6b.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/e60f6083.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/1c70aa33.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/bb6c2841.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/e7d6e8a9.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/8811e6ec.mp4", controls: true },
          ],
        },
        {
          type: "carousel",
          id: "app-preview",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: { zh: "应用", en: "Application" },
          title: { zh: "场景与动画预览", en: "Scene and Animation Preview" },
          body: {
            zh: "在布局与运镜保持不变的条件下渲染不同外观。" +
                "适用于美术资产尚未就绪的阶段：布局、相机与运动已由 proxy 给定，" +
                "所需探索的仅是画风。",
            en: "Renders distinct appearances under a shared layout and camera trajectory. " +
                "This is useful before art assets are available: layout, camera, and motion " +
                "are already specified by the proxy, so style remains the only free variable.",
          },
          perPage: 1,
          layout: "centered",
          items: [
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/ae454d05.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/2819fbee.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/65e47fb6.mp4", controls: true },
            // 新增的成片：DMD 720p 优先，wan21 14b 480p 排在后面
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/efd72737.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/de031217.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/33bb38e6.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/096ca570.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/3ebf1fa9.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/3d9a9e41.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/67ead996.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/32b05736.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/537bd181.mp4", controls: true },
          ],
        },
        {
          type: "carousel",
          id: "app-restyle",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: { zh: "应用", en: "Application" },
          title: { zh: "视频重渲染与换皮", en: "Video Re-Rendering and Restyling" },
          body: {
            zh: "以已有视频为参考，在保持布局与运动的同时改变外观，" +
                "可在实时流中替换角色、内容或整体风格。",
            en: "Taking existing video as the reference, EdenLive preserves layout and " +
                "motion while altering appearance, enabling real-time replacement of " +
                "characters, content, or overall style.",
          },
          perPage: 1,
          layout: "centered",
          items: [
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/c7560051.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/1515283e.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/60e3c4d9.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/6becd8f3.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/72a254b9.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/2f8eeb65.mp4", controls: true },
          ],
        },
        {
          type: "carousel",
          id: "app-embodied",
          tocDepth: 2,   // 目录里缩进成 applications 的子项
          eyebrow: { zh: "应用", en: "Application" },
          title: { zh: "具身数据增强", en: "Embodied Data Augmentation" },
          body: {
            zh: "将真实的人类操作视频转换为机器人视角，" +
                "或替换已有第一人称视频中的物体并改变其风格。",
            en: "Converts real human manipulation footage into a robot viewpoint, or " +
                "replaces objects in existing egocentric video and restyles the result.",
          },
          perPage: 1,
          layout: "centered",
          items: [
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/748848e0.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/ef7f3a46.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/80ac72ba.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/1fb017f8.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/29e08b3c.mp4", controls: true },
            { src: "https://huggingface.co/datasets/huanngzh/page-assets/resolve/main/assets/edenlive/clips/5a96da28.mp4", controls: true },
          ],
        },

        /* ------------------------------------------------------- comparison */
        {
          type: "table",
          id: "comparison",
          eyebrow: { zh: "对比", en: "Comparison" },
          title: { zh: "与其他路线的区别", en: "Comparison with Related Approaches" },
          body: {
            zh: "下表用于说明定位上的差异，而非逐项评测优劣；" +
                "各条路线所针对的问题本身并不相同。",
            en: "The table below clarifies differences in positioning rather than ranking " +
                "methods. These lines of work address distinct problems.",
          },
          columns: [
            { zh: "路线", en: "Approach" },
            { zh: "做法", en: "Mechanism" },
            { zh: "与 EdenLive 的差异", en: "Difference from EdenLive" },
          ],
          // 这张表是说明文字，不是数字。wrap 让单元格在栏宽内折行，
          // 否则 nowrap 会把右列挤出视口，只能横着拖。
          wrap: true,
          rows: [
            [
              { zh: "交互式世界模型（Lingbot World、Pixverse R 系列等）",
                en: "Interactive world models (Lingbot World, Pixverse R, …)" },
              { zh: "以 action 或文本为条件，直接生成交互画面",
                en: "Generates interactive frames conditioned on actions or text" },
              { zh: "将状态与渲染解耦：proxy 承担状态与交互控制，EdenLive 仅负责渲染，" +
                    "因而血条、冷却、NPC 状态及成败反馈均可维持",
                en: "Decouples state from rendering: the proxy maintains state and interaction " +
                    "control, while EdenLive is responsible only for rendering, so that health, " +
                    "cooldowns, NPC state, and success or failure feedback can be preserved" },
            ],
            [
              "Vidu S2",
              { zh: "同样支持实时参考驱动生成", en: "Also performs real-time reference-driven generation" },
              { zh: "Vidu S2 主要面向人像场景，EdenLive 可处理多样的参考输入",
                en: "Vidu S2 is largely restricted to portrait scenes, whereas EdenLive " +
                    "handles diverse forms of reference" },
            ],
            [
              { zh: "Blockout（Seedance 2.5、MiniMax H3）",
                en: "Blockout (Seedance 2.5, MiniMax H3)" },
              { zh: "离线可控视频生成",
                en: "Offline controllable video generation" },
              { zh: "EdenLive 支持实时生成，并可接入持续的交互回路",
                en: "EdenLive supports real-time generation and can be placed inside a live " +
                    "interaction loop" },
            ],
            [
              "DLSS 5",
              { zh: "在既有渲染管线上做超分与插帧",
                en: "Upscaling and frame generation on top of an existing render pipeline" },
              { zh: "EdenLive 属于生成式渲染：外观可整体改变，不受原始资产约束",
                en: "EdenLive is a generative renderer: appearance can be altered wholesale, " +
                    "unconstrained by the original assets" },
            ],
          ],
          // 不设 highlightRows：这张表讲的是定位差别，没有「我们那一行」可高亮
        },

      ],
    },
  ],

  /* ---------------------------------------------------------------- 论文 */
  /* Research 栏目。有 venue / authors[] / affiliations[] / bibtex 这些论文字段。
   * sections 是有序数组，type 决定渲染方式，目前支持：
   *   text | figure | gallery | video | compare | table | features | steps  */
  papers: [
    {
      id: "multilive",
      title: {
        zh: "MultiLive：面向*多视角视频生成*的视频与多视角先验蒸馏",
        en: "MultiLive: On-Policy Distillation of Video and Multi-View Priors for *Multi-View Video Generation*",
      },
      /* 中文标题短、本来就一行，显式写空串。写整句的话 heroTitleHTML()
       * 要求前缀后面跟一个空格才断行，整句匹配不上、结果也是不断行，
       * 但那是靠巧合。
       * 英文断在 "Priors" 后面：高亮词在第二行，第一行不会只剩半句强调。 */
      titleBreakAfter: {
        zh: "",
        en: "MultiLive: On-Policy Distillation of Video and Multi-View Priors",
      },
      short: "MultiLive",
      subtitle: {
        zh: "用 on-policy 双教师蒸馏，把视频先验的时间动态与多视角先验的几何一致性结合到同一个生成器中。",
        en: "On-policy dual-teacher distillation combines temporal dynamics from video priors with geometric consistency from multi-view priors in one generator.",
      },
      date: "2026-10",
      thumb: ML + "cover.jpg",
      keywords: [
        { zh: "多视角视频", en: "multi-view video" },
        { zh: "双教师蒸馏", en: "dual-teacher distillation" },
        { zh: "世界模型", en: "world model" },
        { zh: "四步生成", en: "4-step generation" },
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
      authorNotes: {
        zh: "* 同等贡献　✉ 通讯作者　† 项目负责人",
        en: "* Equal contribution　✉ Corresponding authors　† Project leads",
      },

      links: [
        { label: "PDF", href: ML + "paper.pdf", icon: "paper" },
        { label: "Code", href: "https://github.com/VAST-AI-Research/MultiLive", icon: "github" },
      ],

      teaser: {
        src: ML + "teaser.mp4",
        poster: ML + "teaser.jpg",
        autoplay: false,
        loop: false,
        caption: {
          zh: "MultiLive 从文本提示和相机条件联合生成同步的多视角视频；视频教师约束时间动态，多视角教师约束跨视角几何与外观。",
          en: "MultiLive jointly generates synchronized multi-view videos from text and camera conditions: a video teacher guides temporal dynamics while a multi-view teacher guides geometry and appearance.",
        },
      },

      highlights: [
        { value: "4 views", label: { zh: "同步视角", en: "synchronized views" } },
        { value: "4 steps", label: { zh: "去噪步数", en: "denoising steps" } },
        { value: "No MV video", label: { zh: "训练数据", en: "training data" } },
      ],

      abstract: {
        zh: "多视角视频生成同时要求跨视角几何一致和视频内时间连贯，但同步多视角视频训练数据稀缺。MultiLive 提出一种 on-policy 双教师分布匹配框架：视频教师约束每个视角中的运动与时间动态，多视角教师约束每个时间点的几何和外观一致性。两个目标都作用于学生同一次生成的多视角视频，通过共享的伪分数模型把互补先验蒸馏到同一个相机感知生成器中。这样无需显式三维重建或同步多视角视频训练数据，也能在推理时用 4 步去噪联合生成 4 个同步视角。",
        en: "Multi-view video generation must satisfy cross-view geometric consistency and coherent temporal dynamics, yet synchronized multi-view video data are scarce. MultiLive introduces an on-policy dual-teacher distribution-matching framework: a video teacher constrains motion and temporal dynamics within each view, while a multi-view teacher constrains geometry and appearance across views at each time step. Both objectives operate on the same student-generated multi-view video and distill complementary priors into one camera-aware generator through a shared fake-score model. The result requires no explicit 3D reconstruction or synchronized multi-view video training data, and jointly generates four synchronized views in four denoising steps at inference.",
      },

      sections: [
        {
          type: "figure",
          id: "pipeline",
          title: { zh: "双教师蒸馏框架", en: "Dual-Teacher Distillation" },
          body: {
            zh: "<p>学生模型先以 on-policy 方式生成完整的时间 × 视角 latent 网格。相同样本沿两个方向读取：按视角切成视频轨迹交给视频教师，按时间切成同步多视角图像交给多视角教师。两个分支的分布匹配梯度共同更新同一个生成器。</p>",
            en: "<p>The student first generates a complete time-by-view latent grid on-policy. The same sample is read in two ways: per-view temporal trajectories go to the video teacher, while synchronized multi-view slices go to the multi-view teacher. Their distribution-matching gradients update the same generator.</p>",
          },
          src: ML + "pipeline.jpg",
          alt: { zh: "MultiLive 双教师蒸馏流程图", en: "MultiLive dual-teacher distillation pipeline" },
          caption: {
            zh: "同一次学生生成同时接受时间先验与多视角先验的监督。",
            en: "One student rollout receives temporal and multi-view supervision simultaneously.",
          },
        },
        {
          type: "figure",
          id: "architecture",
          title: { zh: "模型结构", en: "Model Architecture" },
          src: ML + "architecture.jpg",
          alt: { zh: "MultiLive 模型结构图", en: "MultiLive model architecture" },
          caption: {
            zh: "相机感知的生成器在共享的多视角 latent 网格上工作，两个教师分支提供互补的 score 监督。",
            en: "A camera-aware generator operates on a shared multi-view latent grid, with complementary score supervision from the two teacher branches.",
          },
        },
        {
          type: "figure",
          id: "comparison",
          title: { zh: "定性对比", en: "Qualitative Comparison" },
          body: {
            zh: "<p>MultiLive 在多种内容和风格上生成跨视角一致的动态场景，同时保持视频内运动连贯。</p>",
            en: "<p>MultiLive produces cross-view consistent dynamic scenes across diverse content and styles while maintaining coherent motion within each video.</p>",
          },
          src: ML + "comparison.png",
          alt: { zh: "MultiLive 与其他方法的定性对比", en: "Qualitative comparison with other methods" },
        },
        {
          type: "carousel",
          id: "mv-results",
          title: { zh: "更多结果", en: "More Results" },
          perPage: 1,
          items: [
            { src: ML + "results/lunar-astronaut.mp4" },
            { src: ML + "results/eiffel-night.mp4" },
            { src: ML + "results/mountain-road.mp4" },
            { src: ML + "results/sunset-seaside.mp4" },
            { src: ML + "results/flower-meadow.mp4" },
            { src: ML + "results/blue-ufo.mp4" },
            { src: ML + "results/red-macaw.mp4" },
            { src: ML + "results/beach-run.mp4" },
          ],
        },
        {
          type: "carousel",
          id: "demos",
          title: { zh: "世界模型演示", en: "World Model Demos" },
          body: {
            zh: "<p>每段视频展示一个世界模型场景及其同步视角，底部动作提示展示交互控制。点击视频控制条可以暂停、拖动或全屏查看。</p>",
            en: "<p>Each clip shows a world-model scene with synchronized views; the action prompts at the bottom visualize interactive control. Use the video controls to pause, scrub, or enter fullscreen.</p>",
          },
          perPage: 1,
          items: [
            { src: ML + "wm-horse.mp4?v=dial4", caption: { zh: "骑马穿过山谷", en: "Horse ride through a valley" } },
            { src: ML + "wm-desert.mp4?v=dial4", caption: { zh: "荒原星球", en: "Desert planet" } },
            { src: ML + "wm-forest.mp4?v=dial4", caption: { zh: "森林秋千", en: "Forest swing" } },
            { src: ML + "wm-ocean.mp4?v=dial4", caption: { zh: "海上游泳", en: "Swimming in the ocean" } },
          ],
        },
      ],
    },

    {
      id: "mira-scene",
      title: {
        zh: "Mira-Scene：面向生成式三维场景重建的*像素对齐布局*",
        en: "Mira-Scene: *Pixel-Aligned Layouts* for Generative 3D Scene Reconstruction",
      },
      /* 详情页大标题在这个前缀之后强制换行，切成两行（不给的话英文标题会挤成三行）。
       * 必须是 title 的**原样前缀**、连星号一起写，对不上就整句不断行。
       * 中文标题短、本来就一行，显式写空串：不写 zh 的话 t() 会回落到英文那串，
       * 虽然正好匹配不上、结果也对，但那是靠巧合，改标题时容易出意外。 */
      titleBreakAfter: {
        zh: "",
        en: "Mira-Scene: *Pixel-Aligned Layouts*",
      },
      short: "Mira-Scene",
      subtitle: {
        zh: "从单张图像恢复稠密的「规范空间 → 场景空间」对应关系，" +
            "重建连贯、可组合的三维场景。",
        en: "Recovering dense canonical-to-scene correspondences for coherent, " +
            "compositional 3D scene reconstruction from a single image.",
      },
      date: "2026-09",
      thumb: TH + "mira-scene.jpg",
      keywords: [
        { zh: "三维场景重建", en: "3D scene reconstruction" },
        { zh: "规范坐标图", en: "canonical coordinate map" },
        { zh: "生成式三维", en: "generative 3D" },
        { zh: "布局", en: "layout" },
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
        { zh: "香港大学", en: "The University of Hong Kong" },
        "VAST",
      ],
      authorNotes: {
        zh: "* 同等贡献　† 项目负责人　✉ 通讯作者",
        en: "* Equal Contribution　† Project Lead　✉ Corresponding Authors",
      },

      links: [
        // 论文放第一个，和 StereoWorld 那条一致（学术页惯例是先给论文）
        { label: "arXiv", href: "https://arxiv.org/pdf/2609.23796", icon: "arxiv" },
        { label: { zh: "代码", en: "Code" },
          href: "https://github.com/VAST-AI-Research/Mira-Scene", icon: "github" },
        { label: { zh: "模型", en: "Checkpoint" },
          href: "https://huggingface.co/Yang-Tian/Mira-Scene", icon: "hf" },
        { label: { zh: "数据集", en: "Dataset" },
          href: "https://huggingface.co/datasets/Yang-Tian/Mira-Scene-Dataset", icon: "data" },
      ],

      teaser: {
        src: MS + "videos/demo.mp4",
        poster: MS + "images/teaser.jpg",
        caption: {
          zh: "Mira-Scene 通过联合预测物体几何与像素对齐的规范对应关系，" +
              "重建出连贯的三维场景。",
          en: "Mira-Scene reconstructs a coherent 3D scene by jointly predicting object " +
              "geometry and pixel-aligned canonical correspondences.",
        },
      },

      abstract: {
        zh: "单图三维物体生成如今已能产出高保真资产，但把它们准确摆放进一个连贯的场景布局" +
            "仍是开放问题。核心难点在于布局如何表示：整体式方法把摆放吸收进场景级生成过程，" +
            "牺牲了物体级细节；组合式方法通过解耦几何与布局保住了物体保真度，" +
            "但通常把布局参数化成稀疏、无界的位姿变量 —— 这类变量难学，" +
            "且在场景级监督稀缺时泛化很差。" +
            "我们提出 <strong>Mira-Scene</strong>，一个用稠密有界的对应关系恢复" +
            "替代稀疏位姿回归的组合式三维场景重建框架。其核心是" +
            "<strong>规范坐标图（Canonical Coordinate Map, CCM）</strong>：" +
            "一个像素对齐的场，把每个可见物体像素映射到该物体有界规范空间中的一个表面坐标。" +
            "CCM 与来自单目几何估计的场景空间<strong>点云图（Point Cloud Map, PCM）</strong>" +
            "配对后，可导出稠密的规范到场景对应关系，再经由稳健的几何对齐恢复出物体变换。" +
            "由于 CCM 工作在有界的规范空间里，它提供了一个稳定的预测目标，" +
            "可以只用可扩展的物体级三维数据训练，不需要场景级布局标注。" +
            "Mira-Scene 还引入一个多模态扩散 Transformer 来联合生成物体几何与 CCM，" +
            "用模态专属的专家流配合共享注意力和位置编码，促成几何与布局的一致性。" +
            "在室内、室外、合成及真实场景上的实验表明，Mira-Scene 在布局精度上大幅超过" +
            "强基线：在仅使用有限开源训练数据的条件下，相比 SAM3D 取得 3D-IoU 相对提升 39.8%、" +
            "2D-IoU 相对提升 16.5%。",
        en: "Single-image 3D object generation can now produce high-fidelity assets, yet " +
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
      },

      sections: [
        {
          type: "figure",
          id: "motivation",
          title: { zh: "为什么要像素对齐的布局？", en: "Why Pixel-Aligned Layouts?" },
          body: {
            zh: "<p>场景布局很难从稀疏、无界的位姿变量里学出来。Mira-Scene 改为预测" +
                "<strong>规范坐标图（CCM）</strong>：每个可见物体像素都映射到该物体规范表面上" +
                "一个有界的坐标。CCM 与单目估计出的场景空间几何结合，" +
                "就得到用于稳健「物体→场景」对齐的稠密对应关系。</p>",
            en: "<p>Scene layout is difficult to learn from sparse, unbounded pose variables. " +
                "Mira-Scene instead predicts a <strong>Canonical Coordinate Map (CCM)</strong>: " +
                "every visible object pixel maps to a bounded coordinate on the object's " +
                "canonical surface. Combining CCM with monocular scene-space geometry produces " +
                "dense correspondences for robust object-to-scene alignment.</p>",
          },
          src: MS + "images/layout_representation.png",
          // 这张是示意图，铺满 1180px 会放糊，跟原项目页一样限到 35rem
          figureClass: "figure--compact",
          alt: {
            zh: "几种场景布局表示的对比",
            en: "Comparison of scene layout representations",
          },
          caption: {
            zh: "<strong>从稀疏位姿到稠密对应。</strong>CCM 提供了一种有界、像素对齐的布局表示，" +
                "可以用可扩展的物体级三维数据来监督。",
            en: "<strong>From sparse poses to dense correspondences.</strong> CCM provides a " +
                "bounded, pixel-aligned layout representation that can be supervised with " +
                "scalable object-level 3D data.",
          },
        },
        {
          type: "figure",
          id: "pipeline",
          title: { zh: "方法", en: "Mira-Scene Pipeline" },
          src: MS + "images/pipeline.gif",
          alt: { zh: "Mira-Scene 方法流程", en: "Mira-Scene pipeline" },
          caption: {
            zh: "<strong>Mira-Scene 总览。</strong>一个多模态扩散 Transformer 联合预测物体几何" +
                "与 CCM；规范坐标与场景空间点云之间的几何对齐，恢复出连贯的物体变换。",
            en: "<strong>Mira-Scene.</strong> A multimodal diffusion transformer jointly predicts " +
                "object geometry and CCMs. Geometric alignment between canonical coordinates and " +
                "a scene-space point cloud recovers coherent object transformations.",
          },
        },
        {
          /* 12 个可旋转的重建场景。默认只显示预览图，点「载入 3D 场景」才
           * 动态 import three.js 并抓 GLB（单个 10~44MB）。前 4 个案例另有
           * CCM 分步工作流，走 workflow 字段链到 pages/ccm-workflow/。 */
          type: "sceneViewer",
          id: "scene-results",
          title: { zh: "场景重建结果", en: "Scene Reconstruction Results" },
          body: {
            zh: "<p>十二个重建场景，每个都可以载入后拖动旋转、滚轮缩放，" +
                "还能横向旋转环境全景图。前四个案例附有 CCM 等中间结果，" +
                "点卡片上的「查看 CCM 工作流」进去看分步过程。</p>",
            en: "<p>Twelve reconstructed scenes. Load any of them to orbit, zoom, and " +
                "rotate the environment panorama. The first four cases also expose " +
                "intermediate results such as CCM \u2014 follow \u201cView CCM workflow\u201d " +
                "on those cards for the step-by-step process.</p>",
          },
          columns: 3,
          items: [
            {
              id: "012_hotel_lobby",
              model: MS3 + "viewers/scenes/012_hotel_lobby/scene.glb",
              environment: MS3 + "viewers/scenes/012_hotel_lobby/environment.png",
              poster: MS + "scenes/012_hotel_lobby.png",
              workflow: "pages/ccm-workflow/?case=012_hotel_lobby",
            },
            {
              id: "Gemini_Generated_Image_sjbz27sjbz27sjbz",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_sjbz27sjbz27sjbz/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_sjbz27sjbz27sjbz/environment.png",
              poster: MS + "scenes/Gemini_Generated_Image_sjbz27sjbz27sjbz.png",
              workflow: "pages/ccm-workflow/?case=Gemini_Generated_Image_sjbz27sjbz27sjbz",
            },
            {
              id: "003_home_office",
              model: MS3 + "viewers/scenes/003_home_office/scene.glb",
              environment: MS3 + "viewers/scenes/003_home_office/environment.png",
              poster: MS + "scenes/003_home_office.png",
              workflow: "pages/ccm-workflow/?case=003_home_office",
            },
            {
              id: "Gemini_Generated_Image_dfwzixdfwzixdfwz",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_dfwzixdfwzixdfwz/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_dfwzixdfwzixdfwz/environment.png",
              poster: MS + "scenes/Gemini_Generated_Image_dfwzixdfwzixdfwz.png",
              workflow: "pages/ccm-workflow/?case=Gemini_Generated_Image_dfwzixdfwzixdfwz",
            },
            {
              id: "Gemini_Generated_Image_8rhdjt8rhdjt8rhd",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_8rhdjt8rhdjt8rhd/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_8rhdjt8rhdjt8rhd/environment.png",
              poster: MS + "scenes/Gemini_Generated_Image_8rhdjt8rhdjt8rhd.png",
            },
            {
              id: "Gemini_Generated_Image_dh6x0wdh6x0wdh6x",
              model: MS3 + "viewers/scenes/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/scene.glb",
              environment: MS3 + "viewers/scenes/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/environment.png",
              poster: MS + "scenes/Gemini_Generated_Image_dh6x0wdh6x0wdh6x.png",
            },
            {
              id: "scene05",
              model: MS3 + "viewers/scenes/scene05/scene.glb",
              environment: MS3 + "viewers/scenes/scene05/environment.png",
              poster: MS + "scenes/scene05.png",
            },
            {
              id: "idea_table",
              model: MS3 + "viewers/scenes/idea_table/scene.glb",
              environment: MS3 + "viewers/scenes/idea_table/environment.png",
              poster: MS + "scenes/idea_table.png",
            },
            {
              id: "designer-bedroom",
              model: MS3 + "viewers/scenes/designer-bedroom/scene.glb",
              environment: MS3 + "viewers/scenes/designer-bedroom/environment.png",
              poster: MS + "scenes/designer-bedroom.png",
            },
            {
              id: "green-room_local_furniture_hq_v1",
              model: MS3 + "viewers/scenes/green-room_local_furniture_hq_v1/scene.glb",
              environment: MS3 + "viewers/scenes/green-room_local_furniture_hq_v1/environment.png",
              poster: MS + "scenes/green-room_local_furniture_hq_v1.png",
            },
            {
              id: "italian-style-still-life",
              model: MS3 + "viewers/scenes/italian-style-still-life/scene.glb",
              environment: MS3 + "viewers/scenes/italian-style-still-life/environment.png",
              poster: MS + "scenes/italian-style-still-life.png",
            },
            {
              id: "the-white-room-cycles_countrylike_v12_bookshelf_full",
              model: MS3 + "viewers/scenes/the-white-room-cycles_countrylike_v12_bookshelf_full/scene.glb",
              environment: MS3 + "viewers/scenes/the-white-room-cycles_countrylike_v12_bookshelf_full/environment.png",
              poster: MS + "scenes/the-white-room-cycles_countrylike_v12_bookshelf_full.png",
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
          title: {
            zh: "与 GPT-6 Astra 从零搭建的对比",
            en: "Compared to GPT-6 Astra From Scratch",
          },
          body: {
            zh: "<p>点上方缩略图切换案例，下面两侧分别是「GPT-6 Astra 从零搭建」与" +
                "「Mira-Scene 重建 + Astra 搭建背景」。Mira-Scene 在图像一致性上更强。" +
                "两侧可独立选相机视角、调剖切高度、切线框、全屏；" +
                "「重置视角」回到与该缩略图对齐的参考机位；点进画面后可用 W/A/S/D 漫游。</p>",
            en: "<p>Pick a case from the thumbnails above. The two viewers below show the " +
                "scene built from scratch by GPT-6 Astra (left) against a Mira-Scene " +
                "reconstruction with the background built by Astra (right); Mira-Scene " +
                "stays more consistent with the input image. " +
                "Each side has its own camera menu, section slider, wireframe toggle, and " +
                "fullscreen. <em>Reset view</em> returns to the reference framing that " +
                "matches the thumbnail; click into a view and use W/A/S/D to roam.</p>",
          },
          cases: [
            {
              label: { zh: "案例 1", en: "Case 1" },
              id: "Gemini_Generated_Image_gkkzzjgkkzzjgkkz",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_gkkzzjgkkzzjgkkz/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_gkkzzjgkkzzjgkkz/with_mira_scene.glb",
              poster: MS + "astra/01-Gemini_Generated_Image_gkkzzjgkkzzjgkkz.png",
            },
            {
              label: { zh: "案例 2", en: "Case 2" },
              id: "012_hotel_lobby",
              left:  MS3 + "viewers/astra/012_hotel_lobby/from_scratch.glb",
              right: MS3 + "viewers/astra/012_hotel_lobby/with_mira_scene.glb",
              poster: MS + "astra/02-012_hotel_lobby.png",
            },
            {
              label: { zh: "案例 3", en: "Case 3" },
              id: "Gemini_Generated_Image_dfwzixdfwzixdfwz",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_dfwzixdfwzixdfwz/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_dfwzixdfwzixdfwz/with_mira_scene.glb",
              poster: MS + "astra/03-Gemini_Generated_Image_dfwzixdfwzixdfwz.png",
            },
            {
              label: { zh: "案例 4", en: "Case 4" },
              id: "Gemini_Generated_Image_dh6x0wdh6x0wdh6x",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_dh6x0wdh6x0wdh6x/with_mira_scene.glb",
              poster: MS + "astra/04-Gemini_Generated_Image_dh6x0wdh6x0wdh6x.png",
            },
            {
              label: { zh: "案例 5", en: "Case 5" },
              id: "002_bedroom_suite",
              left:  MS3 + "viewers/astra/002_bedroom_suite/from_scratch.glb",
              right: MS3 + "viewers/astra/002_bedroom_suite/with_mira_scene.glb",
              poster: MS + "astra/05-002_bedroom_suite.png",
            },
            {
              label: { zh: "案例 6", en: "Case 6" },
              id: "Gemini_Generated_Image_ac4a5mac4a5mac4a",
              left:  MS3 + "viewers/astra/Gemini_Generated_Image_ac4a5mac4a5mac4a/from_scratch.glb",
              right: MS3 + "viewers/astra/Gemini_Generated_Image_ac4a5mac4a5mac4a/with_mira_scene.glb",
              poster: MS + "astra/06-Gemini_Generated_Image_ac4a5mac4a5mac4a.png",
            },
          ],
        },
        {
          type: "carousel",
          id: "simulation-blender",
          title: { zh: "导入 Blender 做物理仿真", en: "Blender Simulation" },
          body: {
            zh: "<p>Mira-Scene 重建出的场景可以导入仿真引擎，用于下游的交互任务。</p>",
            en: "<p>Mira-Scene scenes can be imported into simulation engines for downstream " +
                "interactive tasks.</p>",
          },
          perPage: 1,
          items: [
            { src: MS + "simulation/blender/sim1.mp4",
              caption: { zh: "<strong>重力。</strong>重力作用于重建出的场景及其中的物体。",
                         en: "<strong>Gravity.</strong> Gravity influences the reconstructed " +
                             "scene and its objects." } },
            { src: MS + "simulation/blender/sim2.mp4",
              caption: { zh: "<strong>场景编辑。</strong>可以把物体重新组织成新的布局。",
                         en: "<strong>Scene Editing.</strong> Objects can be reorganized into a " +
                             "new layout." } },
            { src: MS + "simulation/blender/sim3.mp4",
              caption: { zh: "<strong>抓取与放置。</strong>在重建场景里对物体做 pick-and-place。",
                         en: "<strong>Pick and Place.</strong> A pick-and-place task manipulates " +
                             "objects in the reconstructed scene." } },
            { src: MS + "simulation/blender/sim4.mp4",
              caption: { zh: "<strong>碰撞。</strong>物体与场景之间的碰撞交互。",
                         en: "<strong>Collision.</strong> Collision interactions are simulated " +
                             "between objects and the scene." } },
          ],
        },
        {
          type: "carousel",
          id: "simulation-isaac",
          title: { zh: "Isaac 中的机器人交互", en: "Isaac Simulation" },
          body: {
            zh: "<p>所有动作策略均由 GPT-6 Astra 生成。</p>",
            en: "<p>All action policies are generated by GPT-6 Astra.</p>",
          },
          perPage: 1,
          items: [
            { src: MS + "simulation/isaac/interaction1.mp4",
              caption: { zh: "<strong>扶正椅子。</strong>机器人把歪倒的椅子扶正，并与桌子对齐。",
                         en: "<strong>Chair Alignment.</strong> The robot straightens a tilted " +
                             "chair and aligns it parallel to the table." } },
            { src: MS + "simulation/isaac/interaction2.mp4",
              caption: { zh: "<strong>拉出椅子。</strong>机器人把餐椅从桌下拉出，方便落座。",
                         en: "<strong>Chair Pull-Out.</strong> The robot pulls a dining chair away " +
                             "from the table to make it accessible for sitting." } },
            { src: MS + "simulation/isaac/interaction3.mp4",
              caption: { zh: "<strong>堆叠边桌。</strong>机器人整理闲置家具，" +
                             "把边桌叠放到软凳上。",
                         en: "<strong>Side-Table Stacking.</strong> The robot organizes unused " +
                             "furniture by stacking a side table on top of an ottoman." } },
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
      title: {
        zh: "Stereo World Model：相机可控的*立体视频生成*",
        en: "Stereo World Model: Camera-Guided *Stereo Video Generation*",
      },
      short: "StereoWorld",
      subtitle: {
        zh: "用 StereoWorld 以立体视角探索世界 —— 在相机控制下生成视角一致的立体视频。",
        en: "Explore the world in stereo with StereoWorld, a model that generates " +
            "view-consistent stereo videos with camera controls.",
      },
      venue: "CVPR 2026",
      date: "2026-06",
      thumb: TH + "stereo-world.jpg",
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
        { zh: "香港大学", en: "The University of Hong Kong" },
        "VAST",
        { zh: "字节跳动 Pico", en: "ByteDance Pico" },
      ],
      authorNotes: {
        zh: "† 项目负责人　✉ 通讯作者",
        en: "† Project Lead　✉ Corresponding Author",
      },

      links: [
        { label: "arXiv", href: "https://arxiv.org/abs/2603.17375", icon: "arxiv" },
        { label: { zh: "代码", en: "Code" },
          href: "https://github.com/VAST-AI-Research/StereoWorld", icon: "github" },
        { label: { zh: "模型", en: "Model" },
          href: "https://huggingface.co/Yang-Tian/StereoWorld", icon: "hf" },
      ],

      teaser: {
        src: SW + "videos/demo.mp4",
        poster: SW + "images/teaser.jpg",
        caption: {
          zh: "StereoWorld 从单张 RGB 图像出发，在 WASD 式相机控制下生成立体视频。",
          en: "StereoWorld generates camera-guided stereo video from a single RGB image " +
              "with WASD-style camera controls.",
        },
      },

      abstract: {
        zh: "我们提出 StereoWorld —— 一个能够基于给定初始观测进行探索的立体世界模型，" +
            "它生成的立体视频具备视角一致性和内在的几何理解能力。模型支持 WASD 式的相机控制" +
            "（平移、偏航、俯仰），并同时提供灵活立体模式（左右相机独立控制）" +
            "和固定基线立体模式。",
        en: "We introduce StereoWorld, a stereo world model capable of exploration " +
            "from a given initial observation, generating view-consistent stereo videos with " +
            "intrinsic geometric understanding. The model supports WASD-style camera controls " +
            "for translation, yaw, and pitch, with both flexible stereo (independent left/right " +
            "camera control) and fixed-baseline stereo modes.",
      },

      sections: [
        {
          type: "figure",
          id: "motivation",
          title: { zh: "动机", en: "Motivation" },
          body: {
            zh: "<ul>" +
                "<li><strong>立体视觉</strong> —— 许多生物系统主要依赖的感知机制 —— " +
                "能直接、稳健地提供三维场景结构的几何线索。</li>" +
                "<li>与 RGB-D 方案相比，它无需生成和稳定显式的度量深度图，" +
                "同时仍保留了强几何信号。</li>" +
                "</ul>",
            en: "<ul>" +
                "<li><strong>Stereo vision</strong> — the dominant perceptual mechanism in many " +
                "biological systems — provides direct, robust geometric cues to 3D scene structure.</li>" +
                "<li>Compared to RGB-D systems, it avoids producing and stabilizing explicit " +
                "metric depth maps while retaining strong geometric signals.</li>" +
                "</ul>",
          },
          src: SW + "videos/motivation.mp4",
        },
        {
          type: "figure",
          id: "pipeline",
          title: { zh: "方法", en: "Pipeline" },
          src: SW + "images/pipeline.jpg",
          caption: {
            zh: "<strong>StereoWorld 总览。</strong>给定一对立体图像和一条条件相机轨迹，" +
                "StereoWorld 首先用统一的相机–帧 RoPE 表示，对来自不同视角和时间步的" +
                "条件隐变量与带噪隐变量进行编码；随后通过配备立体注意力的 DiT 进行去噪，" +
                "最终产生立体视频。",
            en: "<strong>Illustration of StereoWorld.</strong> Given a pair of stereo images and " +
                "a conditional camera trajectory, StereoWorld first encodes conditional and noisy " +
                "video latents from different viewpoints and timesteps using a unified " +
                "camera–frame RoPE representation. It then performs denoising through a DiT " +
                "equipped with stereo attention, ultimately producing the final stereo video.",
          },
        },
        {
          type: "carousel",
          id: "stereo-video",
          title: { zh: "固定基线立体", en: "Fixed-Baseline Stereo" },
          perPage: 2,
          items: [
            { src: SW + "stereo_video/varied_scene_004_lakeside_balcony_w_j_l_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_006_volcano_crater_dj_wk_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_011_underground_river_arch_w_wl_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_012_floating_islands_dj_wk_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_021_snowy_mountain_road_w_wk_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_022_minimal_gallery_w_j_l_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_028_rice_terraces_dj_wk_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_034_tea_house_window_w_j_l_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_037_northern_lights_cabin_w_wl_wj_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_044_music_studio_w_j_l_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_059_hospital_operating_room_w_j_l_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_067_old_europe_square_w_wl_wj_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_071_glacier_lagoon_w_wl_wj_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_073_children_playroom_w_j_l_demo.mp4" },
            { src: SW + "stereo_video/varied_scene_074_coastal_tunnel_road_w_wk_demo.mp4" },
          ],
        },
        {
          type: "carousel",
          id: "stereo-depth",
          title: { zh: "立体深度", en: "Stereo Depth" },
          body: {
            zh: "<span style='white-space:nowrap'>每段视频左侧是<strong>立体视频</strong>，" +
                "右侧是对应的<strong>深度估计</strong>。</span>",
            en: "<span style='white-space:nowrap'>Each video shows <strong>stereo video (left)" +
                "</strong> side-by-side with the corresponding <strong>depth estimation (right)" +
                "</strong>.</span>",
          },
          perPage: 2,
          items: [
            { src: SW + "stereo_depth/stereo_video1_with_disp_vis1.mp4" },
            { src: SW + "stereo_depth/stereo_video2_with_disp_vis2.mp4" },
          ],
        },
        {
          type: "carousel",
          id: "flex-demo",
          title: { zh: "灵活立体", en: "Flexible Stereo" },
          body: {
            zh: "灵活立体模式支持左右相机独立控制，右相机有四种模式：" +
                "汇聚、水平偏移、深度偏移、高度偏移。",
            en: "Flexible stereo mode supports independent left/right camera control with four " +
                "right-camera modes: converging, horizontal offset, depth offset, height offset.",
          },
          perPage: 2,
          items: [
            { src: SW + "flex_demo/flex_converging_prompt_00117_demo.mp4",
              caption: { zh: "汇聚", en: "Converging" } },
            { src: SW + "flex_demo/flex_converging_prompt_01290_demo.mp4",
              caption: { zh: "汇聚", en: "Converging" } },
            { src: SW + "flex_demo/flex_converging_prompt_05539_demo.mp4",
              caption: { zh: "汇聚", en: "Converging" } },
            { src: SW + "flex_demo/flex_converging_prompt_09641_demo.mp4",
              caption: { zh: "汇聚", en: "Converging" } },
            { src: SW + "flex_demo/flex_depth_offset_prompt_03814_demo.mp4",
              caption: { zh: "深度偏移", en: "Depth Offset" } },
            { src: SW + "flex_demo/flex_depth_offset_prompt_05313_demo.mp4",
              caption: { zh: "深度偏移", en: "Depth Offset" } },
            { src: SW + "flex_demo/flex_depth_offset_prompt_02664_demo.mp4",
              caption: { zh: "深度偏移", en: "Depth Offset" } },
            { src: SW + "flex_demo/flex_depth_offset_prompt_07517_demo.mp4",
              caption: { zh: "深度偏移", en: "Depth Offset" } },
            { src: SW + "flex_demo/flex_height_offset_prompt_02504_demo.mp4",
              caption: { zh: "高度偏移", en: "Height Offset" } },
            { src: SW + "flex_demo/flex_height_offset_prompt_02927_demo.mp4",
              caption: { zh: "高度偏移", en: "Height Offset" } },
            { src: SW + "flex_demo/flex_height_offset_prompt_04808_demo.mp4",
              caption: { zh: "高度偏移", en: "Height Offset" } },
            { src: SW + "flex_demo/flex_height_offset_prompt_08317_demo.mp4",
              caption: { zh: "高度偏移", en: "Height Offset" } },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_03257_demo.mp4",
              caption: { zh: "水平偏移", en: "Horizontal Offset" } },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_04506_demo.mp4",
              caption: { zh: "水平偏移", en: "Horizontal Offset" } },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_06924_demo.mp4",
              caption: { zh: "水平偏移", en: "Horizontal Offset" } },
            { src: SW + "flex_demo/flex_horizontal_offset_prompt_08785_demo.mp4",
              caption: { zh: "水平偏移", en: "Horizontal Offset" } },
          ],
        },
        {
          type: "carousel",
          id: "ar-distillation",
          title: { zh: "自回归长视频蒸馏", en: "Autoregressive Long Video Distillation" },
          body: {
            zh: "通过 self-forcing 蒸馏训练出的 4 步自回归学生模型，" +
                "可以生成超出单段帧数预算的长序列。",
            en: "A 4-step autoregressive student model trained via self-forcing distillation " +
                "generates extended sequences beyond the single-clip frame budget.",
          },
          // 示意图单独走 figure 字段，不要写进 body 的 HTML 串里 ——
          // body 渲染进限宽 68ch 的盒子，图塞进去会被压窄并偏左。
          figure: {
            src: SW + "images/distillation.jpg",
            alt: { zh: "蒸馏过程的注意力掩码", en: "Attention mask in distillation" },
            caption: {
              zh: "蒸馏过程中的注意力掩码配置。",
              en: "Attention mask configuration in the distillation process.",
            },
            width: "30rem",
          },
          perPage: 2,
          items: [
            { src: SW + "ar_demo/custom_varied_021.mp4" },
            { src: SW + "ar_demo/custom_varied_022.mp4" },
            { src: SW + "ar_demo/custom_varied_059.mp4" },
          ],
        },
        {
          type: "carousel",
          id: "inpaint-demo",
          title: { zh: "视角补全", en: "View Inpainting" },
          body: {
            zh: "给定一段固定的参考视频，生成对应的另一个视角。<br>" +
                "每段片段依次为：参考 | 视角 1 | 视角 2。",
            en: "Given a fixed reference video, generate the corresponding view from another " +
                "camera.<br>Each clip shows: reference | View 1 | View 2.",
          },
          // 2-fixed：这些片段本身已经是三路并排拼接，塌成一列会看不清
          perPage: 2,
          items: [
            { src: SW + "inpaint_demo/shard_01_teacher_cfg5.0_steps50_0000_seed1_concat.mp4" },
            { src: SW + "inpaint_demo/shard_02_teacher_cfg5.0_steps50_0000_seed1_concat.mp4" },
            { src: SW + "inpaint_demo/shard_02_teacher_cfg5.0_steps50_0009_seed1_concat.mp4" },
            { src: SW + "inpaint_demo/shard_02_teacher_cfg5.0_steps50_0012_seed1_concat.mp4" },
            { src: SW + "inpaint_demo/shard_04_teacher_cfg5.0_steps50_0002_seed1_concat.mp4" },
            { src: SW + "inpaint_demo/shard_04_teacher_cfg5.0_steps50_0003_seed1_concat.mp4" },
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
      title: {
        zh: "把训练吞吐拉高 2 倍：一次不那么体面的调优记录",
        en: "Doubling Training Throughput: A Not-So-Dignified Tuning Log",
      },
      short: { zh: "训练吞吐调优记录", en: "Throughput tuning log" },
      subtitle: {
        zh: "从 profiler 截图到最后那个一行修复，中间踩的坑比结论有意思。",
        en: "From the profiler screenshot to the one-line fix — the potholes are more " +
            "interesting than the conclusion.",
      },
      date: "2026-07",
      thumb: "assets/placeholder/tile-2.svg",
      author: { zh: "张三", en: "First Author" },
      readingTime: { zh: "8 分钟", en: "8 min read" },
      teaser: {
        src: "assets/placeholder/teaser-b.svg",
        caption: { zh: "占位图：profiler 时间线。", en: "Placeholder: the profiler timeline." },
      },
      abstract: {
        zh: "摘要/导语占位。博客的 abstract 会当作导语渲染，比论文摘要短一些比较好。",
        en: "Placeholder lede. For posts the abstract renders as an intro — keep it shorter " +
            "than a paper abstract.",
      },
      sections: [
        {
          type: "text",
          id: "background",
          title: { zh: "问题是怎么发现的", en: "How we noticed" },
          body: {
            zh: "正文段落占位。可以写 <b>加粗</b>、<code>代码</code>、<a href='#'>链接</a>。",
            en: "Placeholder paragraph. Supports <b>bold</b>, <code>code</code>, and " +
                "<a href='#'>links</a>.",
          },
        },
        {
          type: "steps",
          id: "what-we-tried",
          title: { zh: "试过的几条路", en: "What we tried" },
          items: [
            {
              title: { zh: "先看 profiler", en: "Start with the profiler" },
              body: {
                zh: "<code>torch.profiler</code> 打出来的时间线。",
                en: "The timeline from <code>torch.profiler</code>.",
              },
            },
            {
              title: { zh: "改 dataloader", en: "Tune the dataloader" },
              body: {
                zh: "worker 数和 prefetch 的取舍。",
                en: "Trading off worker count against prefetch depth.",
              },
            },
            {
              title: { zh: "最后那个一行修复", en: "The one-line fix" },
              body: {
                zh: "其实是 <code>pin_memory</code> 没开。",
                en: "Turns out <code>pin_memory</code> was off the whole time.",
              },
            },
          ],
        },
        {
          type: "table",
          id: "numbers",
          title: { zh: "前后对比", en: "Before and after" },
          columns: [
            { zh: "配置", en: "Config" },
            "samples/s ↑",
            { zh: "显存 ↓", en: "Memory ↓" },
          ],
          rows: [
            [{ zh: "改之前", en: "Before" }, "142", "38.2 GB"],
            [{ zh: "改之后", en: "After" }, "301", "23.6 GB"],
          ],
          highlightRows: [1],
        },
      ],
    },
    {
      id: "post-eval-harness",
      title: {
        zh: "我们为什么自己写了一套评测框架",
        en: "Why We Wrote Our Own Eval Harness",
      },
      short: { zh: "自建评测框架", en: "Our own eval harness" },
      subtitle: {
        zh: "现成的方案在多模态输入上都差一点，最后差的那点决定了要不要重写。",
        en: "Every off-the-shelf option fell slightly short on multimodal inputs — and that " +
            "slight shortfall decided it.",
      },
      date: "2026-05",
      thumb: "assets/placeholder/tile-3.svg",
      author: { zh: "李四", en: "Second Lead" },
      readingTime: { zh: "5 分钟", en: "5 min read" },
      abstract: {
        zh: "第二篇博客占位。只有 abstract 和一个 text section，最小结构。",
        en: "Second placeholder post. Just an abstract and one text section — minimal structure.",
      },
      sections: [
        {
          type: "text",
          id: "why",
          title: { zh: "起因", en: "The trigger" },
          body: { zh: "正文占位。", en: "Placeholder body text." },
        },
      ],
    },
  ],
};
