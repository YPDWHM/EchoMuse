# EchoMuse 桌面安装包与首次启动向导方案（实施规格）

更新时间：2026-02-23
状态：待实施（产品/技术方案已确认）

## 1. 目标

给终端用户一个接近“一键安装 + 一键开始”的桌面体验：

- 下载并运行安装包（Windows）
- 可选择安装路径
- 安装完成后桌面出现图标（使用项目根目录 `图1.png` 作为图标源）
- 首次启动进入向导，自动检查运行环境
- 用户可选择：
  - 仅使用 API（不启用本地模型）
  - 启用本地 Ollama（可勾选多个模型）
  - 混合模式（本地模型 + API Provider）
- 如果用户没有启用 Qwen 类本地模型，则 UI 不再写死显示 `Qwen Flash/Thinking`，而是按当前模型显示对应的“快速/深度”模式名称

## 2. 范围（第一阶段）

### 2.1 包含

- Windows 安装包（NSIS）
- 桌面图标、开始菜单图标
- 首次启动向导（First Run Wizard）
- 环境检查（Node/Electron 内嵌服务可用、本地 Ollama 可用性、API Provider 配置）
- 本地模型勾选与下载（Ollama）
- API-only 模式
- 模型显示文案改造（从“Qwen 固定文案”改为“跟随模型”）
- 首次向导配置持久化（后续启动跳过）

### 2.2 暂不包含（后续阶段）

- 自动更新（auto-update）
- 模型下载断点续传/可视化进度条（先做基础状态）
- Linux/macOS 安装包
- 云端账号体系

## 3. 图标与资源约定

- 安装包/桌面图标源文件：项目根目录 `图1.png`
- 构建时需要生成 `.ico`（Windows）
- 建议新增构建产物路径（后续实现）：
  - `desktop/assets/icon.ico`（构建输出）
- 文档备注：
  - 不直接手工改 `public/index.html` 放图标（避免乱码风险）
  - 图标转换通过脚本或构建步骤完成

## 4. 用户流程（目标体验）

## 4.1 安装流程（Windows）

1. 用户下载 `EchoMuse` 安装包（`nsis` 或 `portable`）
2. 双击运行安装包
3. 安装界面可选安装路径
4. 安装完成后勾选“创建桌面快捷方式”
5. 桌面出现 `EchoMuse` 图标（来自 `图1.png` 转换后的 `.ico`）

## 4.2 首次启动向导（App 内）

1. 打开应用，进入“首次配置向导”
2. 向导检查：
   - 内嵌服务是否正常启动
   - 本地 Ollama 是否可用（含项目内 `vendor/ollama/ollama.exe`）
   - 是否已有 API Provider 配置
3. 用户选择模式：
   - `仅 API`
   - `仅本地模型`
   - `混合模式`
4. 若选择启用本地模型：
   - 展示可勾选模型列表（可多选）
   - 每个模型可配置模式映射（快速 / 深度）
5. 若选择 API：
   - 选择/配置 Provider（OpenAI-compatible / Anthropic 等）
6. 向导完成，写入本地配置
7. 进入主界面开始使用

## 5. 本地模型选择与模式映射（重点）

这是本方案的核心要求：**不能把 `Qwen Flash/Thinking` 写死成全局固定概念**。

### 5.1 模型来源（本地 Ollama）

首次向导提供可勾选模型（可多选）：

- `qwen3:8b`（或其他 Qwen 型号）
- `llama2`
- `mistral`
- `mixtral`
- `codellama`
- `vicuna`
- `yi`
- `solar`
- （可扩展：自定义输入模型名）

### 5.2 每模型独立模式配置（必须）

每个勾选的本地模型都允许配置：

- `快速模式（Flash）` 是否启用
- `深度模式（Thinking）` 是否启用
- （可选）模式别名/展示名
- （可选）该模式默认参数：temperature、maxTokens

说明：

- 某些模型不适合或不支持“思考风格”，允许只启用 `快速模式`
- 如果用户没勾选某模型的 `Thinking`，UI 中不应显示该模型的 Thinking 选项
- 如果用户完全没启用 Qwen，本应用中任何地方都不应出现固定文案 `Qwen Flash / Qwen Thinking`

### 5.3 推荐的显示文案策略

统一改成模型无关文案：

- `⚡ 快速模式（当前模型名）`
- `🧠 深度模式（当前模型名）`

示例：

- `⚡ 快速模式（mistral）`
- `🧠 深度模式（mixtral）`
- `⚡ 快速模式（qwen3:8b）`

## 6. API-only / 混合模式支持

### 6.1 API-only（不使用本地模型）

用户可明确选择：

- 不启动/不依赖本地 Ollama
- 仅使用已配置的 API Provider（如硅基流动、OpenAI-compatible）

系统要求：

