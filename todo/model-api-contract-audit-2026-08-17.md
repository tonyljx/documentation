# 模型 API 参数与文档契约审计 TODO

> 审计日期：2026-08-17
> 后端快照：`gin-ai-api@7d78852`（`ai-dev`）
> 文档基线：`wizzx-doc@a944ea0`（另包含当前工作区未提交的 Agent 媒体生成指南）
> 范围：后端注册的 23 个模型、公开 `/pricing`、鉴权、提交、状态查询、错误响应、双语模型页、双语 endpoint 页与 OpenAPI。

> **实施进度（同日更新）**：文档侧公开 Schema 修复已完成：14 个公开模型均有 submit path；新增 `/pricing`、积分余额、共享 submit/status/error 响应；补齐 Runway、Nano Banana 2、Nano Banana 2 Lite、GPT Image 2 双语 endpoint；同步修正 Veo、Seedance、Kling、Seedream、Nano Banana Pro、Runway 与 TTS 的高风险公开页面。下文保留审计时发现的原始问题，后端 binding 冲突、Hidden 模型治理与旧版兼容页仍是后续 TODO。

## 原始审计结论（Schema 修复前）

本轮已逐个审查后端注册的 **23/23 个模型**：13 个图片、8 个视频、2 个音频。其中 `/pricing` 公开 14 个，`Hidden` 9 个。

按每个模型的最高风险统计：**P0 9 个、P1 12 个、P2 2 个**。其中直接影响当前公开调用的 P0 有 5 个：`nano-banana-pro`、`veo3`、`seedance-pro-fast`、`seedance-1.5-pro`、`kling-ai`。

修复前的文档不是简单的少量文案过时，而是存在三类契约问题：

1. **照文档构造的请求会失败**：Veo、Seedance、Kling、Virtual Try-On、WAN22 等页面与后端 binding/DTO 不一致。
2. **计费披露严重漂移**：Nano Banana Pro 仍写 `10/10/20`，后端实际为 `108/108/144`；Seedream endpoint、多个旧 Flux 页面也沿用旧价格。
3. **机器可读契约不完整**：4 个公开模型缺 OpenAPI submit path；任务状态、成功响应、错误响应、`/pricing` 与余额接口未按真实后端建模。

审计阶段只做 TODO 拆分，未修改后端行为。文档侧的当前修复进度见顶部“实施进度”；下方未勾选项保留为原始审计记录，其中同时包含已修文档项和仍待处理的后端项。

### 严重程度

- **P0 阻断**：正常文档请求会失败、价格严重错误，或会让自动化客户端做出危险决策。
- **P1 高**：公开参数、枚举、响应或 OpenAPI 显著不完整/过时；参数可能被静默忽略。
- **P2 中**：默认值、边界条件、生命周期或表述没有后端保证。
- **P3 低**：内部诊断字段、示例 ID、描述一致性等治理项。

## P0：先修这些阻断项

- [ ] **修复 Nano Banana Pro 全站价格**：文档仍为 `10/10/20`，后端为 1K=`108`、2K=`108`、4K=`144`。涉及中英文 model、endpoint、pricing 和 OpenAPI。
- [ ] **拆除 `BaseVideoParams` 的错误通用枚举**：它在模型 `Validate()` 前拒绝 Seedance 的 `480p` 与 Seedance 1.5 的 `duration=-1`。见后端 `internal/dto/base_params.go:66-73`、`internal/handler/task_handler.go:60-80`。
- [ ] **修复 Veo 请求契约**：`type` 实际必填；真实 `model` 只有 `veo3_fast`；补 `duration=4|6|8` 和仅 `720p`，删除旧 `generation_type`、`veo3`、`veo3.1_fast`。
- [ ] **重写 Seedance Pro Fast endpoint**：旧字段 `mode`、`input_image_url` 改为 `type`、`image_urls`，并修复后端 `480p` binding 冲突。
- [ ] **修复 Seedance 1.5 Pro HTTP 合同**：使文档公开的 `480p`、`duration=-1` 真能通过 binding，并为 handler 路径加测试。
- [ ] **重写 Kling endpoint 与模型枚举**：旧 `mode`、`image` 无效；`type`、`quality_mode` 必填；`kling-v2-master` 应为 `kling-v2-1-master`。
- [ ] **决定并修复 Virtual Try-On 的 prompt 契约**：页面声称不需要 prompt，但 `BaseTaskParams` 会先行要求非空 prompt。
- [ ] **决定并修复 WAN22 的 prompt 契约**：模型设计和文档均无需 prompt，当前公共基类导致请求直接失败。
- [ ] **隐藏 legacy 的阻断错误**：`flux-pro-1-1` 是不存在的 model key；WAN 2.6 文档允许 5000，后端最大 1500。

