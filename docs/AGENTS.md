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
│   │   ├── MessageDisplay.tsx  # Message display component
│   │   ├── MikuDecorations.tsx # Miku theme exclusive decoration component
│   │   ├── MusicPlayer.tsx     # Online music player component
│   │   ├── PlayerInterface.tsx # Player UI interface component
│   │   ├── Pomodoro.tsx        # Pomodoro core component
│   │   ├── PWAPrompt.tsx       # PWA prompt component
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
│   │   └── useOnlinePlayer.ts  # Online player logic Hook
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

**Note:** Although React Compiler provides automatic optimization, explicit hook calls are still retained in the following scenarios:
- When ensuring object/function reference stability (such as props passed to child components)
- When involving complex dependency relationships
- To improve code readability and explicit intent
