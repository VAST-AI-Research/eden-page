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
      // hidden: 不进 header 导航、也不在首页出现。数据和路由都留着，
      // ?s=project / ?p=<id> 仍然能直达 —— 内容还是占位的，先不对外露入口。
      // 想放出来就删掉这一行。
      hidden: true,
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
   * 字段和 papers[] 完全一样，用不到的删掉即可。
   * 下面两条都是占位内容，替换成真实项目。 */
  projects: [
    {
      id: "mira-world-sim",
      title: {
        zh: "Mira World Sim：一个*可交互*的世界模拟器（占位）",
        en: "Mira World Sim: An *Interactive* World Simulator (placeholder)",
      },
      short: "World Sim",
      subtitle: {
        zh: "给定一帧画面和一串动作，预测世界接下来会变成什么样。",
        en: "Given a frame and a stream of actions, predict what the world does next.",
      },
      date: "2026-08",
      thumb: "assets/placeholder/tile-1.svg",
      keywords: ["world model", "world simulation", "interactive generation"],

      authors: [
        { name: "Zehuan Huang", url: "https://x.com/huanngzh", affil: [1] },
        { name: { zh: "合作者", en: "Collaborator" }, url: "#", affil: [1] },
      ],
      affiliations: ["Eden"],

      links: [
        { label: { zh: "在线演示", en: "Demo" }, href: "#", icon: "demo" },
        { label: { zh: "代码", en: "Code" }, href: "#", icon: "github" },
        { label: { zh: "模型", en: "Model" }, href: "#", icon: "hf" },
      ],

      teaser: {
        src: "assets/placeholder/teaser-a.svg",
        caption: {
          zh: "Teaser 占位：换成一段交互录屏，说明用户输入什么、模型输出什么。",
          en: "Placeholder teaser: swap in a screen recording showing input actions and " +
              "the model's response.",
        },
      },

      highlights: [
        { value: "30 FPS", label: { zh: "交互帧率", en: "interactive" } },
        { value: "60s", label: { zh: "可持续时长", en: "rollout length" } },
        { value: "720p", label: { zh: "输出分辨率", en: "output" } },
      ],

      abstract: {
        zh: "项目介绍占位。说清这个系统能做什么、谁用得上、怎么上手。" +
            "项目页和论文页的区别是：读者更关心能不能跑起来，所以把 demo、" +
            "安装步骤、限制条件写在前面。",
        en: "Placeholder project intro. Say what the system does, who it is for, and how to " +
            "start using it. Unlike a paper page, readers here mostly want to know whether " +
            "they can run it — so lead with the demo, the install steps, and the limits.",
      },

      sections: [
        {
          type: "features",
          id: "capabilities",
          eyebrow: { zh: "能做什么", en: "What it does" },
          title: { zh: "应用场景", en: "Where It Applies" },
          items: [
            {
              title: { zh: "游戏", en: "Gaming" },
              body: {
                zh: "把玩家操作直接喂给模型，生成可玩的场景演化。",
                en: "Feed player input straight to the model and get playable scene dynamics.",
              },
              icon: "spark",
            },
            {
              title: { zh: "机器人仿真", en: "Robotics simulation" },
              body: {
                zh: "在真实机器人之前，先在预测出的世界里试策略。",
                en: "Try policies in a predicted world before touching real hardware.",
              },
              icon: "bolt",
            },
            {
              title: { zh: "视频生成", en: "Video synthesis" },
              body: {
                zh: "长时序一致的视频，靠的是世界状态而不是逐帧硬凑。",
                en: "Long-horizon consistent video, driven by world state rather than " +
                    "frame-by-frame guesswork.",
              },
              icon: "video",
            },
            {
              title: { zh: "具身智能", en: "Embodied intelligence" },
              body: {
                zh: "给智能体一个可以规划的内部世界。",
                en: "Give an agent an internal world it can plan against.",
              },
              icon: "check",
            },
          ],
        },
        {
          type: "figure",
          id: "system",
          eyebrow: { zh: "系统", en: "How it works" },
          title: { zh: "系统结构", en: "System" },
          body: {
            zh: "一到两段说清数据流。可以在文字里用 <b>加粗</b> 强调关键模块，" +
                "也可以写 <code>符号</code>。",
            en: "One or two paragraphs on the data flow. You can <b>bold</b> key modules and " +
                "write <code>symbols</code> inline.",
          },
          src: "assets/placeholder/method.svg",
          caption: {
            zh: "图 1：结构占位图。左到右：观测 → 状态编码 → 动作条件预测 → 渲染。",
            en: "Figure 1: placeholder diagram. Left to right: observation → state encoder → " +
                "action-conditioned prediction → renderer.",
          },
        },
        {
          type: "steps",
          id: "usage",
          title: { zh: "快速开始", en: "Get Started" },
          body: { zh: "三步跑起来。", en: "Running in three steps." },
          items: [
            { title: { zh: "安装", en: "Install" }, body: "<code>pip install -e .</code>" },
            {
              title: { zh: "下载权重", en: "Download weights" },
              body: "<code>bash scripts/download.sh</code>",
            },
            {
              title: { zh: "运行", en: "Run" },
              body: "<code>python demo.py --scene kitchen</code>",
            },
          ],
        },
        {
          type: "text",
          id: "limitations",
          title: { zh: "已知限制", en: "Limitations" },
          body: {
            zh: "占位：把不擅长的场景、失败模式、算力要求老实写在这里 —— " +
                "项目页最有用的一节往往是这一节。",
            en: "Placeholder: be upfront about failure modes, unsupported scenes, and compute " +
                "requirements. On a project page this is often the most useful section.",
          },
        },
      ],
    },

    {
      id: "mira-sim-bench",
      title: {
        zh: "Mira Sim Bench：世界模型的*评测套件*（占位）",
        en: "Mira Sim Bench: An *Evaluation Suite* for World Models (placeholder)",
      },
      short: "Sim Bench",
      subtitle: {
        zh: "统一的场景、动作序列和指标，用来比较不同世界模型的预测质量。",
        en: "Shared scenes, action traces, and metrics for comparing world-model predictions.",
      },
      date: "2026-04",
      thumb: "assets/placeholder/tile-3.svg",
      keywords: ["benchmark", "world model", "evaluation"],

      authors: [{ name: { zh: "占位作者", en: "Placeholder Author" }, url: "#", affil: [1] }],
      affiliations: ["Eden"],

      links: [
        { label: { zh: "代码", en: "Code" }, href: "#", icon: "github" },
        { label: { zh: "数据", en: "Data" }, href: "#", icon: "data" },
      ],

      teaser: { src: "assets/placeholder/teaser-b.svg" },

      abstract: {
        zh: "第二个项目占位。只填了必要字段：没有 highlights、没有 bibtex，页面会自动" +
            "少掉这几块，不需要动 HTML。",
        en: "Second placeholder project — minimal fields only. No highlights, no BibTeX; " +
            "those blocks simply disappear, no HTML changes needed.",
      },

      sections: [
        {
          type: "table",
          id: "tasks",
          title: { zh: "包含的任务", en: "Tasks" },
          body: { zh: "占位表格。", en: "Placeholder table." },
          columns: [
            { zh: "任务", en: "Task" },
            { zh: "场景数", en: "Scenes" },
            { zh: "时长", en: "Horizon" },
          ],
          rows: [
            [{ zh: "室内导航", en: "Indoor navigation" }, "120", "10s"],
            [{ zh: "桌面操作", en: "Tabletop manipulation" }, "80", "5s"],
            [{ zh: "开放场景驾驶", en: "Open-world driving" }, "60", "20s"],
          ],
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
                "reconstruction with Astra for building background (right); Mira-Scene " +
                "delivers stronger image consistency. " +
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
        en: "We introduce StereoWorld, a stereo world model capable of performing exploration " +
            "based on given initial observation, generating view-consistent stereo videos with " +
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
              en: "Attention mask configuration in distillation process.",
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
            en: "Given a fixed reference video, generate the corresponding another view. <br> " +
                "Each clip shows: reference | View 1 | View 2.",
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