## 契约来源与审查口径

本报告按以下优先级判断“当前真实合同”：

1. Handler 的 `ShouldBindJSON` 与 HTTP 路径；
2. 模型 DTO 的 `Validate()`、默认值、`ToProviderPayload()`；
3. `CalculateCredits()`、`PublicCatalog()` 与实时 `GET /pricing`；
4. Adapter 实际发送/解析的字段；
5. 最后才是模型页、endpoint 页与 OpenAPI。

如果 1–4 之间互相冲突，本报告标记为**后端契约缺陷**，不通过单纯改文档掩盖。

## 23 个模型覆盖总表

| 类别 | `model_key` | 公开状态 | 当前文档覆盖 | 最高级别 | 结论 |
|---|---|---:|---|---:|---|
| 图片 | `flux-pro` | Hidden | 双语 model；无 endpoint/OpenAPI | P0 | 页面使用不存在的 `flux-pro-1-1`，并披露无效字段 |
| 图片 | `flux-kontext-pro` | Hidden | 双语 model/endpoint/OpenAPI | P1 | webhook、价格、默认值和 safety=0 漂移 |
| 图片 | `flux-kontext-max` | Hidden | 双语 model/endpoint/OpenAPI | P1 | webhook 被 Adapter 丢弃，价格与 safety=0 漂移 |
| 图片 | `flux-2-pro` | Hidden | 双语 model/endpoint/OpenAPI | P1 | endpoint 固定价格错误，真实按 MP 计费 |
| 图片 | `flux-2-flex` | Hidden | 双语 model/endpoint/OpenAPI | P1 | endpoint 固定价格错误，多个默认值未由网关保证 |
| 图片 | `seedream-4` | Public | 双语 model/endpoint/OpenAPI | P1 | endpoint 价格规则过时，seed 范围未实际校验 |
| 图片 | `seedream-4.5` | Public | 双语 model/endpoint/OpenAPI | P1 | endpoint 价格规则过时 |
| 图片 | `nano-banana-pro` | Public | 双语 model/endpoint/OpenAPI | P0 | 全站价格严重低报，resolution 默认说明内部冲突 |
| 图片 | `nano-banana` | Public | 双语 model/endpoint/OpenAPI | P1 | model/OpenAPI 的 prompt 上限与 jpg 枚举错误 |
| 图片 | `nano-banana-2` | Public | 双语 model；无 endpoint/OpenAPI | P1 | 主参数基本正确，但公开机器契约缺失 |
| 图片 | `nano-banana-2-lite` | Public | 双语 model；无 endpoint/OpenAPI | P1 | 主参数基本正确，但公开机器契约缺失 |
| 图片 | `virtual-try-on` | Hidden | 双语 model/endpoint/OpenAPI | P0 | 文档省略的 prompt 被后端强制要求 |
| 图片 | `gpt-image-2` | Public | 仅当前 Agent 指南 snippet | P1 | 无双语 model、endpoint、OpenAPI、pricing 静态页条目 |
| 视频 | `runway-gen3` | Public | 双语 model；无 endpoint/OpenAPI | P1 | 缺机器契约，漏 fps，响应/状态示例过时 |
| 视频 | `veo3` | Public | 双语 model/endpoint/OpenAPI/Agent schema | P0 | type、model、duration、resolution 均与旧文档冲突 |
| 视频 | `seedance-pro-fast` | Public | 双语 model/endpoint/OpenAPI | P0 | 480p 被后端通用 binding 拒绝；endpoint 字段已废弃 |
| 视频 | `seedance-1.5-pro` | Public | 双语 model/endpoint/OpenAPI | P0 | 480p 与 duration=-1 被通用 binding 拒绝 |
| 视频 | `kling-ai` | Public | 双语 model/endpoint/OpenAPI | P0 | endpoint 字段和模型枚举无法通过真实合同 |
| 视频 | `wan-2-5` | Hidden | 孤立双语 model/endpoint/OpenAPI | P1 | 字段改名后旧参数被静默忽略，多个能力缺失 |
| 视频 | `wan-2-6` | Hidden | 孤立双语 model/endpoint/OpenAPI | P0 | prompt 上限错误，Schema 大量缺字段 |
| 视频 | `wan22-animate-move` | Hidden | 孤立双语 model/endpoint/OpenAPI | P0 | 文档无需 prompt，但真实 binding 强制 prompt |
| 音频 | `eleven-labs-tts-v2` | Public | 双语 model/endpoint/OpenAPI | P2 | 核心字段/价格基本正确；默认值、timestamps、保留期无网关保证 |
| 音频 | `eleven-labs-tts-turbo-25` | Public | 双语 model/endpoint/OpenAPI | P2 | 核心字段/价格基本正确；默认值与 Unicode 口径需明确 |

