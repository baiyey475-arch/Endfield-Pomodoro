import React from "react";
import type { Settings } from "../types";
import { TimerMode } from "../types";
import AudioPlayer from "./AudioPlayer";
import Pomodoro from "./Pomodoro";
import TaskManager from "./TaskManager";
import { Panel } from "./ui";

type DashboardProps = {
    settings: Settings;
    sessionCount: number;
    isOnline: boolean;
    onSessionsUpdate: (newCount: number) => void;
    onTick: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
};

const Dashboard: React.FC<DashboardProps> = ({
    settings,
    sessionCount,
    isOnline,
    onSessionsUpdate,
    onTick,
}) => {
    // 计算统计数据
    const totalWorkTime = sessionCount * settings.workDuration;
    const totalBreakTime =
        (sessionCount *
            (settings.shortBreakDuration + settings.longBreakDuration)) /
        2;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:items-stretch max-w-7xl mx-auto w-full p-4">
            {/* 统计面板 */}
            <div className="lg:col-span-12">
                <Panel className="p-6" title="系统统计">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center stat-item">
                            <div className="text-ui-3xl font-bold gradient-text mb-2 stat-number">
                                {sessionCount}
                            </div>
                            <div className="text-ui-sm text-theme-dim stat-label">
                                完成的工作周期
                            </div>
                        </div>
                        <div className="text-center stat-item">
                            <div className="text-ui-3xl font-bold gradient-text mb-2 stat-number">
                                {totalWorkTime}
                            </div>
                            <div className="text-ui-sm text-theme-dim stat-label">
                                累计工作时间 (分钟)
                            </div>
                        </div>
                        <div className="text-center stat-item">
                            <div className="text-ui-3xl font-bold gradient-text mb-2 stat-number">
                                {totalBreakTime}
                            </div>
                            <div className="text-ui-sm text-theme-dim stat-label">
                                累计休息时间 (分钟)
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>

            <div className="lg:col-span-7 flex flex-col min-h-[36rem] lg:min-h-[42rem] xl:min-h-[44rem] h-full">
                <Pomodoro
                    settings={settings}
                    sessionCount={sessionCount}
                    onSessionsUpdate={onSessionsUpdate}
                    onTick={onTick}
                />
            </div>

            <div className="lg:col-span-5 flex flex-col lg:grid lg:grid-rows-[minmax(0,1fr)_15rem] gap-8 min-h-[32rem] lg:min-h-[42rem] xl:min-h-[44rem] h-full">
                <div className="min-h-[18rem] lg:min-h-0 h-full">
                    <TaskManager language={settings.language} />
                </div>
                <div className="min-h-[14rem] lg:h-[15rem] shrink-0">
                    <AudioPlayer
                        language={settings.language}
                        musicConfig={settings.musicConfig}
                        isOnline={isOnline}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
