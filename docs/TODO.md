# 统一消息系统 TODO

目标：用一个统一的 MessageSystem 替换当前散落的 `alert()`、`MessageDisplay`、以及各处自制的提示样式与计时逻辑。

## 1) 核心模块（需要新增）
- [ ] `src/components/MessageSystem/MessageContainer.tsx`：消息容器（渲染队列）
- [ ] `src/components/MessageSystem/MessageProvider.tsx`：Provider（维护队列与生命周期）
- [ ] `src/components/MessageSystem/MessageItem.tsx`：单条消息（支持类型 / 图标 / 操作按钮）
- [ ] `src/components/MessageSystem/StatusIndicator.tsx`：状态指示（loading / connecting）
- [ ] `src/hooks/useMessage.ts`：业务调用 Hook（如 `showMessage` / `showStatus`）
- [ ] `src/utils/messageConfig.ts`：类型与默认行为配置（success / error / warning / info、默认持续时间等）

## 2) 接入与替换（已确认需要处理的位置）

### 全局接入
- [ ] `src/main.tsx`：用 `MessageProvider` 包裹应用（`App`），并在根部渲染 `MessageContainer`（确保 `App.tsx` 自身也能使用消息 hook）

### 需要替换的原生弹窗 / 仅控制台报错
- [ ] `src/components/SettingsPanel.tsx`：替换 `alert(t("NOTIFICATION_PERMISSION_DENIED"))` 为统一消息
- [ ] `src/components/SettingsPanel.tsx`：替换 `Notification.requestPermission()` 失败时的 `console.error(...)` 为用户可见的错误提示（仍可保留最少量日志）
- [ ] `src/App.tsx`（可选）：设置读取/持久化失败目前仅 `console.error(...)`，按需要决定是否向用户提示（建议提供低打扰等级的提示）
- [ ] `src/components/Pomodoro.tsx`（可选）：`new Notification(...)` 抛错目前仅 `console.error(...)`，可考虑用统一消息提示一次（避免刷屏）

### 播放器相关提示（MessageDisplay / 自制提示 UI）
- [ ] `src/components/AudioPlayer.tsx`：替换网络恢复提示（`showOnlineToast` + `MessageDisplay(messageKey="NETWORK_RESTORED")` + actionButton）
- [ ] `src/components/AudioPlayer.tsx`：网络恢复提示的自动消失目前依赖 `TOAST_DURATION_MS`，改为 MessageSystem 的默认持续时间配置
- [ ] `src/components/MusicPlayer.tsx`：`dataLoading` 时用 `MessageDisplay(messageKey="CONNECTING")`，改为 `StatusIndicator` 或统一消息
- [ ] `src/components/MusicPlayer.tsx`：`dataError` 时的错误 UI（`CONNECTION_LOST`）改为统一消息/样式体系
- [ ] `src/components/PlayerInterface.tsx`（可选）：顶栏 `isLoading ? t("CONNECTING") : t("STATUS")` 可与 `StatusIndicator` 的视觉体系对齐

### PWA 更新提示（现为独立 UI）
- [ ] `src/components/PWAPrompt.tsx`：将当前右下角更新提示改为 MessageSystem 的样式/组件（保留 SW 逻辑与 3 秒自动刷新行为）

## 3) 清理与迁移（完成替换后做）
- [ ] `src/components/MessageDisplay.tsx`：确认无引用后删除
- [ ] `src/constants.ts`：移除 `TOAST_DURATION_MS`（迁移到 `src/utils/messageConfig.ts`）

## 4) i18n（需要补齐的键）
说明：以下键已存在，可直接复用：`NOTIFICATION_PERMISSION_DENIED`、`NETWORK_RESTORED`、`ONLINE_MODE_AVAILABLE`、`CONNECTING`、`CONNECTION_LOST`、`pwa_updated`。

- [ ] `src/utils/i18n.ts`：新增 `SETTINGS_APPLIED`（应用设置成功提示）
- [ ] `src/utils/i18n.ts`（可选）：新增 `SETTINGS_LOAD_FAILED` / `SETTINGS_SAVE_FAILED`（如要把 App 的读取/持久化失败也提示给用户）

## 5) 完成后自检（用搜索验证无遗漏）
- [ ] 全局无 `alert(` / `confirm(` / `prompt(`
- [ ] 全局无 `MessageDisplay` 引用
- [ ] 全局无 `TOAST_DURATION_MS` 引用