覆盖结果：**23/23 模型均有审查结论**。

## 图片模型逐项 TODO

### `flux-pro` — Hidden — P0

后端合同：`prompt` 必填；可选 `aspect_ratio=1:1|16:9|9:16`、`is_raw`；固定 40 积分。

- [ ] 页面请求路径从不存在的 `/flux-pro-1-1` 改为 `/flux-pro`，或直接按 Hidden 策略归档。
- [ ] 删除后端 DTO 不接受的 `output_format`、`seed`。
- [ ] 不要宣称网关默认 `aspect_ratio=1:1`，后端当前未设置该默认。

证据：后端 `internal/dto/img/flux_pro_params.go:15-54`；文档 `models/flux-pro-1-1.mdx:29`。

### `flux-kontext-pro` — Hidden — P1

后端合同：`prompt` 必填；最多 4 张 `image_urls`；`aspect_ratio` 在 9:21–21:9；`output_format=jpeg|png`；`safety_tolerance=0..6`；固定 30。

- [ ] 删除 Pro DTO 不存在的 webhook 字段。
- [ ] 旧 `15–20` 与参考图加价改为固定 30，或从公开文档/OpenAPI 移除。
- [ ] 后端将 `safety_tolerance:0` 误当缺省并改为 2；改指针类型并补零值测试。
- [ ] 区分“网关默认”与“供应商默认”，不要把未赋值的 `output_format=png` 写成平台保证。

### `flux-kontext-max` — Hidden — P1

后端合同与 Pro 类似，另接收 `webhook_url`、`webhook_secret`；固定 60。

- [ ] Max Adapter 当前不下传 webhook：要么实现并测试，要么从 DTO 和所有文档删除。
- [ ] 旧 `20–28` 与参考图加价改为固定 60。
- [ ] 修复显式 `safety_tolerance:0` 被覆盖的问题。
- [ ] 不再让 Pro/Max 共享一个含错误 webhook 字段的 OpenAPI Schema。

### `flux-2-pro` — Hidden — P1

后端合同：`prompt` 必填；最多 8 张输入图；`width/height` 成对且各不小于 64；`output_format=jpeg|png`；`safety_tolerance=0..5`；按输出与输入总 MP 计费，Pro 为 `20 + (总 MP - 1) × 10`。

- [ ] endpoint 删除固定 T2I/I2I `20/35`，改为真实 MP 公式和可复算示例。
- [ ] 明确读取输入图尺寸失败时按 4 MP 计，而不是给出固定编辑价格。
- [ ] 按 Hidden 策略决定是否继续公开 path。

