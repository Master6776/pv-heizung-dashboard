import React from 'react';
import { Globe } from 'lucide-react';

interface NetworkProps {
  network?: {
    routerName: string;
    status: string;
    download: number;
    upload: number;
    ping: number;
    devicesCount: number;
    guestWlan: boolean;
    piholeActive: boolean;
    piholeBlockedPercent: number;
  };
}

export default function NetworkTile({ network }: NetworkProps) {
  const data = network || {
    routerName: 'Speedport Smart 4',
    status: 'Online',
    download: 0,
    upload: 0,
    ping: 0,
    devicesCount: 0,
    guestWlan: false,
    piholeActive: false,
    piholeBlockedPercent: 0,
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 p-5 border border-slate-800 shadow-xl backdrop-blur-md">
      {/* Dezenter Hintergrund-Effekt */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Netzwerk & Internet
          </h2>
          <p className="text-xs text-slate-400">{data.routerName}</p>
        </div>
        <Globe className="w-5 h-5 text-blue-400" />
      </div>

      <div className="space-y-3 text-sm relative z-10">
        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Internet-Status:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {data.status}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Download / Upload:</span>
          <span className="text-white font-semibold">
            {data.download} / {data.upload} <span className="text-xs text-slate-400 font-normal">Mbit/s</span>
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Ping:</span>
          <span className="text-cyan-400 font-semibold">{data.ping} ms</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Aktive Geräte:</span>
          <span className="text-white font-semibold">{data.devicesCount} Geräte</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
          <span className="text-slate-400">Gast-WLAN:</span>
          <span className="text-slate-300">{data.guestWlan ? 'Aktiv' : 'Aus'}</span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-slate-400">Adblocker (Pi-hole):</span>
          <span className="text-emerald-400 font-medium text-xs">
            {data.piholeActive ? `Aktiv (${data.piholeBlockedPercent}% geblockt)` : 'Inaktiv'}
          </span>
        </div>
      </div>
    </div>
  );
}