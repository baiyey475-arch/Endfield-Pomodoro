# Endfield Protocol - Pomodoro Terminal Development Documentation

## 📂 Project Structure

```text
endfield-pomodoro/
├── docs/                       # Documentation directory
├── public/                     # Public static assets directory
├── src/                        # Source code directory
│   ├── assets/                 # Static resource files
│   │   └── images/             # Image resources
│   ├── components/             # UI component library
│   │   ├── themes/             # Theme effect components
│   │   │   ├── BackgroundEffects.tsx  # Theme background effects
│   │   │   ├── ForegroundEffects.tsx  # Theme foreground effects
│   │   │   └── index.ts               # Theme component exports
│   │   ├── ui/                 # Basic UI components
│   │   │   ├── Button.tsx      # Button component
│   │   │   ├── Input.tsx       # Input and select components
│   │   │   ├── Panel.tsx       # Panel component
│   │   │   └── index.ts        # UI component exports
│   │   ├── AudioPlayer.tsx     # Local audio player component
│   │   ├── Checkbox.tsx        # Checkbox component
│   │   ├── CustomSelect.tsx    # Custom dropdown component
│   │   ├── Dashboard.tsx       # Dashboard layout component
│   │   ├── FooterStats.tsx     # Footer stats component
│   │   ├── HeaderBar.tsx       # Header bar component
│   │   ├── MessageDisplay.tsx  # Message display component
│   │   ├── MikuDecorations.tsx # Miku theme exclusive decoration component
│   │   ├── MusicPlayer.tsx     # Online music player component
│   │   ├── PlayerInterface.tsx # Player UI interface component
│   │   ├── Pomodoro.tsx        # Pomodoro core component
│   │   ├── PWAPrompt.tsx       # PWA prompt component
│   │   ├── SettingsPanel.tsx   # Settings panel component
│   │   ├── SoundManager.tsx    # Sound effect manager (Web Audio API)
│   │   ├── TaskManager.tsx     # Task management component
│   │   └── TerminalUI.tsx      # Theme layer container component
│   ├── config/                 # Configuration files
│   │   ├── musicConfig.ts      # Music player default configuration
│   │   └── themes.ts           # Theme color configuration
│   ├── hooks/                  # Custom Hooks
│   │   ├── useFooterHeight.ts  # Footer height monitoring Hook
│   │   ├── useIsMobile.ts      # Mobile device detection Hook
│   │   ├── useLocalPlayer.ts   # Local player logic Hook
│   │   ├── useMusicData.ts     # Music data retrieval
│   │   ├── useOnlinePlayer.ts  # Online player logic Hook
│   │   ├── useSessionStats.ts  # Session stats logic Hook
│   │   └── useShuffle.ts       # Shuffle playback logic Hook
│   ├── utils/                  # Utility functions
│   │   ├── i18n.ts             # Internationalization configuration (Chinese/English)
│   │   └── musicApiAdapters.ts # Music API adapters
│   ├── App.tsx                 # Main application component and layout
│   ├── constants.ts            # Global constants definition
│   ├── index.css               # Global styles and Tailwind import
│   ├── main.tsx                # Render entry point
│   ├── types.ts                # TypeScript core type definitions
│   └── vite-env.d.ts           # Vite environment type definitions
├── index.html                  # HTML entry file
```

## 🛠️ Tech Stack

