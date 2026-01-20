import React from 'react';
import Pomodoro from './Pomodoro';
import TaskManager from './TaskManager';
import AudioPlayer from './AudioPlayer';
import type { Settings } from '../types';
import { TimerMode } from '../types';

type DashboardProps = {
  settings: Settings;
  sessionCount: number;
  isOnline: boolean;
  onSessionsUpdate: (newCount: number) => void;
  onTick: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
};

const Dashboard: React.FC<DashboardProps> = ({ settings, sessionCount, isOnline, onSessionsUpdate, onTick }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto max-w-7xl mx-auto w-full">
      <div className="lg:col-span-7 flex flex-col h-auto min-h-[420px] md:h-[500px]">
        <Pomodoro
          settings={settings}
          sessionCount={sessionCount}
          onSessionsUpdate={onSessionsUpdate}
          onTick={onTick}
        />
      </div>

      <div className="lg:col-span-5 flex flex-col gap-6 h-auto">
        <div className="h-auto min-h-[220px]">
          <TaskManager language={settings.language} />
        </div>
        <div className="h-auto min-h-[180px] md:h-48 shrink-0">
          <AudioPlayer language={settings.language} musicConfig={settings.musicConfig} isOnline={isOnline} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
