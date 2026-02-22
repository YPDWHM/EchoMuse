# 本地学习 Chatbox（Ollama + Node + Web/PWA）

零云端、零付费 API。仅调用本机 `Ollama`。

## 你现在得到的版本

- Chatbox 布局：
  - 左侧 `Sidebar`：会话列表、搜索、新建会话、收藏。
  - 右侧 `Main`：聊天流、工具栏、输入区、资料输入区。
- 工具入口（聊天区内，不打断对话）：
  - `期末复习包` -> `/api/tool/review_pack`
  - `论文生成器` -> `/api/tool/paper_report`
- 工具调用会在聊天流插入 `Tool Card`：
  - 生成中 -> 成功后“点击查看产物”。
- 产物抽屉（Artifact Drawer）：
  - 与会话绑定，最近 10 条。
  - 可复制 JSON、导出 Anki CSV、导出 PDF（打印）、导出 Word。
- 聊天支持 Markdown + LaTeX（KaTeX）。
- 仍支持：`npm run local` / `npm run share`。

## 目录结构（关键）

```text
finalai/
├─ server.js
├─ package.json
├─ prompts/
│  ├─ review_pack_prompt.txt
│  ├─ json_repair_prompt.txt
│  ├─ paper_report_prompt.txt
│  └─ paper_report_repair_prompt.txt
├─ public/
│  ├─ index.html
│  ├─ app.js
│  ├─ styles.css
│  ├─ manifest.json
│  ├─ sw.js
│  └─ icons/icon.svg
└─ scripts/run-server.js
```

## 运行

### 1) 安装依赖

```bash
npm install
```

### 2) 启动 Ollama

```bash
ollama serve
ollama pull qwen3:8b
```

### 3) 启动本地服务

仅本机：

```bash
npm run local
```

局域网共享：

```bash
npm run share
```

浏览器打开：`http://127.0.0.1:5173`

## 安全

- 本项目只代理到：`http://127.0.0.1:11434`
- 不支持任意 URL 转发（防 SSRF）
- `/api/*` 统一限流：默认每 IP 每分钟 20 次
- `share` 模式建议启用口令：

PowerShell:

```powershell
$env:ACCESS_TOKEN="your-token"
npm run share
```

- 若 `share` 未设置口令，服务会在 `/api/info` 返回警告。

## API

### `POST /api/chat`

- 用途：普通问答（SSE 流式）
- 入参：

```json
{
  "messages": [{"role":"user","content":"..."}],
  "context": "可选资料文本"
}
```

### `POST /api/tool/review_pack`

- 用途：生成期末复习包（严格 JSON）
- 入参：

```json
{
  "text": "课程资料文本",
  "mode": "review_pack"
}
```

### `POST /api/tool/paper_report`

- 用途：生成论文/实验/课程报告（严格 JSON）
- 入参：

```json
{
  "text": "报告材料文本",
  "type": "course_report",
  "discipline": "可选",
  "style": "可选",
  "word_target": 2500
}
```

### `GET /api/health`

- 检测 Ollama 可用性和模型是否已拉取。

### `GET /api/info`

- 返回 host/port/localIPs/shareMode/authRequired/model 等。

## 工具输入要求

- 复习包与论文工具都会先检查文本长度：
  - 少于 `800` 中文字符 -> 返回 `InsufficientText`
- 论文工具还会检查关键材料：
  - 实验目的
  - 材料与仪器
  - 步骤流程
  - 数据摘要/表格
  - 结论要点
- 缺失时返回 `MissingInputs` 与缺失清单。

## 论文工具策略（已内置）

- 不伪造参考文献；仅输出引用占位符 `[REF:...]`
- 输出 `requirements_check` 提示缺失输入与风险点
- `anti_aigc` 提供两个可选改写版本：
  - `v1_more_human`
  - `v2_more_academic`
- 明确要求用户自行核对、补充真实数据和真实引用

## 常见问题

1. 聊天超时
- 检查 Ollama 是否在运行
- 资料过长时先精简
- 可提高 `OLLAMA_CHAT_TIMEOUT_MS`

2. 工具返回 JSON 修复失败
- 减少输入长度后重试
- 优先保留结构化标题、定义、步骤和结论

3. 手机访问不了
- 确保使用 `npm run share`
- 手机与电脑同 Wi-Fi
- Windows 防火墙仅放行专用网络

## 打包给同学

1. 你先本机跑通：`npm install && npm run local`
2. 打包整个项目目录为 zip
3. 同学解压后按本 README 执行
4. 若给新手，建议让他直接运行你提供的启动脚本（bat/sh/vbs）
