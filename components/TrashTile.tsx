// components/TrashTile.tsx
'use client';

import { useEffect, useState } from 'react';

interface TrashItem {
  summary: string;
  date: string;
  daysLeft: number;
  color: string;
}

export default function TrashTile() {
  const [nextEvents, setNextEvents] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrashData() {
      try {
        // Korrigiert: Lädt nun korrekt die abfuhr.ics aus dem public-Ordner
        const res = await fetch('/abfuhr.ics');
        if (!res.ok) {
          throw new Error(`Datei /abfuhr.ics nicht gefunden (HTTP ${res.status}).`);
        }
        const text = await res.text();

        const events: TrashItem[] = [];
        const lines = text.split(/\r?\n/);
        let currentSummary = '';
        let currentDateStr = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.startsWith('SUMMARY:')) {
            currentSummary = line.replace('SUMMARY:', '').trim();
          }
          
          if (line.startsWith('DTSTART')) {
            const parts = line.split(':');
            if (parts.length > 1) {
              currentDateStr = parts[1].trim();
            }
          }

          if (line === 'END:VEVENT') {
            if (currentSummary && currentDateStr) {
              const cleanDateStr = currentDateStr.substring(0, 8);
              const year = parseInt(cleanDateStr.substring(0, 4));
              const month = parseInt(cleanDateStr.substring(4, 6)) - 1;
              const day = parseInt(cleanDateStr.substring(6, 8));

              if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                const eventDate = new Date(year, month, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const diffTime = eventDate.getTime() - today.getTime();
                const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (daysLeft >= 0) {
                  let color = 'bg-slate-700 text-slate-200 border-slate-500';
                  const lower = currentSummary.toLowerCase();
                  if (lower.includes('restmüll') || lower.includes('restmuell')) {
                    color = 'bg-zinc-700 text-zinc-100 border-zinc-500';
                  } else if (lower.includes('bio')) {
                    color = 'bg-amber-800/80 text-amber-200 border-amber-600';
                  } else if (lower.includes('papier') || lower.includes('tonne')) {
                    color = 'bg-blue-800/80 text-blue-200 border-blue-600';
                  } else if (lower.includes('gelb') || lower.includes('sack')) {
                    color = 'bg-yellow-600/80 text-yellow-100 border-yellow-500';
                  }

                  events.push({
                    summary: currentSummary,
                    date: eventDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
                    daysLeft,
                    color
                  });
                }
              }
            }
            currentSummary = '';
            currentDateStr = '';
          }
        }

        events.sort((a, b) => a.daysLeft - b.daysLeft);
        setNextEvents(events.slice(0, 3));
      } catch (e: any) {
        console.error('Fehler beim Laden der Mülltermine:', e);
        setErrorStatus(e.message || 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    loadTrashData();
  }, []);

  return (
    <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-bold text-white">Müllabfuhr</h2>
            <p className="text-xs text-gray-300">84323 Massing (Joseph-Lipf-Str. 14)</p>
          </div>
          <span className="text-2xl">🗑️</span>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-400 text-sm">Lade Mülltermine...</div>
        ) : errorStatus ? (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-xs space-y-1">
            <p className="font-bold">Fehler beim Laden:</p>
            <p>{errorStatus}</p>
          </div>
        ) : nextEvents.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Keine zukünftigen Termine in der <code className="text-amber-400">abfuhr.ics</code> gefunden.
          </div>
        ) : (
          <div className="space-y-3">
            {nextEvents.map((item, index) => (
              <div key={index} className="p-3 rounded-xl border border-white/10 bg-slate-800/50 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-white">{item.summary}</div>
                  <div className="text-xs text-gray-400">{item.date}</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${item.color}`}>
                  {item.daysLeft === 0 ? 'Heute!' : item.daysLeft === 1 ? 'Morgen' : `in ${item.daysLeft} Tagen`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}