### `flux-2-flex` — Hidden — P1

后端合同：Pro 的全部字段，加 `prompt_upsampling`、`guidance=1.5..10`、`steps=1..50`；积分为总 MP × 40。

- [ ] endpoint 删除固定 `40/75`，改为真实 MP 公式。
- [ ] `guidance=5`、`steps=50`、`output_format=jpeg` 当前不是网关赋予的默认值；文档改为上游默认或后端显式固化。
- [ ] 按 Hidden 策略决定是否继续公开 path。

### `seedream-4` — Public — P1

后端合同：`prompt` 必填；最多 14 张输入图；8 种比例；`resolution=1K|2K|4K`，默认 2K；`batch_size=1..15`，有效默认 1；`输入图数 + batch_size <= 15`；每输出预扣 30，终态按实际输出数结算。

- [ ] endpoint 删除按分辨率 `10/15/25`、输入图 `+5`、额外输出 `+15` 的旧计费。
- [ ] 成功示例中的 `credits_deducted:15` 改为与 batch 对应的真实值。
- [ ] 文档/OpenAPI 宣称 seed 范围 `[-1,2147483647]`，DTO 未执行；后端实现或撤销该承诺。

### `seedream-4.5` — Public — P1

请求字段与 4.0 相同；每输出预扣 40，终态按实际输出数结算。

- [ ] endpoint 删除 `10/15/25` 与额外输出 `+15`，改为每张 40。
- [ ] Schema 可以与 4.0 复用，但计费说明和示例必须按 model key 分开。

### `nano-banana-pro` — Public — P0

后端合同：`prompt` 最大 10000 bytes；最多 8 张输入图；默认比例 `1:1`；`resolution=1K|2K|4K`；`output_format=png|jpg|jpeg`。DTO 默认 resolution 为 1K，实际积分为 `108/108/144`。

- [ ] 中英文 model、endpoint、pricing 与 OpenAPI 全部从 `10/10/20` 改为 `108/108/144`。
- [ ] `PublicCatalog` 的 note 说缺省按 2K，DTO 实际默认 1K；选定一个事实源并加测试。
- [ ] 参数表补 `jpeg` alias，或后端收窄到文档枚举。

证据：后端 `internal/dto/pricing/pricing.go:43-51`、`internal/dto/img/nano_banana_pro_params.go:72`；文档 `pricing.mdx:16-17`。

### `nano-banana` — Public — P1

后端合同：`prompt` 最大 5000 bytes；最多 10 张输入图；默认比例 `1:1`；`output_format=png|jpeg`；固定 24。

- [ ] model 页与 OpenAPI 的 prompt 上限从 10000 改为 5000。
- [ ] model 页与 OpenAPI 删除 `jpg`；endpoint 当前写法较接近后端，可作为修复基准。

### `nano-banana-2` — Public — P1

后端合同：`prompt` 最大 20000 bytes；最多 14 张输入图；15 种比例含 `auto`，默认 auto；resolution 默认 1K；output 接受 `png|jpg|jpeg`，默认 jpg；积分 48/72/108。

- [ ] 新增并导航中英文 endpoint 页和 OpenAPI path/schema。
- [ ] 参数表补 `jpeg` alias 与归一化为 jpg 的行为。
- [ ] 使用共享真实提交响应与状态响应，不复制旧小写状态示例。

### `nano-banana-2-lite` — Public — P1

后端合同：`prompt` 最大 20000 bytes；最多 10 张输入图；比例同 Nano Banana 2，默认 auto；不接受 resolution/output_format；固定 24。

- [ ] 新增并导航中英文 endpoint 页和 OpenAPI path/schema。
- [ ] 明确 Lite 不支持 resolution/output_format，避免与完整版本共用宽松 Schema。

### `virtual-try-on` — Hidden — P0

当前真实 binding：`prompt`、`human_image`、`cloth_image` 都必填；`model_name` 可选并默认 v1；固定 65。

