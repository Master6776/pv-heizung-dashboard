'use client';

import React, { useEffect, useState } from 'react';

interface DayForecast {
  date: string;
  kWh: string;
  numKWh: number;
}

export default function SolarForecastTile() {
  const [forecast, setForecast] = useState<DayForecast | null>(null);
  const [tomorrowForecast, setTomorrowForecast] = useState<DayForecast | null>(null);
  const [day3Forecast, setDay3Forecast] = useState<DayForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // ... (Die Logik bleibt identisch wie vorher)
  useEffect(() => {
    async function fetchForecast() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const cachedData = localStorage.getItem('solar_forecast_data');
        const cachedDate = localStorage.getItem('solar_forecast_date');
        const cachedTimeStr = localStorage.getItem('solar_forecast_update_time');

        if (cachedData && cachedDate === todayStr) {
          const parsed = JSON.parse(cachedData);
          setForecast(parsed.today);
          setTomorrowForecast(parsed.tomorrow);
          setDay3Forecast(parsed.day3);
          if (cachedTimeStr) setLastUpdated(cachedTimeStr);
          setLoading(false);
          return;
        }

        const lat = 48.397;
        const lon = 12.571;
        const system1 = { kwp: 4.8, declination: 23, azimuth: 15 };
        const system2 = { kwp: 3.7, declination: 20, azimuth: 100 };

        const url1 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system1.declination}/${system1.azimuth}/${system1.kwp}`;
        const url2 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system2.declination}/${system2.azimuth}/${system2.kwp}`;

        const [res1, res2] = await Promise.all([fetch(url1), fetch(url2)]);
        const data1 = await res1.json();
        const data2 = await res2.json();

        const nowTimeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        if (!res1.ok || !res2.ok || !data1?.result?.watt_hours_day) {
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                setForecast(parsed.today);
                setTomorrowForecast(parsed.tomorrow);
                setDay3Forecast(parsed.day3);
            } else { setIsUsingFallback(true); }
            setLoading(false); return;
        }

        const getNextDate = (days: number) => {
          const d = new Date();
          d.setDate(d.getDate() + days);
          return d.toISOString().split('T')[0];
        };

        const tStr = todayStr;
        const t1Str = getNextDate(1);
        const t2Str = getNextDate(2);
        const val = (wh: any, date: string) => (wh[date] || 0) / 1000;

        const todayObj = { date: 'Heute', kWh: (val(data1.result.watt_hours_day, tStr) + val(data2.result.watt_hours_day, tStr)).toFixed(1), numKWh: 0 };
        todayObj.numKWh = parseFloat(todayObj.kWh);
        const tomObj = { date: 'Morgen', kWh: (val(data1.result.watt_hours_day, t1Str) + val(data2.result.watt_hours_day, t1Str)).toFixed(1), numKWh: 0 };
        tomObj.numKWh = parseFloat(tomObj.kWh);
        const d3Obj = { date: 'Übermorgen', kWh: (val(data1.result.watt_hours_day, t2Str) + val(data2.result.watt_hours_day, t2Str)).toFixed(1), numKWh: 0 };
        d3Obj.numKWh = parseFloat(d3Obj.kWh);

        setForecast(todayObj); setTomorrowForecast(tomObj); setDay3Forecast(d3Obj); setLastUpdated(nowTimeStr);
        localStorage.setItem('solar_forecast_data', JSON.stringify({ today: todayObj, tomorrow: tomObj, day3: d3Obj }));
        localStorage.setItem('solar_forecast_date', todayStr);
        localStorage.setItem('solar_forecast_update_time', nowTimeStr);
      } catch (error) { setIsUsingFallback(true); } finally { setLoading(false); }
    }
    fetchForecast();
  }, []);

  const getTheme = (kWh: number) => {
    if (kWh > 20) return { border: 'border-yellow-500/30', glow: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '☀️' };
    else if (kWh > 10) return { border: 'border-blue-500/30', glow: 'bg-blue-500/10', text: 'text-blue-400', icon: '⛅' };
    return { border: 'border-slate-700/50', glow: 'bg-slate-500/5', text: 'text-slate-400', icon: '☁️' };
  };

  const currentTheme = forecast ? getTheme(forecast.numKWh) : { border: 'border-slate-700/50', glow: 'bg-slate-500/5', text: 'text-slate-400', icon: '☀️' };

  return (
    <div className={`relative p-6 rounded-2xl shadow-2xl border ${currentTheme.border} overflow-hidden bg-slate-950/80 backdrop-blur-2xl`}>
      
      {/* Der "Coole" Hintergrund-Glow */}
      <div className={`absolute -top-16 -right-16 w-64 h-64 ${currentTheme.glow} rounded-full blur-3xl pointer-events-none`}></div>
      
      {/* Content Container (relative, damit er über dem Glow liegt) */}
      <div className="relative z-10">
        <div className="mb-4">
            <h2 className="text-xl font-bold text-white tracking-wide">Solar-Prognose</h2>
            <p className="text-sm text-gray-500">Massing (Joseph-Lipf-Str. 14)</p>
        </div>
        
        {loading ? <div className="text-gray-500 py-6 text-center animate-pulse">Lade...</div> : (
            <div className="space-y-2">
            <div className={`flex items-center justify-between p-3 rounded-xl border ${currentTheme.border} bg-slate-900/50`}>
                <div className="flex items-center gap-2">
                    <span className="text-xl">{currentTheme.icon}</span>
                    <span className={currentTheme.text}>Heute</span>
                </div>
                <span className={`font-bold ${currentTheme.text}`}>{forecast?.kWh} kWh</span>
            </div>
            
            {[tomorrowForecast, day3Forecast].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                <span className="text-slate-400">{item?.date}</span>
                <span className="text-slate-200 font-bold">{item?.kWh} kWh</span>
                </div>
            ))}
            </div>
        )}

        {!loading && (
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-[10px] text-gray-600 font-medium tracking-wider uppercase">
                <span>Synchronisiert: {lastUpdated} Uhr</span>
            </div>
        )}
      </div>
    </div>
  );
}