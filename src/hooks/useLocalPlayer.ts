import { useState, useRef, useEffect, useCallback } from 'react';
import { parseBlob } from 'music-metadata';
import { AUDIO_LOADING_TIMEOUT_MS, TIME_UPDATE_THROTTLE_SECONDS, STORAGE_KEYS } from '../constants';
import { PlayMode } from '../types';
import { DEFAULT_MUSIC_VOLUME } from '../config/musicConfig';

export interface LocalTrack {
    id: string;
    file: File;
    name: string;
    artist?: string;
    blobUrl: string;
    coverUrl?: string;
}



export const useLocalPlayer = (enabled: boolean = true) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastTimeRef = useRef(0);
    const [playlist, setPlaylist] = useState<LocalTrack[]>([]);
    // 使用 ref 追踪 playlist，确保即使组件卸载也能正确清理 Blob URL
    const playlistRef = useRef<LocalTrack[]>([]);
    
    // 更新 ref 以保持与 state 同步
    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_VOLUME);
        const parsed = stored ? Number(stored) : NaN;
        return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_MUSIC_VOLUME;
    });
    const [playMode, setPlayMode] = useState<PlayMode>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_PLAY_MODE);
        if (stored === PlayMode.SEQUENCE || stored === PlayMode.LOOP || stored === PlayMode.RANDOM) {
            return stored;
        }
        return PlayMode.RANDOM;
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // 用 ref 保存 handleNext 以避免闭包问题
    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);
    // 用 ref 追踪播放状态，避免 handlePrev 依赖 isPlaying 导致不必要的重建
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // 切歌逻辑
    const handleNext = useCallback((isAuto: boolean = false) => {
        if (playlist.length === 0) return;

        if (playMode === PlayMode.LOOP && isAuto) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                if (isPlayingRef.current) {
                    audioRef.current.play();
                }
            }
            return;
        }

        let nextIndex: number;
        if (playMode === PlayMode.RANDOM) {
            if (playlist.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentIndex);
            } else {
                nextIndex = 0;
            }
        } else {
            nextIndex = (currentIndex + 1) % playlist.length;
        }

        setCurrentIndex(nextIndex);
        // 不调用 setIsPlaying，保持当前播放状态
    }, [playlist.length, playMode, currentIndex]);

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    // 初始化 Audio 对象（只执行一次）
    useEffect(() => {
        const audio = new Audio();
        // 不在这里设置音量，由专门的音量 effect 处理
        audioRef.current = audio;

        const onTimeUpdate = () => {
            const time = audio.currentTime;
            if (Math.abs(time - lastTimeRef.current) >= TIME_UPDATE_THROTTLE_SECONDS) {
                lastTimeRef.current = time;
                setCurrentTime(time);
            }
        };
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const onEnded = () => handleNextRef.current?.(true);
        const onCanPlay = () => setIsLoading(false);
        const onWaiting = () => setIsLoading(true);
        const onError = () => {
            setIsLoading(false);
            console.error('Audio playback error');
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('error', onError);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('error', onError);
        };
    }, []);

    // 监听音量变化
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIO_VOLUME, String(volume));
        } catch (error) {
            console.error('Failed to persist audio volume', error);
        }
    }, [volume]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIO_PLAY_MODE, playMode);
        } catch (error) {
            console.error('Failed to persist audio play mode', error);
        }
    }, [playMode]);

    // 监听当前曲目变化 - 加载音频
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || currentIndex < 0 || currentIndex >= playlist.length) return;

        const track = playlist[currentIndex];
        if (!track?.blobUrl) return;

        // 只在 URL 真正变化时才重新加载
        if (audio.src !== track.blobUrl) {
            const wasPlaying = isPlaying;
            // 使用 queueMicrotask 避免同步更新状态
            queueMicrotask(() => setIsLoading(true));
            audio.src = track.blobUrl;
            audio.load();

            if (wasPlaying) {
                audio.play().catch(err => {
                    console.error('Playback failed:', err);
                    setIsPlaying(false);
                });
            }
        }
    }, [currentIndex, playlist, isPlaying]);

    // 监听播放状态变化
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || currentIndex < 0) return;

        if (isPlaying && audio.paused && audio.readyState >= 2) {
            audio.play().catch(err => {
                console.error('Playback failed:', err);
                setIsPlaying(false);
            });
        } else if (isPlaying && audio.readyState < 2) {
            const onCanPlay = () => {
                audio.play().catch(err => {
                    console.error('Playback failed:', err);
                    setIsPlaying(false);
                });
            };
            audio.addEventListener('canplay', onCanPlay, { once: true });

            const timeoutId = setTimeout(() => {
                if (audioRef.current && audioRef.current.readyState < 2) {
                    console.warn('Audio loading timeout');
                    setIsPlaying(false);
                }
            }, AUDIO_LOADING_TIMEOUT_MS);

            return () => {
                clearTimeout(timeoutId);
                audio.removeEventListener('canplay', onCanPlay);
            };
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [isPlaying, currentIndex]);

    // 当禁用时暂停播放
    useEffect(() => {
        if (!enabled && audioRef.current) {
            audioRef.current.pause();
            // 使用 queueMicrotask 避免同步更新状态
            queueMicrotask(() => setIsPlaying(false));
        }
    }, [enabled]);

    // 添加文件到播放列表（渐进式加载：先显示文件名，后台更新元数据）
    const addFiles = useCallback(async (files: File[]) => {
        // 过滤重复文件
        const uniqueFiles = files.filter(file => {
            const isDuplicate = playlistRef.current.some(track => 
                track.file.name === file.name &&
                track.file.size === file.size &&
                track.file.lastModified === file.lastModified
            );
            if (isDuplicate) {
                console.warn(`Skip duplicate file: ${file.name}`);
            }
            return !isDuplicate;
        });

        if (uniqueFiles.length === 0) return;

        // 第一步：立即用文件名创建列表项
        const initialTracks: LocalTrack[] = uniqueFiles.map(file => ({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            name: file.name.replace(/\.[^/.]+$/, ''),
            artist: undefined,
            blobUrl: URL.createObjectURL(file),
            coverUrl: undefined
        }));

        setPlaylist(prev => {
            const updated = [...prev, ...initialTracks];
            if (prev.length === 0 && updated.length > 0) {
                setCurrentIndex(0);
            }
            return updated;
        });

        // 第二步：后台并行解析元数据，逐个更新
        uniqueFiles.forEach(async (file) => {
            const trackId = `${file.name}-${file.size}-${file.lastModified}`;
            
            try {
                const metadata = await parseBlob(file);
                const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, '');
                const artist = metadata.common.artist;
                const picture = metadata.common.picture?.[0];
                let coverUrl: string | undefined;
                
                if (picture) {
                    const blob = new Blob([picture.data as BlobPart], { type: picture.format });
                    coverUrl = URL.createObjectURL(blob);
                }

                // 更新对应的 track
                setPlaylist(prev => prev.map(track => 
                    track.id === trackId 
                        ? { ...track, name: title, artist, coverUrl }
                        : track
                ));
            } catch (error) {
                console.warn('Failed to extract metadata:', error);
            }
        });
    }, []);

    // 播放指定曲目（可选保持当前播放状态）
    const playTrack = useCallback((index: number, keepPlayState: boolean = false) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentIndex(index);
            if (!keepPlayState) {
                setIsPlaying(true);
            }
        }
    }, [playlist.length]);

    // 播放/暂停切换
    const togglePlay = useCallback(() => {
        if (playlist.length === 0) return;

        if (currentIndex === -1) {
            playTrack(0);
            return;
        }

        setIsPlaying(prev => !prev);
    }, [playlist.length, currentIndex, playTrack]);

    // 上一曲
    const handlePrev = useCallback(() => {
        if (playlist.length === 0) return;

        if (playMode === PlayMode.LOOP) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                if (isPlayingRef.current) {
                    audioRef.current.play();
                }
            }
            return;
        }

        let prevIndex: number;
        if (playMode === PlayMode.RANDOM && playlist.length > 1) {
            do {
                prevIndex = Math.floor(Math.random() * playlist.length);
            } while (prevIndex === currentIndex);
        } else {
            prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }

        setCurrentIndex(prevIndex);
        // 不调用 setIsPlaying，保持当前播放状态
    }, [playlist.length, playMode, currentIndex]);

    // 进度跳转
    const seek = useCallback((time: number) => {
        if (audioRef.current && duration > 0) {
            const newTime = Math.max(0, Math.min(time, duration));
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }, [duration]);

    // 切换播放模式
    const toggleMode = useCallback(() => {
        setPlayMode(prev => {
            if (prev === PlayMode.SEQUENCE) return PlayMode.LOOP;
            if (prev === PlayMode.LOOP) return PlayMode.RANDOM;
            return PlayMode.SEQUENCE;
        });
    }, []);

    // 删除曲目
    const removeTrack = useCallback((index: number) => {
        setPlaylist(prev => {
            const track = prev[index];
            if (track) {
                URL.revokeObjectURL(track.blobUrl);
                if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
            }

            const newList = prev.filter((_, i) => i !== index);

            // 调整当前索引
            if (index === currentIndex) {
                if (newList.length === 0) {
                    setCurrentIndex(-1);
                    setIsPlaying(false);
                } else if (index >= newList.length) {
                    setCurrentIndex(newList.length - 1);
                }
            } else if (index < currentIndex) {
                setCurrentIndex(prev => prev - 1);
            }

            return newList;
        });
    }, [currentIndex]);

    // 清空播放列表
    const clearPlaylist = useCallback(() => {
        playlist.forEach(track => {
            URL.revokeObjectURL(track.blobUrl);
            if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
        });
        setPlaylist([]);
        setCurrentIndex(-1);
        setIsPlaying(false);
    }, [playlist]);

    // 组件卸载时清理所有 Blob URL
    useEffect(() => {
        return () => {
            // 使用 ref 中的最新 playlist，而不是闭包中的初始空 playlist
            playlistRef.current.forEach(track => {
                URL.revokeObjectURL(track.blobUrl);
                if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
            });
        };
    }, []);

    const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null;

    return {
        // 状态
        playlist,
        currentTrack,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playMode,
        isLoading,
        // 控制方法
        addFiles,
        playTrack,
        togglePlay,
        handleNext: () => handleNext(false),
        handlePrev,
        seek,
        setVolume,
        toggleMode,
        removeTrack,
        clearPlaylist
    };
};
