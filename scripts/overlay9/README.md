# overlay9 — 九个游戏的 UI / action overlay

给 `artifacts/edenlive-aligned/` 里挑出的九条 proxy-fine 视频，各自设计一套
贴合玩法的 HUD 和键鼠 action overlay，输出统一规格的叠加视频。

```
/tmp/ovenv/bin/python scripts/overlay9/render.py              # 全部九条
/tmp/ovenv/bin/python scripts/overlay9/render.py --only 051,081
/tmp/ovenv/bin/python scripts/overlay9/render.py --stills 4   # 只出拼图，快
/tmp/ovenv/bin/python scripts/overlay9/render.py --source proxy

/tmp/ovenv/bin/python scripts/overlay9/audit.py               # 查安全边距
```

**叠加的是 fine（生成结果），不是 proxy。** `artifacts/edenlive-aligned/<案例>/`
下 `proxy-*.mp4` 是 Three.js 录屏，另一个才是 fine。`clips.py` 的
`resolve_source()` 默认取 fine，`--source proxy` 可以切回去对比。

改完任何布局跑一下 `audit.py`：它逐帧查 overlay 的 alpha 通道，报告有没有元素
伸进 52px 安全边距（滑入动画和满屏白闪会自动放行）。

产物在 `artifacts/overlay9/`：九条 `NNN-slug-overlay.mp4` 加一个 `index.html`
（九宫格对照页，可一键全部播放）。依赖只有 Pillow 和 ffmpeg，装在 `/tmp/ovenv`。

## 分辨率怎么对齐的

九条片源有两种形状，**都是同一个 1280×720 状态画布的裁剪**，这点是量出来的，
不是猜的（拿 `original.mp4` 和 proxy 逐帧比 MAE）：

| 片源 | 实际规格 | 与 1280×720 画布的关系 | 实测 MAE |
|---|---|---|---|
| `wan22-720p` | 1280×704 / 24fps | 精确 center crop，画布第 8..712 行 | 0.83（crop）vs 2.56（squeeze） |
| `wan21-14b-480p` | 832×480 / 16fps | 画布裁 1220×704 后压扁 | 4.13（crop）vs 更高 |

所以**统一归一化到 1280×704 / 24fps**：720p 的只需要 conform 帧率；480p 的先
center crop 到 832×458（正好 1280:704 的比例），再放大。这样九条的 overlay
可以共用一套坐标系，`geom.py` 里 `T_720` / `T_480` 两个仿射变换负责把画布坐标
映射到输出像素。

验证方式：用 Flappy 的 Canvas2D 已知坐标（鸟固定在 x=350，地面 y=654）反推，
地面线和管道框都能精确套上视频；三维场景则用 `state.json` 存的相机矩阵投影
蜘蛛世界坐标，标记准确落在蜘蛛身上（`projectionMatrix` 是列主序，要转置）。

## 设计原则

参考流行游戏 HUD 的做法，几条贯穿九套设计的规则：

**不用半透明蒙版。** 文字和图形靠 `D.display()` 的「发光 + 硬描边 + 填色」三层
来保证任何背景下都看得清，而不是垫一块灰板子。描边只花几个像素，蒙版要花掉
整个矩形。只有真正需要凹槽的部件（血条、仪表盘底、声呐镜面）才留底色。

**安全边距。** `geom.py` 里的 `SAFE = 52`，九套 UI 全部排在这个内缩区里，
任何元素都不碰画面边缘。

**单人游戏的输入统一放底部正中。** `input_cluster()` 负责画这一排，键帽是
带倒角和高光的实体造型，按下时填色下沉并发光；鼠标键（LMB）顶部有分割线，
和键盘键区分。两个对打游戏是双人，输入只能分到左右下角。

**当前动作用艺术字从顶部滑入。** `action_callout()`：从画面上方滑进安全区
顶部，带发光描边和一条随动的下划线，停一下再淡出。不占常驻位置。

## 九套设计