- [ ] 产品/后端先决定 prompt 是否真的必要。若不必要，拆除对 `BaseTaskParams.Prompt required` 的继承；修复前文档必须给非空 prompt。
- [ ] 文档承诺的格式、10MB、最小 300px 当前不是网关校验；标为上游约束或在后端实现。
- [ ] 按 Hidden 策略归档或标 legacy。

### `gpt-image-2` — Public — P1

后端合同：`prompt` 最大 32000 bytes；最多 10 张输入图；`size=auto|1024x1024|1536x1024|1024x1536`；`quality=auto|low|medium|high`；`output_format=png|jpeg|webp`；固定 9，每次 1 张。

- [ ] 基于现有 `snippets/agent-media-request-schemas.mdx` 新增双语 model、endpoint 与 OpenAPI。
- [ ] 中英文静态 pricing 页补 9 积分/请求；当前实时 `/pricing` 已包含。
- [ ] 明确 prompt 上限当前按 Go `len` 即 UTF-8 bytes，不是 Unicode 字符。

## 视频模型逐项 TODO

### `runway-gen3` — Public — P1

后端合同：`prompt`、`type=text-to-video|image-to-video` 必填；I2V 恰好 1 张图；duration 5/10 默认 5；resolution 720p/1080p 默认 720p；fps 24/30/60 默认 24；10s+1080p 禁止；价格 5s/720p=5、10s/720p=5、5s/1080p=10。

- [ ] 新增双语 endpoint、OpenAPI path/schema 和导航入口。
- [ ] 模型页补真实生效的 fps。
- [ ] 提交响应改为 `code=0`，删除虚构的 `status:pending`；状态改为后端大写枚举。

### `veo3` — Public — P0

后端合同：`prompt`、`type` 必填；type 为 T2V/I2V/reference；duration 4/6/8 默认 8；resolution 仅 720p；model 仅 `veo3_fast`；按 120 × duration 计费。

- [ ] model、endpoint、OpenAPI 统一 `type` 必填；删除旧 `generation_type`。
- [ ] 删除请求枚举 `veo3`、`veo3.1_fast`，仅保留 `veo3_fast`。
- [ ] 补 duration、resolution、三种 type 的 image 数量与 reference 条件约束。
- [ ] 静态 pricing 页删除重复的 “Veo 3 fast / Veo 3.1 fast” 两行，按唯一 `veo3` key 披露。
- [ ] `enable_translation=true` 当前不是网关默认；后端固化或改写文档。
- [ ] 当前 Agent schema 对主要字段是正确的，可作为回写基准。

### `seedance-pro-fast` — Public — P0

后端意图：`type` 必填；duration 5/10 默认 5；resolution 480p/720p/1080p，意图默认 480p；I2V 恰好 1 张图；按分辨率每秒 10/20/50。

- [ ] 后端通用 binding 加入/放行 480p，最好由模型自己拥有枚举。
- [ ] endpoint 的 `mode`、`input_image_url` 改为 `type`、`image_urls`。
- [ ] 为三档 resolution 加真实 handler binding 测试。
- [ ] payload 固定 24 fps，当前传 30/60 会被静默忽略；应拒绝无效值或真正支持。

### `seedance-1.5-pro` — Public — P0

后端意图：`type` 必填；duration 为 `-1` 或 4–12，默认 5，`-1` 按 8 秒预扣；resolution 480p/720p 默认 720p；默认生成音频；按分辨率、音频开关与秒数计费。

- [ ] 后端 binding 放行 `480p` 与 `duration=-1`。
- [ ] OpenAPI duration 不应写连续 `minimum:-1,max:12`（会错误允许 0–3）；改为 `-1` 或 `[4,12]`。
- [ ] 加 handler 合同测试覆盖 480p、-1、音频开关和预扣。
- [ ] 与 Fast 相同，拒绝当前会被静默忽略的 30/60 fps。

### `kling-ai` — Public — P0

后端合同：`prompt`、`type`、`quality_mode=std|pro`、duration 5/10 必填；I2V 恰好 1 张图；model key 包含 `kling-v2-1-master`，不包含 `kling-v2-master`。

