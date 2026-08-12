'use client';

import { useEffect, useState } from 'react';

export default function KebaTile() {
  const [kebaData, setKebaData] = useState({
    power: 0,
    current: 0,
    voltage: 0,
    status: 0,
    totalEnergy: 0,
    reachable: false,
  });

  useEffect(() => {
    const fetchKeba = async () => {
      try {
        const res = await fetch('/api/metrics', { cache: 'no-store' });
        const json = await res.json();
        if (json && json.keba) {
          setKebaData(json.keba);
        }
      } catch (e) {
        console.error('Fehler beim Laden der Keba-Daten:', e);
      }
    };

    fetchKeba();
    const interval = setInterval(fetchKeba, 120000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Startvorgang';
      case 1: return 'Nicht bereit';
      case 2: return 'Startbereit';
      case 3: return 'Lädt';
      case 4: return 'Fehler';
      default: return `Status ${status}`;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 3: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 2: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 4: return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
      {/* Hintergrundbild: Schnelllader / Ladekabel */}
      <img 
        src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=1000&auto=format&fit=crop" 
        alt="Schnelllader Ladekabel" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">KEBA P40</h2>
            <p className="text-xs text-gray-300">
              {kebaData.reachable ? 'Wallbox' : 'Wallbox (Offline)'}
            </p>
          </div>
          <span className="text-2xl">⚡</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2.5 border-b border-white/10">
            <span className="text-gray-300">Status:</span>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${getStatusColor(kebaData.status)}`}>
              {getStatusText(kebaData.status)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-white/10">
            <span className="text-gray-300">Leistung:</span>
            <span className="text-amber-400 font-bold text-base">{Number(kebaData.power ?? 0).toFixed(2)} kW</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-white/10">
            <span className="text-gray-300">Stromstärke:</span>
            <span className="text-white font-bold text-base">{kebaData.current} A</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-white/10">
            <span className="text-gray-300">Spannung:</span>
            <span className="text-white font-bold text-base">{kebaData.voltage} V</span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="text-gray-300">Gesamtladung:</span>
            <span className="text-cyan-400 font-bold text-base">{kebaData.totalEnergy} kWh</span>
          </div>
        </div>
      </div>
    </div>
  );
}