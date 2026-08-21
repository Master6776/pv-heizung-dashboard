'use client';
import { useEffect, useState } from 'react';

export default function BmwTile() {
  const [bmw, setBmw] = useState<any>(null);

  useEffect(() => {
    fetch('/api/bmw')
      .then(res => res.json())
      .then(data => setBmw(data));
  }, []);

  if (!bmw) return <div className="p-4 bg-slate-900 rounded-2xl text-gray-400">Lade BMW iX1 Daten...</div>;

  return (
    <div className="p-6 bg-slate-900 rounded-2xl shadow-xl border border-blue-500/30 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-400">{bmw.model}</h2>
        <span className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">
          {bmw.chargingStatus === 'CHARGING' ? '⚡ Lädt' : '🟢 Bereit'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <p className="text-xs text-gray-400">Akkustand</p>
          <p className="text-2xl font-bold text-emerald-400">{bmw.soc}%</p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <p className="text-xs text-gray-400">Reichweite</p>
          <p className="text-2xl font-bold text-blue-300">{bmw.range} km</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Status: {bmw.doorsLocked ? '🔒 Verriegelt' : '🔓 Offen'}</span>
        <span>Stand: {bmw.lastUpdate}</span>
      </div>
    </div>
  );
}