- [ ] endpoint 的 `mode`、`image` 改为 `type`、`image_urls`，补必填 `quality_mode`。
- [ ] model、endpoint、OpenAPI 全部把 `kling-v2-master` 改为 `kling-v2-1-master`。
- [ ] `cfg_scale=0` 当前会被 V1.x 默认成 0.5；改指针或撤销零值支持。
- [ ] 动态轨迹坐标文档允许 0，但 binding 的 `required` 会拒绝整数 0；修校验并加边界测试。
- [ ] resolution/fps 被公共 DTO 接受但 payload 不使用，应拒绝而不是做幽灵参数。

### `wan-2-5` — Hidden — P1

后端合同：`prompt` 最大 1500；`type` 必填；duration 5/10；resolution 720p/1080p；5 种比例；`negative_prompt`、`prompt_extend`、`audio_url`、seed；价格 60/s 或 100/s。

- [ ] 旧 `enable_prompt_expansion` 改为 `prompt_extend`；当前未知字段会被静默忽略，风险较高。
- [ ] prompt 上限从 800 改为 1500，比例补 4:3/3:4，补 `audio_url`。
- [ ] 后端启用严格未知字段校验，或建立模型级严格解码，避免旧参数看似成功实则无效。
- [ ] 按 Hidden 策略归档或标 deprecated legacy。

### `wan-2-6` — Hidden — P0

后端合同：`prompt` 最大 1500；`type` 必填；duration 5/10/15；resolution 720p/1080p；5 种比例；`negative_prompt`、`prompt_extend`、`shot_type`、`audio_url`、seed；I2V 恰好 1 张图。

- [ ] 文档 prompt 最大值从 5000 改为 1500；当前 1501–5000 会失败。
- [ ] 按后端补全缺失的 aspect ratio、negative prompt、prompt_extend、shot_type、audio_url、seed。
- [ ] image_urls 从“至少 1 张”改为“恰好 1 张”。
- [ ] `shot_type` 注释称依赖 `prompt_extend=true`，Validate 未实现；确认真实约束并测试。
- [ ] 按 Hidden 策略归档或标 deprecated legacy。

### `wan22-animate-move` — Hidden — P0

模型意图：只需 `video_url`、`image_url`；resolution 480p/580p/720p 默认 480p；固定按 5 秒计 175/260/350。当前真实 HTTP binding 还会额外强制 prompt。

- [ ] 移除该模型对公共 prompt required 的继承冲突，并加“无 prompt 可成功 bind”测试。
- [ ] duration/fps 当前可被 bind 但 payload 与计费均忽略；显式拒绝。
- [ ] 按 Hidden 策略归档或标 deprecated legacy。

## 音频模型逐项 TODO

### `eleven-labs-tts-v2` — Public — P2

后端合同：`text`、voice/音色参数、上下文文本、language_code、timestamps；仅网关默认 `voice=Rachel`；每 1000 个 Unicode code point 80 积分并向上取整。

- [ ] `stability=0.5`、`similarity_boost=0.75`、`style=0`、`speed=1.0`、`timestamps=false` 当前只是上游默认，不是网关保证；后端固化或从 OpenAPI `default` 移除。
- [ ] 明确计费单位为 Unicode code point；JavaScript 示例使用 `Array.from(text).length`。
- [ ] `language_code` 文档承诺 ISO 639-1，但后端仅做长度校验；实现枚举/格式校验或改成 provider hint。
- [ ] 验证 `timestamps=true` 的真实产物。后端状态目前只返回 `result_urls`，没有结构化 timestamp 合同。
- [ ] 删除“音频保留 30 天”承诺，或实现并证明统一的 Wizzx 存储生命周期。

### `eleven-labs-tts-turbo-25` — Public — P2

字段与 V2 相同；仅网关默认 `voice=Rachel`；每 1000 个 Unicode code point 40 积分并向上取整。

- [ ] 与 V2 同步默认值、Unicode 计数、language_code 与 timestamp 处理。
- [ ] 共享音频请求/响应 Schema，避免两页独立漂移。

