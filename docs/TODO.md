# TODO

## 统一消息系统（MessageSystem）

### 需要创建的文件
- [ ] `src/components/MessageSystem/MessageContainer.tsx` - 消息容器（显示消息队列）
- [ ] `src/components/MessageSystem/MessageProvider.tsx` - 消息上下文提供者（管理消息队列和状态）
- [ ] `src/components/MessageSystem/MessageItem.tsx` - 单个消息组件（支持不同类型、图标、按钮）
- [ ] `src/components/MessageSystem/StatusIndicator.tsx` - 状态指示器组件（用于 loading 状态）
- [ ] `src/hooks/useMessage.ts` - 消息调用 hook（showMessage、showStatus 等方法）
- [ ] `src/utils/messageConfig.ts` - 消息类型配置（success/error/warning/info 的样式和图标）

### 需要修改的文件
- [ ] `src/App.tsx` - 添加 MessageProvider 包装器和 MessageContainer 渲染
- [ ] `src/App.tsx` - 替换 alert() 为 showMessage（第 541 行）
- [ ] `src/App.tsx` - 在 applyMusicConfig 添加成功提示（第 220 行）
- [ ] `src/components/AudioPlayer.tsx` - 替换网络恢复提示逻辑（第 37-48 行状态，第 110-119 行渲染）
- [ ] `src/components/AudioPlayer.tsx` - 移除 MessageDisplay 导入（第 9 行）
- [ ] `src/components/MusicPlayer.tsx` - 替换 CONNECTING 状态显示为 StatusIndicator（第 49-57 行）
- [ ] `src/components/MusicPlayer.tsx` - 移除 MessageDisplay 导入（第 8 行）
- [ ] `src/components/PWAPrompt.tsx` - 重构为使用 MessageSystem 的样式系统（保留 SW 逻辑和特殊样式）
- [ ] `src/constants.ts` - 移除 TOAST_DURATION_MS（第 42 行）
- [ ] `src/utils/i18n.ts` - 添加新翻译键：SETTINGS_APPLIED

### 可能需要删除的文件
- [ ] `src/components/MessageDisplay.tsx` - 评估是否完全被新系统替代后删除

### 需要替换的具体位置

#### 1. AudioPlayer.tsx - 网络恢复提示
- 第 37 行：`const [showOnlineToast, setShowOnlineToast] = useState(false);`
- 第 41-48 行：网络恢复检测和计时器逻辑
- 第 56-59 行：`handleSwitchToOnline` 回调
- 第 110-119 行：MessageDisplay 渲染
- 第 9 行：`import MessageDisplay from './MessageDisplay';`

#### 2. MusicPlayer.tsx - 连接状态显示
- 第 49-57 行：dataLoading 时的 MessageDisplay 渲染
- 第 8 行：`import MessageDisplay from './MessageDisplay';`

#### 3. App.tsx - alert 替换
- 第 541 行：`alert(t('NOTIFICATION_PERMISSION_DENIED'));`

#### 4. App.tsx - 配置保存提示
- 第 220 行：`applyMusicConfig` 函数添加成功提示

#### 5. PWAPrompt.tsx - PWA 更新提示
- 保留文件和 SW 逻辑
- 重构样式以复用 MessageSystem 的样式系统
- 保留特殊的 clip-path-slant 和动画效果

## 在线播放器播放列表定位跟随（当前项定位到显示的中心行）

### 触发条件
- [ ] 播放列表项点击
- [ ] 播放按钮点击
- [ ] 上一曲/下一曲按钮点击
- [ ] 播放进度条拖动

### 点击播放列表的某一项后，播放列表定位到当前项，并且不自动关闭播放列表。切换列表项后的播放状态与切换前一致（播放对应播放/暂停对应暂停）

### 考虑本地播放器的最佳播放列表实践