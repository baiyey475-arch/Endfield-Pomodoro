import React, { useState, useEffect, useLayoutEffect } from 'react';
import type { Settings } from './types';
import { Language, ThemePreset, TimerMode, View } from './types';
import { BackgroundLayer, ForegroundLayer } from './components/TerminalUI';
import { MikuDecorations } from './components/MikuDecorations';
import { PWAPrompt } from './components/PWAPrompt';
import HeaderBar from './components/HeaderBar';
import FooterStats from './components/FooterStats';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';
import { useFooterHeight, getThemeExtraSpacing } from './hooks/useFooterHeight';
import { useSessionStats } from './hooks/useSessionStats';
import { useTranslation } from './utils/i18n';
import { STORAGE_KEYS, SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from './constants';
import { defaultMusicConfig } from './config/musicConfig';
import { THEMES } from './config/themes';
import pkg from '../package.json';

const DEFAULT_SETTINGS: Settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    autoStartWork: true,
    soundEnabled: true,
    soundVolume: 0.5,
    notificationsEnabled: false,
    language: ((() => {
        const browserLangs = navigator.languages || [navigator.language];
        return browserLangs.some(lang => lang?.toLowerCase().startsWith('zh')) ? Language.CN : Language.EN;
    })()),
    theme: ThemePreset.INDUSTRIAL,
    musicConfig: defaultMusicConfig
};


const App: React.FC = () => {
    // 从localStorage加载设置
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
                    // 检测通知权限被撤销时自动取消勾选
                    if (loadedSettings.notificationsEnabled && 'Notification' in window && Notification.permission === 'denied') {
                        loadedSettings.notificationsEnabled = false;
                    }
                    return loadedSettings;
                }
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
        return DEFAULT_SETTINGS;
    });

    // 临时音乐配置状态，用于在点击应用前存储更改
    const [tempMusicConfig, setTempMusicConfig] = useState(settings.musicConfig);

    const {
        sessionCount,
        hours,
        minutes,
        seconds,
        isTimerRunning,
        remainingSeconds,
        remainingMode,
        onSessionsUpdate,
        onTick
    } = useSessionStats(settings.workDuration);

    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [now, setNow] = useState(new Date());
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    // Footer ref 和高度 - 用于 footer 元素和 Miku 装饰组件
    const { footerRef, footerHeight } = useFooterHeight();

    const t = useTranslation(settings.language);

    // 辅助函数：更新临时音乐配置
    const handleMusicConfigChange = (key: keyof Settings['musicConfig'], value: string) => {
        setTempMusicConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 应用音乐配置
    const applyMusicConfig = () => {
        setSettings(prev => ({
            ...prev,
            musicConfig: tempMusicConfig
        }));
    };

    // 更新文档标题：当标签页不可见且计时器在运行时显示实时倒计时，否则显示应用标题
    useEffect(() => {
        const restoreTitle = () => { document.title = t('APP_TITLE'); };

        const handleVisibility = () => {
            if (!document.hidden) restoreTitle();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        if (document.hidden && isTimerRunning && remainingSeconds != null) {
            const remaining = Math.max(0, remainingSeconds);
            const h = Math.floor(remaining / SECONDS_PER_HOUR);
            const m = Math.floor((remaining % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
            const s = remaining % SECONDS_PER_MINUTE;
            const fmt = h > 0
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            // 休息时也显示模式标签（根据当前语言选择本地化短标签）
            const modeLabel = remainingMode && remainingMode !== TimerMode.WORK
                ? ` ${settings.language === Language.CN ? '休息' : 'Break'}`
                : '';
            document.title = `${fmt}${modeLabel} • ${t('APP_TITLE')}`;
        } else {
            // 仅在当前标题与默认标题不同时才恢复，避免在可见时每秒重复写入 document.title
            if (document.title !== t('APP_TITLE')) {
                restoreTitle();
            }
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            restoreTitle();
        };
    }, [isTimerRunning, remainingSeconds, remainingMode, t, settings.language]);

    // 持久化设置
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to persist settings', e);
        }
    }, [settings]);

    // 应用主题
    useLayoutEffect(() => {
        const root = document.documentElement;
        const themeColors = THEMES[settings.theme];
        Object.entries(themeColors).forEach(([key, value]) => {
            root.style.setProperty(key, value as string);
        });
    }, [settings.theme]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(timer);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="h-[100dvh] bg-theme-base text-theme-text font-sans selection:bg-theme-primary selection:text-theme-base flex flex-col overflow-hidden transition-colors duration-500 relative cursor-default">
            {/* 背景视觉效果 (Z-0) */}
            <BackgroundLayer theme={settings.theme} />

            {/* Miku 主题专属装饰元素 (Z-5) - 在背景之上，内容之下 */}
            <MikuDecorations theme={settings.theme} footerHeight={footerHeight} />

            {/* 前景HUD视觉效果 (Z-50, pointer-events-none) - 视觉覆盖层 */}
            <ForegroundLayer theme={settings.theme} />

            <HeaderBar
                currentView={currentView}
                onViewChange={setCurrentView}
                now={now}
                isOnline={isOnline}
                version={pkg.version}
                t={t}
            />

            <main className="flex-1 pt-24 md:pt-28 px-4 md:px-12 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col custom-scrollbar" style={{ scrollbarGutter: 'stable', paddingBottom: footerHeight + getThemeExtraSpacing(settings.theme === ThemePreset.MIKU) }}>
                <div className={currentView === View.SETTINGS ? '' : 'hidden'}>
                    <SettingsPanel
                        settings={settings}
                        tempMusicConfig={tempMusicConfig}
                        onSettingsChange={setSettings}
                        onMusicConfigChange={handleMusicConfigChange}
                        onApplyMusicConfig={applyMusicConfig}
                        onResetMusicConfig={() => setTempMusicConfig(DEFAULT_SETTINGS.musicConfig)}
                        t={t}
                    />
                </div>
                <div className={currentView === View.DASHBOARD ? '' : 'hidden'}>
                    <Dashboard
                        settings={settings}
                        sessionCount={sessionCount}
                        isOnline={isOnline}
                        onSessionsUpdate={onSessionsUpdate}
                        onTick={onTick}
                    />
                </div>
            </main>

            <FooterStats
                footerRef={footerRef}
                hours={hours}
                minutes={minutes}
                seconds={seconds}
                t={t}
            />

            {/* PWA 更新提示 */}
            <PWAPrompt language={settings.language} />
        </div>
    );
};

export default App;
