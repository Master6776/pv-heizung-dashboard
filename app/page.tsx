'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/metrics', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-xl animate-pulse">Lade Dashboard...</p>
      </div>
    );
  }

  const heating = data?.heating || {};
  const pv = data?.pv || {};

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Heizung & PV Dashboard</h1>
          <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            Live aktiv
          </span>
        </header>

        {/* Grid für Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PV & Energie Karte */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Photovoltaik & Speicher</h2>
                <span className="text-2xl">☀️</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-gray-400">Aktuelle Leistung:</span>
                  <span className="text-amber-400 font-bold text-lg">{pv.currentPower ?? 0} W</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-gray-400">Batterie SoC:</span>
                  <span className="text-emerald-400 font-bold text-lg">{pv.batterySoc ?? 0} %</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-gray-400">Tagesertrag:</span>
                  <span className="text-white font-bold text-lg">{pv.dailyYield ?? 0} kWh</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800">
                  <span className="text-gray-400">Hausverbrauch (heute):</span>
                  <span className="text-white font-bold text-lg">{pv.dailyConsumption ?? 0} kWh</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Netzeinspeisung (heute):</span>
                  <span className="text-white font-bold text-lg">{pv.dailyExport ?? 0} kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Heizung / C.M.I. Karte */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Heizung (C.M.I.)</h2>
                <span className="text-2xl">🔥</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Außentemperatur</div>
                  <div className="text-white font-bold text-lg">{heating.ausserTemp ?? 0} °C</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Solar Kollektor</div>
                  <div className="text-white font-bold text-lg">{heating.solarKollektor ?? 0} °C</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">WW Speicher</div>
                  <div className="text-white font-bold text-lg">{heating.wwSpeicher ?? 0} °C</div>
                </div>
                
                {/* --- GETAUSCHT: Pool kommt jetzt hier --- */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Pool</div>
                  <div className="text-white font-bold text-lg">{heating.pool ?? 0} °C</div>
                </div>
                
                {/* Puffer 1 & 2 Block direkt hintereinander */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Puffer 1 Oben</div>
                  <div className="text-white font-bold text-lg">{heating.puffer1Oben ?? 0} °C</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Puffer 1 Unten</div>
                  <div className="text-white font-bold text-lg">{heating.puffer1Unten ?? 0} °C</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Puffer 2 Oben</div>
                  <div className="text-white font-bold text-lg">{heating.puffer2Oben ?? 0} °C</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Puffer 2 Unten</div>
                  <div className="text-white font-bold text-lg">{heating.puffer2Unten ?? 0} °C</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">FBH Vorlauf</div>
                  <div className="text-white font-bold text-lg">{heating.fbhVorlauf ?? 0} °C</div>
                </div>
                
                {/* --- GETAUSCHT: Heizkreis Vorlauf ist jetzt hier unten --- */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-gray-400 text-xs">Heizkreis Vorlauf</div>
                  <div className="text-white font-bold text-lg">{heating.hkVorlauf ?? 0} °C</div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}