- 不强制提示安装/启动 Ollama
- 模型下拉只展示 API Provider 的模型
- 翻译、聊天、知识库嵌入等默认走 API Provider（按功能配置）

### 6.2 混合模式（推荐高级用户）

用户可同时启用：

- 本地 Ollama 模型（聊天/翻译/嵌入）
- API Provider（聊天/翻译/图像等）

系统要求：

- 明确显示当前选中的 Provider / 模型
- 翻译 overlay 不应偷偷回退到未启用的本地模型（需遵循当前选择或明确 fallback 策略）
- 各功能（聊天 / 翻译 / KB Embeddings）允许独立选择 Provider

## 7. 安装器与向导的技术实现建议

## 7.1 安装器（NSIS）职责

安装器负责“安装层”：

- 安装到指定路径
- 创建桌面快捷方式
- 创建开始菜单快捷方式
- 写入卸载项
- 可选：安装完成后立即启动 App

安装器不建议承担过多“运行时配置逻辑”（例如模型拉取、API 测试等），这些放到 App 内首次向导更稳定。

## 7.2 首次向导（App 内）职责

首次向导负责“配置层”：

- 环境检测（Ollama / API / 服务状态）
- 本地模型勾选与拉取（调用 `vendor/ollama/ollama.exe`）
- Provider 配置
- 默认模型/模式选择
- 写入本地配置并标记 `firstRunCompleted`

## 7.3 本地 Ollama 集成（项目内置）

项目当前已有：

- `vendor/ollama/ollama.exe`
- `setup-ollama.bat`

向导阶段可优先使用项目内置 Ollama：

- 检测 `vendor/ollama/ollama.exe` 是否存在
- 自动设置 `OLLAMA_MODELS=<项目路径>\\vendor\\ollama\\models`
- 启动 `serve`
- 拉取用户勾选模型

## 8. 配置数据结构建议（后续实现参考）

建议新增/扩展本地配置结构（示意）：

```json
{
  "firstRunCompleted": true,
  "runtimeMode": "hybrid",
  "localOllama": {
    "enabled": true,
    "exePath": "vendor/ollama/ollama.exe",
    "host": "127.0.0.1",
    "port": 11434,
    "modelsDir": "vendor/ollama/models",
    "selectedModels": [
      {
        "model": "qwen3:8b",
        "modes": {
          "flash": { "enabled": true, "label": "快速模式" },
          "thinking": { "enabled": true, "label": "深度模式" }
        }
      },
      {
        "model": "mistral",
        "modes": {
          "flash": { "enabled": true, "label": "快速模式" },
          "thinking": { "enabled": false }
        }
      }
    ]
  },
  "apiProviders": {
    "enabled": true
  }
}
```

## 9. UI 改造要求（与现有项目保持兼容）

### 9.1 模型选择器

- 不写死 `Qwen Flash / Qwen Thinking`
- 显示为通用模式 + 当前模型名
- 当模型切换时文案同步更新

### 9.2 首次向导入口

- 安装后首次启动自动弹出
- 设置页中保留“重新运行首次向导”入口（方便用户后续改配置）

### 9.3 错误提示

- 本地 Ollama 未启动：明确提示并提供“一键启动本地 Ollama”
- 模型未下载：明确提示并提供“去下载”
- API 未配置：明确提示并跳转模型管理/Provider 配置页

## 10. 验收标准（第一阶段）

满足以下条件即可视为第一阶段完成：

- 用户能通过安装包完成安装并生成桌面图标
- 首次启动出现配置向导
- 用户可选择 API-only、本地-only、混合模式
- 用户可勾选多个本地模型
- 每个本地模型可独立配置 `Flash/Thinking` 启用状态
- 未启用 Qwen 时，UI 不再显示固定 `Qwen Flash/Thinking` 文案
- 完成向导后能进入主界面正常聊天
- 不破坏现有翻译 overlay、MCP、知识库、Lorebook 功能

## 11. 实施顺序（建议）

### Phase A（先做）

- 安装包图标与 NSIS 打包配置完善（使用 `图1.png`）
- 首次启动向导框架（页面 + 状态机）
- 运行模式选择（API-only / 本地 / 混合）
- 本地 Ollama 检测与启动

### Phase B（再做）

- 本地模型多选 + 拉取
- 每模型 `Flash/Thinking` 配置
- 模型选择器文案改造（去 Qwen 固定文案）

### Phase C（打磨）

- 下载进度展示
- 失败重试
- “重新运行首次向导”入口

## 12. 后续协作用法（给未来自己/AI）

后续你可以直接这样提需求：

- “根据 `docs/desktop-installer-first-run-spec.md` 开始做 Phase A”
- “根据 `docs/desktop-installer-first-run-spec.md` 把每模型 Flash/Thinking 配好”
- “按 `docs/desktop-installer-first-run-spec.md` 完善安装包图标和 NSIS 配置”

