export default function HeatingTile({ heating }: { heating: any }) {
  return (
    <div className="p-6 rounded-2xl shadow-xl border border-slate-700/50 bg-slate-900 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Heizung & Temperaturen</h2>
          <span className="text-3xl">🔥</span>
        </div>

        {/* 1. Hauptwerte im 2x2 Grid (Größere Schrift) */}
        <div className="grid grid-cols-2 gap-3.5 mb-6 pb-6 border-b border-slate-800">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
            <span className="text-slate-300 block text-sm font-medium">Außentemperatur</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{heating.ausserTemp}°C</span>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
            <span className="text-slate-300 block text-sm font-medium">Solar-Kollektor</span>
            <span className="text-2xl font-extrabold text-yellow-400 mt-1 block">{heating.solarKollektor}°C</span>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
            <span className="text-slate-300 block text-sm font-medium">Abgastemperatur</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">{heating.abgas}°C</span>
          </div>
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
            <span className="text-slate-300 block text-sm font-medium">Hauptkessel</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">{heating.hauptkessel}°C</span>
          </div>
        </div>

        {/* 2. Speicher & Puffer Sektion (Größere Schrift) */}
        <div className="text-sm text-slate-300 uppercase tracking-wider mb-3 font-bold">Speicher & Puffer</div>
        <div className="space-y-2.5 mb-6">
          <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-base">
            <span className="text-slate-200 font-medium">Puffer 1 (Oben / Unten)</span>
            <span className="text-white font-bold">{heating.puffer1Oben}°C / {heating.puffer1Unten}°C</span>
          </div>
          <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-base">
            <span className="text-slate-200 font-medium">Puffer 2 (Oben / Unten)</span>
            <span className="text-white font-bold">{heating.puffer2Oben}°C / {heating.puffer2Unten}°C</span>
          </div>
          <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-base">
            <span className="text-slate-200 font-medium">WW-Speicher (Oben / Unten)</span>
            <span className="text-white font-bold">{heating.wwSpeicherOben}°C / {heating.wwSpeicherUnten}°C</span>
          </div>
        </div>

        {/* 3. Umgebung & Vorlauf Sektion (Größere Schrift) */}
        <div className="text-sm text-slate-300 uppercase tracking-wider mb-3 font-bold">Umgebung & Vorlauf</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-sm text-slate-300 font-medium">Pool</div>
            <div className="text-lg font-extrabold text-cyan-400 mt-0.5">{heating.pool}°C</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-sm text-slate-300 font-medium">Garage</div>
            <div className="text-lg font-extrabold text-cyan-400 mt-0.5">{heating.garage}°C</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-sm text-slate-300 font-medium">FBH Vorlauf</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{heating.fbhVorlauf}°C</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-sm text-slate-300 font-medium">HK Vorlauf</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{heating.hkVorlauf}°C</div>
          </div>
        </div>

      </div>
    </div>
  );
}