- **Core Framework**: [React 19](https://react.dev/) - Leveraging latest Hooks and concurrent features
- **Performance Optimization**: [React Compiler](https://react.dev/learn/react-compiler) - Automatic memoization optimization, no manual useMemo/useCallback needed
- **Build Tool**: [Vite](https://vitejs.dev/) - Extremely fast cold start and hot reload experience
- **Development Language**: [TypeScript](https://www.typescriptlang.org/) - Strong typing for code robustness
- **Styling Solution**: [TailwindCSS v4](https://tailwindcss.com/) - Atomic CSS engine, combined with CSS Variables for dynamic theme switching
- **Icon Libraries**: [Remixicon](https://remixicon.com/) + [Lucide React](https://lucide.dev/) - Consistent style open-source icon sets
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Utility Functions**: [react-use](https://github.com/streamich/react-use) - Practical React Hooks collection
- **Code Quality**: [ESLint](https://eslint.org/) for linting + [Biome](https://biomejs.dev/) for formatting

## 🌐 Internationalization Support (i18n)

The project fully supports Chinese and English bilingualism, with all UI text managed through `i18n.ts`, including:

- Interface labels and button text
- Status prompt messages
- Music platform and type options
- Error and loading prompts

Language switching takes effect immediately without page refresh, with all text updating instantly.

## 🎨 Theme System

Uses CSS Variables to implement dynamic theme switching, with each theme definition including:

- Primary color (--color-primary)
- Highlight color (--color-highlight)
- Background colors (--color-base, --color-surface)
- Text colors (--color-text, --color-dim)
- Status colors (--color-success, --color-error)
- Effect colors (--color-secondary, --color-accent)

All theme configurations are stored in `src/config/themes.ts` for easy extension of new themes. Theme effect components are separated in the `src/components/themes/` directory, implementing modular management of background and foreground effects.

## 🔧 Development Tips

### Adding New Themes
Add new theme configuration in THEMES of `src/config/themes.ts`:

```typescript
[ThemePreset.YOUR_THEME]: {
  '--color-base': '#color_value',
  '--color-surface': '#color_value',
  '--color-highlight': '#color_value',
  '--color-primary': '#color_value',
  '--color-secondary': '#color_value',
  '--color-accent': '#color_value',
  '--color-text': '#color_value',
  '--color-dim': '#color_value',
  '--color-success': '#color_value',
  '--color-error': '#color_value'
}
```

If you need to add theme effects, add corresponding effect components in `src/components/themes/BackgroundEffects.tsx` and `src/components/themes/ForegroundEffects.tsx`.

### Adding New Languages
Add new language configuration in `src/utils/i18n.ts`:

```typescript
export const translations = {
  // ... existing languages
  [Language.NEW_LANG]: { /* translation content */ }
}
```

### Modifying Default Music Configuration
Edit the configuration in `src/config/musicConfig.ts`:

```typescript
// Default playlist configuration
export const defaultMusicConfig: MusicConfig = {
  server: 'netease',  // Music platform: 'netease' | 'tencent' | 'kugou' | 'baidu' | 'kuwo'
  type: 'playlist',   // Type: currently only supports 'playlist'
  id: '9094583817'    // Playlist ID
};

// Music player default volume (0.0 - 1.0)
export const DEFAULT_MUSIC_VOLUME = 0.5;
```

### Code Organization Principles
- **Component Layering**: Separate UI basic components (`src/components/ui/`), theme effect components (`src/components/themes/`), and business components
- **Centralized Configuration**: All configuration files are uniformly managed in the `src/config/` directory
- **Constants File**: All constants are uniformly managed in `constants.ts`
- **Type File**: All TypeScript type definitions are in `types.ts`
- **Utility Functions**: Pure functions are placed in the `utils/` directory
- **Custom Hooks**: Reusable logic is placed in the `hooks/` directory

## ⚡ React Compiler Explanation

This project enables React Compiler, which automatically optimizes component performance:
- Automatically memoizes component output, no need to use `React.memo`
- Automatically caches calculation results, no need to use `useMemo`
- Automatically optimizes callback functions, no need to use `useCallback`
- Compiler configuration is located in `vite.config.ts`
- Use React DevTools to see which components are optimized by the compiler

**Note:** Although React Compiler provides automatic optimization, explicit patterns are still recommended in the following scenarios:
- Prevent stale closures in long‑lived event listeners (e.g., DOM/Audio events in hooks): keep the latest values with refs (like current index, playing state, latest onTrackFix) or memoize callbacks passed into listeners.
- Stabilize references passed to child components or external systems: prefer `useCallback`/`useMemo` when prop identity influences behavior or subscriptions.
- Handle complex dependencies explicitly to improve readability and intent.

## 🧹 Code Quality

This project uses a dual-tool approach for code quality:

| Tool | Purpose | Command |
|------|---------|---------|
| **ESLint** | Linting (React Hooks rules) | `pnpm lint` |
| **Biome** | Formatting + Import sorting | `pnpm format` |

### Available Scripts
- `pnpm lint` - Run ESLint checks
- `pnpm format` - Format code with Biome
- `pnpm check` - Run Biome check (format + organize imports)

## 🎵 Online Playback Fallback Strategy

- Single-track fallback: when a track fails to load, a replacement URL is fetched and applied immediately to the current Audio element; success resets error counters.
- Playlist-wide fallback: after consecutive failures for the same track reach a threshold (currently 2), switch to the next API adapter for the entire playlist and clear any single-track URL overrides.
- Reference implementation is in the online player and music data hooks; adapter rotation and URL overrides work together to recover playback quickly.

## ⏱ Request Cancellation & Timeout

- Track-level fix requests use AbortController. New attempts cancel the previous request; component unmount also aborts any in-flight request.
- The track URL fetch supports an external AbortSignal and an internal timeout that triggers abort; timer cleanup is guaranteed to avoid late firing after Promise.race settles.
- Pass the AbortSignal from the caller when fetching track URLs to prevent late state updates.

## 🔌 Adapters & Platform Configuration

- MusicConfig defines server/type/id at the logic level; concrete request building and response parsing are implemented by adapters.
- Adapters provide playlist fetch and track-level URL building to support both one-time playlist retrieval and per-track fallback when needed.
- Extending adapters allows adding or prioritizing alternative sources without changing component-level logic.
