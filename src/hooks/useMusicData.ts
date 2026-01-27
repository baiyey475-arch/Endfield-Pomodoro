import { useCallback, useEffect, useRef, useState } from "react";
import { API_FETCH_DELAY_MS, API_TIMEOUT_MS } from "../constants";
import { getAdapters } from "../utils/musicApiAdapters";

/**
 * 音乐曲目数据结构
 */
export interface MusicTrack {
    /** 歌曲唯一标识符。如果不可用，可能为空字符串。 */
    id: string;
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
    theme?: string;
}

/**
 * useMusicData Hook 的参数
 */
interface UseMusicDataProps {
    server: string;
    type: string;
    id: string;
}

/**
 * 获取音乐数据的 Hook
 *
 * 功能：
 * - 从音乐 API 获取歌单数据
 * - 支持多个 API 适配器的故障转移
 * - 自动超时控制
 * - 请求取消（组件卸载或参数变化时）
 *
 * @param server - 音乐平台（netease/tencent/kugou/baidu/kuwo）
 * @param type - 操作类型（通常为 'playlist'）
 * @param id - 资源 ID（歌单 ID 或搜索关键词）
 */
export const useMusicData = ({ server, type, id }: UseMusicDataProps) => {
    const [audioList, setAudioList] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adapterStartIndex, setAdapterStartIndex] = useState(0);
    const [activeAdapterIndex, setActiveAdapterIndex] = useState<number | null>(
        null,
    );
    const abortControllerRef = useRef<AbortController | null>(null);

    const retryWithNextAdapter = useCallback(() => {
        const adapters = getAdapters();
        if (adapters.length === 0) return;
        setAdapterStartIndex((prev) => (prev + 1) % adapters.length);
    }, []);

    useEffect(() => {
        setAdapterStartIndex(0);
    }, [server, type, id]);

    useEffect(() => {
        if (!server || !type || !id) {
            setLoading(false);
            return;
        }

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setActiveAdapterIndex(null);

            const adapters = getAdapters();

            for (let i = 0; i < adapters.length; i += 1) {
                const adapterIndex = (adapterStartIndex + i) % adapters.length;
                const adapter = adapters[adapterIndex];
                if (controller.signal.aborted) return;

                let timeoutId: ReturnType<typeof setTimeout> | null = null;
                try {
                    const url = adapter.buildUrl({ server, type, id });

                    // 从 adapter.fetchOptions 中移除 signal，以避免覆盖 controller.signal
                    const safeFetchOptions = {
                        ...(adapter.fetchOptions || {}),
                    };
                    if ("signal" in safeFetchOptions) {
                        delete safeFetchOptions.signal;
                    }

                    // 使用 Promise.race 来处理超时，并在完成后清理 setTimeout
                    const response = await Promise.race([
                        fetch(url, {
                            signal: controller.signal,
                            ...safeFetchOptions,
                        }),
                        new Promise<never>((_, reject) => {
                            timeoutId = setTimeout(
                                () =>
                                    reject(new Error("API request timed out")),
                                API_TIMEOUT_MS,
                            );
                        }),
                    ]);

                    // 请求成功，清理超时计时器
                    if (timeoutId) clearTimeout(timeoutId);

                    if (!response.ok)
                        throw new Error(`HTTP ${response.status}`);

                    const data = await response.json();
                    const tracks = adapter.parseResponse(data);

                    setAudioList(tracks);
                    setActiveAdapterIndex(adapterIndex);
                    setLoading(false);
                    return;
                } catch (err) {
                    // 清理超时计时器
                    if (timeoutId) clearTimeout(timeoutId);

                    // 如果是外部中止（组件卸载），则直接返回
                    if (controller.signal.aborted) {
                        return;
                    }
                    // 其他错误（如超时、网络问题），记录并尝试下一个适配器
                    console.warn(`API adapter failed:`, err);
                }
            }

            setError("All APIs failed");
            setLoading(false);
        };

        const timeoutId = setTimeout(fetchData, API_FETCH_DELAY_MS);
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [server, type, id, adapterStartIndex]);

    // 尝试获取单曲的备用 URL
    const fetchTrackUrl = useCallback(
        async (trackId: string, signal?: AbortSignal): Promise<string | null> => {
            const adapters = getAdapters();
            // 尝试除当前使用的适配器以外的其他适配器
            const otherAdapters = adapters.filter(
                (_, index) => index !== activeAdapterIndex,
            );
            // 如果没有其他适配器，或者当前还没有成功连接的适配器，则尝试所有适配器
            const targetAdapters =
                otherAdapters.length > 0 ? otherAdapters : adapters;

            for (const adapter of targetAdapters) {
                if (!adapter.buildTrackUrl) continue;
                if (signal?.aborted) return null;

                try {
                    const url = adapter.buildTrackUrl({ server, id: trackId });
                    const safeFetchOptions = {
                        ...(adapter.fetchOptions || {}),
                    };
                    if ("signal" in safeFetchOptions) {
                        delete safeFetchOptions.signal;
                    }

                    let timeoutId: ReturnType<typeof setTimeout> | null = null;
                    const response = await Promise.race([
                        fetch(url, { ...safeFetchOptions, signal }),
                        new Promise<never>((_, reject) => {
                            timeoutId = setTimeout(
                                () => reject(new Error("Timeout")),
                                API_TIMEOUT_MS,
                            );
                        }),
                    ]);

                    if (timeoutId) clearTimeout(timeoutId);
                    if (!response.ok) continue;

                    const data = await response.json();
                    const tracks = adapter.parseResponse(data);
                    if (tracks.length > 0 && tracks[0].url) {
                        return tracks[0].url;
                    }
                } catch (err) {
                    if (err instanceof DOMException && err.name === "AbortError") {
                        return null;
                    }
                    if (err instanceof Error && err.message === "Timeout") {
                        continue;
                    }
                    console.warn("Track fallback fetch failed:", err);
                }
            }
            return null;
        },
        [server, activeAdapterIndex],
    );

    return {
        audioList,
        loading,
        error,
        retryWithNextAdapter,
        activeAdapterIndex,
        fetchTrackUrl,
    };
};
