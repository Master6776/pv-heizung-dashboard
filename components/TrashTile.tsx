'use client';

import React from 'react';

type TrashType = 'bio' | 'paper' | 'rest' | 'yellow';

interface TrashEvent {
  id: number;
  type: TrashType;
  name: string;
  dateObj: Date;
  icon: string;
}

const TRASH_DATA: TrashEvent[] = [
  { id: 1, type: 'bio', name: 'Biotonne in Massing', dateObj: new Date('2026-08-24'), icon: '🍎' },
  { id: 2, type: 'paper', name: 'Papiertonne in Massing', dateObj: new Date('2026-08-25'), icon: '📦' },
  { id: 3, type: 'rest', name: 'Restmüll in Massing', dateObj: new Date('2026-08-28'), icon: '🗑️' },
  { id: 4, type: 'yellow', name: 'Gelbe Tonne in Massing', dateObj: new Date('2026-09-02'), icon: '♻️' },
  { id: 5, type: 'bio', name: 'Biotonne in Massing', dateObj: new Date('2026-09-07'), icon: '🍎' },
];

const STYLE_MAP: Record<TrashType, { border: string; bg: string; text: string }> = {
  bio: {
    border: 'border-emerald-600/50',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-400',
  },
  paper: {
    border: 'border-blue-600/50',
    bg: 'bg-blue-950/30',
    text: 'text-blue-400',
  },
  rest: {
    border: 'border-slate-600/50',
    bg: 'bg-slate-800/40',
    text: 'text-slate-300',
  },
  yellow: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/30',
    text: 'text-amber-400',
  },
};

export default function TrashTile() {
  const getDaysLeft = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Fester Formatierer ohne Server/Client-Abweichungen
  const formatDate = (date: Date) => {
    const weekdays = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
    const weekday = weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${weekday} ${day}.${month}.${year}`;
  };

  return (
    <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col overflow-hidden bg-slate-900/95 backdrop-blur-md">
      
      {/* Headerbereich */}
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Müllabfuhr</h2>
          <p className="text-sm text-gray-400 mt-0.5">AWV Isar-Inn</p>
        </div>
        <span className="text-3xl drop-shadow-md">🚛</span>
      </div>

      {/* Müll-Liste */}
      <div className="space-y-3 relative z-10">
        {TRASH_DATA.map((event) => {
          const styles = STYLE_MAP[event.type];
          const days = getDaysLeft(event.dateObj);
          const formattedDate = formatDate(event.dateObj);

          if (days < 0) return null;

          let daysText = `in ${days} Tagen`;
          if (days === 0) daysText = 'Heute!';
          if (days === 1) daysText = 'Morgen!';

          return (
            <div
              key={event.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border ${styles.border} ${styles.bg} transition-all`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl drop-shadow-md flex-shrink-0">
                  {event.icon}
                </div>
                
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-wide ${styles.text}`}>
                    {event.name}
                  </span>
                  <span className="text-xs text-gray-300 mt-0.5">
                    {formattedDate}
                  </span>
                </div>
              </div>

              <div className={`ml-3 px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap shadow-inner ${
                days === 0 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                  : 'bg-slate-800/80 border-white/5 text-gray-200'
              }`}>
                {daysText}
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}