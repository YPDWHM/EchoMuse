# EchoMuse v1.0.1 Release Notes

## 中文

### 本次更新
- 修复：删除会话后输入框偶发失焦，导致无法立即继续输入的问题。  
  现在会在删除/切换会话后自动恢复窗口与输入框焦点，不需要再手动点到软件外部再切回。
- 修复：`新会话` 默认标题未完全跟随界面语言的问题。  
  现在会话默认名会跟随当前 UI 语言，且切换语言时会自动同步“默认名会话”（不影响你手动命名的会话）。
- 发布：桌面端安装包重新打包优化，版本号升级为 `1.0.1`。

### 安装包（Windows）
- `EchoMuse-1.0.1-win-x64.exe`（安装版）
- `EchoMuse-1.0.1-portable-x64.exe`（便携版）

### 兼容说明
- 本次为稳定性与体验修复版本，不影响既有会话数据结构与主要功能使用。

---

## English

### What's New
- Fixed: input box occasionally losing focus after deleting a chat, which could block immediate typing.  
  EchoMuse now actively restores window/input focus after session delete/switch, so no extra click outside the app is required.
- Fixed: default `New Chat` title not fully following UI language.  
  Default session titles now track the active UI language, and default-titled sessions are relocalized on language switch (custom titles are preserved).
- Release: desktop installer rebuilt with optimized packaging, version bumped to `1.0.1`.

### Windows Artifacts
- `EchoMuse-1.0.1-win-x64.exe` (installer)
- `EchoMuse-1.0.1-portable-x64.exe` (portable)

### Compatibility
- This is a stability/UX patch release and does not break existing chat data or core workflows.