## 公共 API 与 OpenAPI TODO

### P1：成功响应统一

真实提交响应是：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "UUID",
    "model_key": "veo3",
    "credits_deducted": 960
  },
  "request_id": "..."
}
```

- [ ] 建共享 `SuccessEnvelope<T>` 和 `TaskSubmitResponse`；所有 submit path 用 `$ref`。
- [ ] 删除 OpenAPI 中不存在的 `msg`，统一为 `message`。
- [ ] 删除提交响应里虚构的 `data.status`；补 `model_key`、`credits_deducted`、`request_id`。
- [ ] 示例 task ID 使用 UUID，不再使用 `task_123456789`。

证据：后端 `pkg/response/response.go:12-35`、`internal/handler/task_handler.go:117-130`。

### P1：任务状态统一

客户端可见状态是：`PENDING`、`QUEUED`、`PROCESSING`、`REVIEW_REQUIRED`、`SUCCEEDED`、`FAILED`。内部 `DISPATCHING` 会映射为 `PROCESSING`，不应作为公开状态要求客户端处理。

- [ ] 更新中英文 task-status、全部模型页和 OpenAPI，移除只有三态或小写状态的旧说明。
- [ ] 响应补 `credits_deducted`、`message`、`request_id`，明确 `result_urls` 在非终态可能为 `null` 或空数组。
- [ ] 保留 Agent 指南的策略：未知状态停止，绝不自动重提付费任务。

证据：后端 `internal/model/task.go:15-29`、`internal/service/task_service.go:261-289`、`internal/handler/task_handler.go:169-175`。

### P1：错误与重试契约

真实错误为 `error.{message,type,param,code}` + `request_id`；429 另有 body `retry_after` 与 header `X-Retry-After`；模型 Validate 可返回 422。

- [ ] 建共享 `ErrorResponse`，所有鉴权 endpoint 引用。
- [ ] 建模 400、401、402、404、413、422、429、500、503；不要只有文字描述。
- [ ] 429 同时描述 body 与 header；5xx/429 的重试说明必须保持“先查原 task 状态，不盲目重提”。
- [ ] 提交积分不足当前使用 simple error，不要在示例中承诺一定返回 `balance/required`。

证据：后端 `pkg/response/errors.go:17-30,418-433`、`internal/handler/task_handler.go:60-80`。

### P1：补全公开 OpenAPI 覆盖

当前 14 个公开模型中，以下 4 个没有 submit path：

- [ ] `runway-gen3`
- [ ] `nano-banana-2`
- [ ] `nano-banana-2-lite`
- [ ] `gpt-image-2`

此外：

- [ ] 为公开 `GET /pricing` 建 OpenAPI path/schema，无鉴权。
- [ ] 为 `GET /api/v1/credits/balance` 建 OpenAPI path/schema，Bearer API key 鉴权。
- [ ] OpenAPI `bearerFormat` 从 JWT 改为 Wizzx API key 描述。
- [ ] 后端严格校验 `Authorization: Bearer <key>`；当前宽松 TrimPrefix 行为可能接受 bare key 或错误 scheme。

### P1：Hidden 披露策略

9 个 Hidden 模型中有 8 个仍出现在发布 OpenAPI；孤立双语页面也可直达。Hidden 的语义必须二选一：

- [ ] **停止披露**：从 OpenAPI、公开 sitemap/搜索与直达页移除或归档；或
- [ ] **legacy 兼容**：OpenAPI 标 `deprecated`，页面标 legacy，明确不可从 `/pricing` 发现且不供智能体自动选型。

Hidden 模型：`flux-pro`、`flux-kontext-pro`、`flux-kontext-max`、`flux-2-pro`、`flux-2-flex`、`virtual-try-on`、`wan-2-5`、`wan-2-6`、`wan22-animate-move`。

### P2/P3：契约治理

- [ ] 决定公开 DTO 中 `debug=1` 的权限。当前普通 API key 可获得 `provider_task_id/provider_key`，文档未披露；优先改为受控诊断能力，而不是直接公开。
- [ ] 图片 prompt 上限多数使用 Go `len(string)`，实际按 UTF-8 bytes；音频已经按 Unicode code point。统一计数语义或在文档准确区分。
- [ ] 定价页把 accepted submit 写成“直接扣除”。应改为：提交预留；`SUCCEEDED` 确认；`FAILED` 退款；`REVIEW_REQUIRED` 冻结待核对。
- [ ] 删除没有后端实现/配置证据的固定保留期、固定限流等运营承诺，或为其建立可验证事实源。

## 推荐实施顺序

### 第一批：阻止错误调用与错误报价

- [ ] 修 Nano Banana Pro、Seedream、Veo 静态价格与示例。
- [ ] 修 BaseVideo binding、WAN22/Virtual Try-On prompt 继承冲突。
- [ ] 重写 Veo、两款 Seedance、Kling 的 endpoint/OpenAPI。

### 第二批：建立统一机器契约

- [ ] 抽共享 submit/status/error envelope。
- [ ] 补 4 个公开模型、`/pricing`、余额 API 的 OpenAPI。
- [ ] 修 Bearer API key、状态枚举、错误与重试 Schema。

### 第三批：逐模型收尾

- [ ] 修图片默认值、字符/字节口径、webhook、safety/cfg 零值。
- [ ] 修音频默认值、timestamps、language_code 和存储生命周期。
- [ ] 决定 Hidden 模型归档或 legacy 策略并一次性执行。

### 第四批：防止再次漂移

- [ ] 每个 `model_key` 建 `ShouldBindJSON → Validate → defaults → CalculateCredits` 合同测试，直接复用公开示例 payload。
- [ ] CI 对比 Registry、`PublicCatalog()`、OpenAPI paths、docs 导航，公开模型缺一项即失败。
- [ ] CI 校验 OpenAPI required/enum/default 与后端生成的契约快照。
- [ ] 静态 pricing 页面改为从 `/pricing` 数据生成，或只解释计价规则，不手写易漂移数值。

## 已确认正确或可复用的部分

- 后端 registry、routing 和实时 `/pricing` 当前一致：14 个公开、9 个 Hidden。
- 两款 ElevenLabs TTS 的核心字段和 80/40 每千 Unicode code point 计价一致。
- Nano Banana 2、Nano Banana 2 Lite 的模型页主体参数和价格总体正确，主要缺 endpoint/OpenAPI。
- 新 Agent 指南中 GPT Image 2 与 Veo 的严格请求 Schema 基本贴合当前后端；Veo 旧 model/endpoint/OpenAPI 应向它收敛。
- 新 Agent 指南列出的六个客户端可见任务状态是正确的；内部 `DISPATCHING` 保持映射为 `PROCESSING`。

## 验收清单

- [ ] 23 个后端 model key 均有明确的公开/Hidden 策略。
- [ ] 14 个公开模型均有中英文 model、endpoint、OpenAPI path 和 `/pricing` 条目。
- [ ] 任一公开示例都能通过真实 HTTP binding 和 `Validate()`。
- [ ] 文档展示的积分与 `CalculateCredits()`、实时 `/pricing` 一致。
- [ ] OpenAPI 只包含真实字段、required、enum、default、条件约束和统一响应。
- [ ] 客户端状态不暴露内部 `DISPATCHING`，并能处理 `REVIEW_REQUIRED`。
- [ ] 未知字段不会静默忽略，或每个可忽略字段都有明确兼容说明。
- [ ] 中英文页面、OpenAPI、Agent schema 由同一个可测试事实源生成或校验。

## 本轮验证

- 后端定向测试已通过：图片 DTO/计价/registry/handler；视频 DTO/registry/计价；音频计价/handler/middleware。
- OpenAPI 语法 lint 通过，但有 21 个规范警告（包括缺 operationId、license、未使用 Schema）；语义漂移不由 lint 自动发现。
- 未发起真实付费生成，因此没有验证上游默认值、timestamp 产物、结果 URL 保留期和供应商当前行为。
