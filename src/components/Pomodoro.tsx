import React, { useEffect, useRef, useState } from "react";
import {
    LONG_BREAK_INTERVAL,
    MS_PER_SECOND,
    SECONDS_PER_MINUTE,
    STORAGE_KEYS,
    TIMER_CHECK_INTERVAL_MS,
} from "../constants";
import type { Settings } from "../types";
import { TimerMode } from "../types";
import { useTranslation } from "../utils/i18n";
import { useSound } from "./SoundManager";
import { Button, Panel } from "./ui";

interface PomodoroProps {
    settings: Settings;
    sessionCount: number;
    onSessionsUpdate: (count: number) => void;
    // 将 isActive 明确传递给父组件，方便父组件区分「有剩余但已暂停」与「正在运行」
    onTick?: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
}

// 持久化计时器负载类型
type TimerPayload = {
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    startTs?: number;
};

const Pomodoro: React.FC<PomodoroProps> = ({
    settings,
    sessionCount,
    onSessionsUpdate,
    onTick,
}) => {
    const t = useTranslation(settings.language);
    const playSound = useSound(settings.soundEnabled, settings.soundVolume);

    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    // 在恢复流程期间阻止 resetTimer 覆盖刚从存储中恢复的计时状态（记录本次恢复到的 mode）
    const restoredModeRef = useRef<TimerMode | null>(null);
    // 标记是否应该在 resetTimer 后自动开始
    const shouldAutoStartRef = useRef(false);

    // 本地状态：模式、剩余时间、是否激活
    const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
    const [timeLeft, setTimeLeft] = useState<number>(
        () => settings.workDuration * SECONDS_PER_MINUTE,
    );
    const [isActive, setIsActive] = useState<boolean>(false);

    // 从 sessionStorage 恢复计时器（仅在挂载时执行）
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEYS.TIMER);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
                return;

            const candidateMode = parsed.mode as TimerMode | undefined;
            const candidateTime =
                typeof parsed.timeLeft === "number" ? parsed.timeLeft : null;
            const candidateActive = Boolean(parsed.isActive);
            const candidateStart =
                typeof parsed.startTs === "number" ? parsed.startTs : null;

            let restoredMode: TimerMode | undefined;
            let restoredTime: number | null = null;
            let restoredActive = false;
            let restoredStart: number | null = null;

            if (candidateMode) restoredMode = candidateMode;

            if (candidateTime != null) {
                let restored = candidateTime;
                if (candidateActive && candidateStart) {
                    const elapsed = Math.floor(
                        (Date.now() - candidateStart) / MS_PER_SECOND,
                    );
                    restored = Math.max(0, candidateTime - elapsed);
                    restoredStart = candidateStart;
                }
                restoredTime = restored;
                restoredActive = Boolean(candidateActive && restored > 0);
            }

            // 将多个 state 更新合并并标记为已恢复，避免随后 resetTimer 覆盖
            if (
                restoredMode !== undefined ||
                restoredTime !== null ||
                restoredActive ||
                restoredStart !== null
            ) {
                // 记录本次从存储中恢复使用的模式，用于跳过随后对应 mode 的首次 reset
                restoredModeRef.current = restoredMode ?? mode;
                if (restoredMode !== undefined) setMode(restoredMode);
                if (restoredTime !== null) setTimeLeft(restoredTime);
                setIsActive(restoredActive);
                if (restoredStart !== null) {
                    // 如果是工作模式并且存在 startTs，应用到父级统计（通过 onTick 父组件会同步 start）
                    // 这里仅触发一次 onTick 以同步外部状态（包含 isActive）
                    if (onTick)
                        onTick(
                            restoredTime as number,
                            restoredMode ?? TimerMode.WORK,
                            restoredActive,
                        );
                } else {
                    if (restoredTime !== null && onTick)
                        onTick(
                            restoredTime,
                            restoredMode ?? TimerMode.WORK,
                            restoredActive,
                        );
                }
            }
        } catch (err) {
            console.error(
                "Failed to parse timer payload from sessionStorage",
                err,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 将计时器状态持久化到 sessionStorage（mode / timeLeft / isActive 变化时更新）
    useEffect(() => {
        try {
            const payload: TimerPayload = { mode, timeLeft, isActive };
            if (isActive) {
                const total = getTotalTime();
                const elapsed = total - timeLeft;
                payload.startTs = Date.now() - elapsed * MS_PER_SECOND;
            }
            sessionStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(payload));
        } catch (err) {
            if (err instanceof Error && err.name === "QuotaExceededError") {
                console.warn(
                    "sessionStorage quota exceeded, timer state will not persist",
                );
            } else {
                console.error(
                    "Failed to persist timer payload to sessionStorage",
                    err,
                );
            }
        }
        // 依赖包括 settings 的周期性参数，防止 totalTime 变化导致不一致
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mode,
        timeLeft,
        isActive,
        settings.workDuration,
        settings.shortBreakDuration,
        settings.longBreakDuration,
    ]);

    useEffect(() => {
        // 如果刚刚从 sessionStorage 恢复到当前 mode，跳过本次 reset（避免覆盖恢复的剩余时间/运行状态）
        if (restoredModeRef.current && restoredModeRef.current === mode) {
            restoredModeRef.current = null;
            return;
        }
        resetTimer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mode,
        settings.workDuration,
        settings.shortBreakDuration,
        settings.longBreakDuration,
    ]);

    const resetTimer = () => {
        const shouldAutoStart = shouldAutoStartRef.current;
        shouldAutoStartRef.current = false;

        let newTime = 0;
        switch (mode) {
            case TimerMode.WORK:
                newTime = settingsRef.current.workDuration * SECONDS_PER_MINUTE;
                break;
            case TimerMode.SHORT_BREAK:
                newTime =
                    settingsRef.current.shortBreakDuration * SECONDS_PER_MINUTE;
                break;
            case TimerMode.LONG_BREAK:
                newTime =
                    settingsRef.current.longBreakDuration * SECONDS_PER_MINUTE;
                break;
        }
        setTimeLeft(newTime);
        setIsActive(shouldAutoStart);
        if (shouldAutoStart) playSound("start");
        if (onTick) onTick(newTime, mode, shouldAutoStart);
    };

    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            return;
        }

        const startTime = Date.now();
        const expectedEndTime = startTime + timeLeft * MS_PER_SECOND;

        const interval = window.setInterval(() => {
            const now = Date.now();
            const remaining = Math.ceil(
                (expectedEndTime - now) / MS_PER_SECOND,
            );

            if (remaining <= 0) {
                setTimeLeft(0);
                if (onTick) onTick(0, mode, true);
                clearInterval(interval);
                handleComplete();
            } else if (remaining !== timeLeft) {
                setTimeLeft(remaining);
                if (onTick) onTick(remaining, mode, true);
            }
        }, TIMER_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, timeLeft]);

    const sendNotification = (title: string, body: string) => {
        if (!settingsRef.current.notificationsEnabled) return;

        if ("Notification" in window && Notification.permission === "granted") {
            try {
                const n = new Notification(title, {
                    body,
                    icon: "/pwa-192x192.png",
                    requireInteraction: true,
                    silent: false,
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (e) {
                console.error("Notification error:", e);
            }
        }
    };

    const handleComplete = () => {
        playSound("end");

        if (mode === TimerMode.WORK) {
            sendNotification(
                t("NOTIFICATION_WORK_COMPLETE_TITLE"),
                t("NOTIFICATION_WORK_COMPLETE_BODY"),
            );
            const newCount = sessionCount + 1;
            onSessionsUpdate(newCount);

            shouldAutoStartRef.current = settingsRef.current.autoStartBreaks;
            if (newCount % LONG_BREAK_INTERVAL === 0) {
                setMode(TimerMode.LONG_BREAK);
            } else {
                setMode(TimerMode.SHORT_BREAK);
            }
        } else {
            sendNotification(
                t("NOTIFICATION_BREAK_COMPLETE_TITLE"),
                t("NOTIFICATION_BREAK_COMPLETE_BODY"),
            );
            shouldAutoStartRef.current = settingsRef.current.autoStartWork;
            setMode(TimerMode.WORK);
        }
    };

    const toggleTimer = () => {
        if (!isActive) playSound("start");
        const next = !isActive;
        setIsActive(next);
        // 主动通知父组件当前剩余时间、模式与运行状态，确保在暂停/恢复时父组件（footer/title）立即同步状态
        if (onTick) onTick(timeLeft, mode, next);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / SECONDS_PER_MINUTE);
        const s = seconds % SECONDS_PER_MINUTE;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const getTotalTime = () => {
        return mode === TimerMode.WORK
            ? settings.workDuration * SECONDS_PER_MINUTE
            : mode === TimerMode.SHORT_BREAK
              ? settings.shortBreakDuration * SECONDS_PER_MINUTE
              : settings.longBreakDuration * SECONDS_PER_MINUTE;
    };

    const progress = (() => {
        const total = getTotalTime();
        return total > 0 ? ((total - timeLeft) / total) * 100 : 0;
    })();

    const getStatusText = () => {
        if (!isActive) {
            if (timeLeft === getTotalTime()) {
                return t("STANDBY");
            }
            return t("PAUSED_STATUS");
        }
        switch (mode) {
            case TimerMode.WORK:
                return t("MODE_WORK");
            case TimerMode.SHORT_BREAK:
                return t("MODE_SHORT");
            case TimerMode.LONG_BREAK:
                return t("MODE_LONG");
            default:
                return t("MODE_WORK");
        }
    };

    return (
        <Panel
            className="w-full h-full min-h-full p-6 md:p-8 bg-theme-surface/70 backdrop-blur-lg"
            title={t("CHRONO_MODULE")}
        >
            <div className="flex flex-col h-full w-full items-center gap-6 relative">
                {/* 顶部信息 */}
                <div className="w-full flex justify-between items-start border-b border-theme-highlight/30 pb-4 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-ui-micro text-theme-dim tracking-ui-widest uppercase mb-1">
                            {t("STATUS")}
                        </span>
                        <div
                            className={`text-ui-xl font-ui-mono font-bold tracking-ui-widest ${isActive ? (mode === TimerMode.WORK ? "text-theme-primary" : "text-theme-secondary") : "text-theme-dim"}`}
                        >
                            {getStatusText()}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            className="w-8 h-8 p-0 text-theme-dim hover:text-theme-primary border-theme-dim/20 hover:border-theme-primary/50"
                            onClick={() => onSessionsUpdate(0)}
                            title={t("RESET_SESSIONS")}
                        >
                            <i className="ri-refresh-line icon-ui-lg"></i>
                        </Button>
                        <div className="text-right">
                            <span className="text-ui-micro text-theme-dim tracking-ui-widest uppercase mb-1 block">
                                {t("SESSIONS_COMPLETED")}
                            </span>
                            <div className="text-ui-2xl font-ui-mono text-theme-text">
                                {sessionCount.toString().padStart(2, "0")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 计时器显示 */}
                <div className="flex-1 w-full flex items-center justify-center relative py-10 md:py-12 min-h-[22rem] md:min-h-[27rem]">
                    <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px] flex items-center justify-center shrink-0 group max-w-full max-h-full animate-float">
                        {/* 装饰性外圈 */}
                        <div className="absolute inset-0 rounded-full border-2 border-theme-primary/20 animate-spin-slow"></div>
                        <div className="absolute inset-4 rounded-full border border-theme-accent/20"></div>

                        <svg
                            className="absolute w-full h-full transform -rotate-90"
                            viewBox="0 0 256 256"
                        >
                            {/* 轨道 */}
                            <circle
                                className="text-theme-highlight/30"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="transparent"
                                r="120"
                                cx="128"
                                cy="128"
                            />
                            {/* 进度 */}
                            <circle
                                className={`transition-all duration-1000 ease-linear`}
                                strokeWidth="6"
                                strokeDasharray={2 * Math.PI * 120}
                                strokeDashoffset={
                                    2 * Math.PI * 120 * (1 - progress / 100)
                                }
                                strokeLinecap="round"
                                stroke="url(#gradient)"
                                fill="transparent"
                                r="120"
                                cx="128"
                                cy="128"
                            />
                            {/* 渐变定义 */}
                            <defs>
                                <linearGradient
                                    id="gradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="0%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--color-primary)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-accent)"
                                    />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* 时间文本 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none">
                            <span
                                className={`text-ui-display md:text-ui-display-xl font-ui-mono font-bold gradient-text tabular-nums`}
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-ui-xs text-theme-dim font-ui-mono mt-3 uppercase tracking-ui-wider">
                                {t("TIME_REMAINING")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 控制 */}
                <div className="w-full grid grid-cols-3 gap-6 shrink-0">
                    <Button
                        onClick={toggleTimer}
                        variant={isActive ? "secondary" : "primary"}
                        className="col-span-1 h-[60px] text-ui-lg"
                        title={isActive ? t("PAUSE") : t("INITIALIZE")}
                    >
                        {isActive ? t("PAUSE") : t("INITIALIZE")}
                    </Button>
                    <Button
                        onClick={resetTimer}
                        variant="ghost"
                        className="col-span-1 h-[60px] border border-theme-highlight/30 hover:border-theme-primary"
                        title={t("RESET_TIMER")}
                        aria-label={t("RESET_TIMER")}
                    >
                        <i className="ri-restart-line icon-ui-2xl"></i>
                    </Button>
                    <Button
                        onClick={handleComplete}
                        variant="ghost"
                        className="col-span-1 h-[60px] border border-theme-highlight/30 hover:border-theme-primary"
                        title={t("SKIP_TIMER")}
                        aria-label={t("SKIP_TIMER")}
                    >
                        <i className="ri-skip-forward-line icon-ui-2xl"></i>
                    </Button>
                </div>
            </div>
        </Panel>
    );
};

export default Pomodoro;
