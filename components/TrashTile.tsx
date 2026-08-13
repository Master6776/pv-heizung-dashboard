'use client';

import { useEffect, useState } from 'react';

interface TrashEvent {
  type: string;
  date: string;
  daysLeft: number;
  icon: string;
  color: string;
  bgColor: string;
}

export default function TrashTile() {
  const [events, setEvents] = useState<TrashEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchTrashData() {
      try {
        const res = await fetch('/api/trash');
        const json = await res.json();
        if (json.success && json.events) {
          setEvents(json.events);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Mülltermine:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrashData();
  }, []);

  return (
    <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
      <img 
        src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop" 
        alt="Müllabfuhr & Recycling" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>

      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-bold text-white">Müllabfuhr</h2>
            <p className="text-xs text-gray-300">AWV Isar-Inn</p>
          </div>
          <span className="text-2xl">🚛</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Lade Termine...</div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Keine Termine verfügbar</div>
        ) : (
          <div className="space-y-2.5">
            {events.map((event, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-xl border backdrop-blur-md flex items-center justify-between transition-all duration-300 ${event.bgColor}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{event.icon}</span>
                  <div>
                    <div className={`font-bold text-sm ${event.color}`}>{event.type}</div>
                    <div className="text-xs text-gray-300">{event.date}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    event.daysLeft <= 1 
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                      : event.daysLeft <= 3 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-slate-800/80 text-gray-300 border-slate-600/50'
                  }`}>
                    {event.daysLeft === 0 ? 'Heute!' : event.daysLeft === 1 ? 'Morgen!' : `in ${event.daysLeft} Tagen`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}