| | 游戏 | 设计要点 |
|---|---|---|
| 029 | Flappy Bird | 街机式大分数；右侧**高度轨**把下一根管道的缺口画成方括号窗口，鸟对准时标记变绿；拍翅有扩散环和上升气流刻度；底部中央 SPACE |
| 051 | 两人对打 | **斜切血条**（平行四边形，向中间倾），命中后 8 帧**受伤残影**；血量低于 28% 边框脉动红；回合计时；双人按键分列左右下角 |
| 057 | 激烈格斗 | 分段斜切血条 + **SUPER 槽**（满了闪 READY）+ **连击数**；招式名用滑入艺术字；K.O. 白闪 + 发光大字 |
| 059 | 哥斯拉 | 原子吐息是**分段线圈**，喷火时逐格点亮并脉动（数据里 BREATH 是二值，所以不做进度条）；右上**城市破坏**塔楼图逐个塌成废墟 |
| 068 | 小潜艇 | **声呐镜**只在圆内压一层暗底，像个真镜片；章鱼/宝箱光点带发光和回波环，出圈会贴边并指向外侧；**任务清单移到右上**，完成打勾、进行中脉动；右下机械爪 GRIP/LIFT 双表加爪形图标 |
| 076 | 无人机 | 航向带 + 三位数航向；中央**机翼准星**随横滚倾斜；右侧遥测（单位放数值左侧，避免压字）；底部横滚标尺 |
| 080 | 汽车穿林 | **指针速度表**含红区和发光进度弧；**方向盘**随 DRIFT 轴转；顶部赛段进度；漂移超阈值滑出红色艺术字 |
| 081 | 洞穴劈砍 | 动态准星（挥砍时张开）；**世界坐标锚定**的蜘蛛血点（倒三角 + 血格，随距离缩放）；劈中冲击环；右下武器状态 |
| 088 | 冰冻枪 | **六角雪花准星**随 FREEZE 的 progress 张开长冰刺；左侧冷冻罐；左上**冰台路径**九颗晶体逐个点亮并连成轨迹；底部中央 LMB / SPACE |

## 数据从哪来

`overlay-data.json` 提供 hud / controls / actions / events（720 帧 @24fps，与
视频时间轴对齐）。`state.json` 提供实体和相机，但有的大到 192 MB，所以
`prepare.py` 只抽每套设计真正用到的字段，缓存成 `artifacts/overlay9/prepared/`
下的小 JSON。两个对打的血条额外派生了 `trail`（滞后 8 帧，做残影）和 `super`
（按命中数充能）——这两个是显示模型，和数据里原本的 health 模型一样属于
`ui-authored`，不是录下来的真实输入。

改完 `prepare.py` 的抽取逻辑要删 `prepared/` 重跑，它不会自动失效。

## 注意

- Arial 没有 ◀ ▶ 这类三角字形，会画成空心 `.notdef` 方框；移动键的箭头是
  `_tri()` 画的多边形。同理 `°` 在 Avenir Condensed 里有但基线偏高，正文里
  一律写 `DEG`。
- `drawbase.D.text()` 的 `track`（字间距）会让实际宽度大于 `getlength()`，
  所以居中/右对齐要用 `tracked_w()` 量，否则所有加了字距的居中标签都会右偏。
- `D.display()` 的描边是 8 向偏移叠字，不是真 stroke；`ow` 调大会变慢，
  因为每级要画 8 遍。发光（`glow=`）走一次高斯模糊图层，更贵，只用在重点元素上。
- 九条 fine 视频是重新生成的写实画面，和 proxy 的 low-poly 完全不同（MAE 29~60）。
  配色要照 fine 挑：比如 029 的场景是暖棕苔绿，所以 accent 用冷青色才分得开。
- **窄列上的居中标签是边距越界的主要来源。** 像「ATOMIC BREATH」这种 117px 的
  标签，如果 `anchor="ma"` 居中在 28px 宽的仪表柱上，会往左溢出 34px。竖条形
  部件的标签一律贴 `SAFE_L` / `SAFE_R` 左右对齐，不要居中在柱子上。
- 高斯发光会把墨迹往外扩散约一个 radius，所以贴边部件的发光会渗进边距。
  `glow_shape()` 默认 `clip_safe=True` 把发光裁在安全框内；文字发光
  （`display(glow=...)`）不裁，因为滑入动画本来就要穿过上边缘。
