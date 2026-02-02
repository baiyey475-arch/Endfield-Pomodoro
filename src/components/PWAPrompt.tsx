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

        // 使用 ref 记录初始 controller 状态，确保只在后续更新时提示
        // 如果在组件挂载时 controller 为空，说明是首次安装，不应该提示更新
        const hadController = !!navigator.serviceWorker.controller;

        const handleControllerChange = () => {
            if (!hadController) {
                // 如果初始没有 controller，说明是首次安装引发的变更，忽略
                return;
            }

            console.log(
                "[PWA] Controller changed, showing update notification...",
            );
            setShowUpdated(true);
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
        };
    }, []);

    // 处理可见性变化监听与组件卸载清理
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") {
                return;
            }
            const registration = registrationRef.current;
            if (!registration) {
                return;
            }
            const now = Date.now();
            if (
                now - lastVisibilityCheckRef.current <
                VISIBILITY_CHECK_MIN_INTERVAL_MS
            ) {
                return;
            }
            lastVisibilityCheckRef.current = now;
            console.log("[PWA] Visibility visible, checking update...");
            registration.update();
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
            <div className="flex items-center gap-3">
                <i className="ri-check-line text-theme-success text-lg flex-shrink-0" />
                <p className="text-theme-text font-mono text-xs font-bold flex-grow">
                    {t("pwa_updated")}
                </p>
                <button
                    onClick={() => setShowUpdated(false)}
                    className="p-1 hover:bg-theme-primary/10 rounded transition-colors group"
                    aria-label={t("pwa_close") || "Close"}
                    title={t("pwa_close") || "Close"}
                >
                    <i className="ri-close-line text-theme-text/60 group-hover:text-theme-text text-lg" />
                </button>
            </div>
        </div>
    );
}

export default PWAPrompt;
