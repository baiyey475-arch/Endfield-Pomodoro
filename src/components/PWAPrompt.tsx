import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
import { Language } from "../types";
import { useTranslation } from "../utils/i18n";

interface PWAPromptProps {
    language: Language;
}

export function PWAPrompt({ language }: PWAPromptProps) {
    // 使用 Ref 存储 SW 注册实例
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastVisibilityCheckRef = useRef<number>(0);
    const [showUpdated, setShowUpdated] = useState(false);
    const t = useTranslation(language);

    useRegisterSW({
        // 注册成功的回调
        onRegistered(r) {
            if (r) {
                registrationRef.current = r;

                // 立即检查一次
                r.update();
                console.log("[PWA] Registered & Initial check fired");

                // 设置轮询 (每小时)
                if (intervalRef.current) clearInterval(intervalRef.current);

                intervalRef.current = window.setInterval(() => {
                    console.log("[PWA] Hourly check fired");
                    r.update();
                }, HOURLY_CHECK_INTERVAL_MS);
            }
        },
        onRegisterError(error) {
            console.error("[PWA] Registration error:", error);
        },
    });

    // 监听 controllerchange 事件，新 SW 激活时显示提示
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        let timeoutId: number | null = null;

        const handleControllerChange = () => {
            console.log(
                "[PWA] Controller changed, showing update notification...",
            );
            setShowUpdated(true);

            // 3 秒后自动刷新页面
            timeoutId = window.setTimeout(() => {
                window.location.reload();
            }, 3000);
        };

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            handleControllerChange,
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                handleControllerChange,
            );
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    // 处理可见性变化监听与组件卸载清理
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") return;
            const r = registrationRef.current;
            if (!r) return;
            const now = Date.now();
            if (
                now - lastVisibilityCheckRef.current <
                VISIBILITY_CHECK_MIN_INTERVAL_MS
            )
                return;
            lastVisibilityCheckRef.current = now;
            console.log("[PWA] Visibility visible, checking update...");
            r.update();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // 只在更新完成时显示提示
    if (!showUpdated) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] p-3 bg-theme-surface border border-theme-primary shadow-lg max-w-xs animate-in slide-in-from-bottom-2 duration-300"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-2">
                <i className="ri-check-line text-theme-success text-lg flex-shrink-0" />
                <p className="text-theme-text font-mono text-xs font-bold">
                    {t("pwa_updated")}
                </p>
            </div>
        </div>
    );
}

export default PWAPrompt;
