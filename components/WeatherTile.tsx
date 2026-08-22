'use client';

import React from 'react';

export default function WeatherTile({ weather }: { weather?: any }) {
  const data = {
    temp: 18.5,
    condition: 'Teils bewölkt',
    wind: '15.5 km/h',
    precip: '0 mm',
    uvIndex: '3.2',
    sunrise: '06:15',
    sunset: '20:45',
    moonPhase: 'Zunehmender Mond',
    ...weather,
  };

  return (
    <div className="p-6 rounded-2xl shadow-xl border border-slate-700/50 bg-slate-900 flex flex-col justify-between text-slate-100">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Wetter & Astronomie</h2>
          <span className="text-2xl">⛅</span>
        </div>

        {/* 1. Hauptwerte */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-6">
          <div>
            <span className="text-slate-400 block mb-1">Temperatur</span>
            <span className="text-2xl font-bold text-white">{data.temp}°C</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Bedingung</span>
            <span className="text-lg font-bold text-white">{data.condition}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Wind</span>
            <span className="text-lg font-bold text-white">{data.wind}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Niederschlag</span>
            <span className="text-lg font-bold text-white">{data.precip}</span>
          </div>
        </div>

        {/* Trennlinie */}
        <div className="border-t border-slate-800 my-6"></div>

        {/* 2. Sonne, UV & Mondphase Sektion */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30 flex flex-col justify-center">
            <div className="text-xs text-slate-400 mb-1">UV-Index</div>
            <div className="text-base font-bold text-amber-400">{data.uvIndex}</div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30 flex flex-col justify-center">
            <div className="text-xs text-slate-400 mb-1">Sonne</div>
            <div className="text-xs font-semibold text-white">🌅 {data.sunrise}</div>
            <div className="text-xs font-semibold text-white mt-0.5">🌇 {data.sunset}</div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/30 flex flex-col justify-center">
            <div className="text-xs text-slate-400 mb-1">Mondphase</div>
            <div className="text-xs font-bold text-slate-200 leading-tight">{data.moonPhase}</div>
          </div>
        </div>

      </div>
    </div>
  );
}