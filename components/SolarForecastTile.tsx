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
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const cachedData = localStorage.getItem('solar_forecast_data');
        const cachedDate = localStorage.getItem('solar_forecast_date');
        const cachedTimeStr = localStorage.getItem('solar_forecast_update_time');

        // Wenn wir Daten für heute bereits im Cache haben, direkt nutzen
        if (cachedData && cachedDate === todayStr) {
          const parsed = JSON.parse(cachedData);
          setForecast(parsed.today);
          setTomorrowForecast(parsed.tomorrow);
          if (cachedTimeStr) setLastUpdated(cachedTimeStr);
          setLoading(false);
          return;
        }

        // Standort: 84323 Massing (Joseph-Lipf-Str. 14)
        const lat = 48.397;
        const lon = 12.571;
        
        const system1 = { kwp: 4.5, declination: 30, azimuth: 15 };
        const system2 = { kwp: 3.7, declination: 20, azimuth: 100 };

        const url1 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system1.declination}/${system1.azimuth}/${system1.kwp}`;
        const url2 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system2.declination}/${system2.azimuth}/${system2.kwp}`;

        const [res1, res2] = await Promise.all([fetch(url1), fetch(url2)]);
        const data1 = await res1.json();
        const data2 = await res2.json();

        const nowTimeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        // Falls API blockiert (Rate Limit) -> Fallback nutzen
        if (!res1.ok || !res2.ok || !data1?.result?.watt_hours_day || !data2?.result?.watt_hours_day) {
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setForecast(parsed.today);
            setTomorrowForecast(parsed.tomorrow);
            if (cachedTimeStr) setLastUpdated(cachedTimeStr);
          } else {
            setForecast({ date: 'Heute', kWh: '18.5', numKWh: 18.5 });
            setTomorrowForecast({ date: 'Morgen', kWh: '24.2', numKWh: 24.2 });
            setIsUsingFallback(true);
            setLastUpdated(nowTimeStr);
          }
          setLoading(false);
          return;
        }

        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

        const todayWh = (data1.result.watt_hours_day[todayStr] || 0) + (data2.result.watt_hours_day[todayStr] || 0);
        const tomorrowWh = (data1.result.watt_hours_day[tomorrowStr] || 0) + (data2.result.watt_hours_day[tomorrowStr] || 0);

        const todayVal = todayWh / 1000;
        const tomorrowVal = tomorrowWh / 1000;

        const todayObj = { date: 'Heute', kWh: todayVal.toFixed(1), numKWh: todayVal };
        const tomorrowObj = { date: 'Morgen', kWh: tomorrowVal.toFixed(1), numKWh: tomorrowVal };

        setForecast(todayObj);
        setTomorrowForecast(tomorrowObj);
        setLastUpdated(nowTimeStr);

        // Im Cache speichern mit aktuellem Tagesdatum und genauer Uhrzeit
        localStorage.setItem('solar_forecast_data', JSON.stringify({ today: todayObj, tomorrow: tomorrowObj }));
        localStorage.setItem('solar_forecast_date', todayStr);
        localStorage.setItem('solar_forecast_update_time', nowTimeStr);

      } catch (error) {
        console.error('Netzwerkfehler, nutze Fallback:', error);
        const nowTimeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        setForecast({ date: 'Heute', kWh: '18.5', numKWh: 18.5 });
        setTomorrowForecast({ date: 'Morgen', kWh: '24.2', numKWh: 24.2 });
        setIsUsingFallback(true);
        setLastUpdated(nowTimeStr);
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, []);

  const getTheme = (kWh: number) => {
    if (kWh > 20) {
      return {
        border: 'border-yellow-500/50 shadow-yellow-500/10',
        bg: 'bg-yellow-950/20',
        text: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
        icon: '☀️',
        label: 'Sonnig & Stark'
      };
    } else if (kWh > 10) {
      return {
        border: 'border-blue-500/40 shadow-blue-500/10',
        bg: 'bg-blue-950/15',
        text: 'text-blue-300',
        badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
        icon: '⛅',
        label: 'Leicht bewölkt'
      };
    } else {
      return {
        border: 'border-slate-700/60 shadow-none',
        bg: 'bg-slate-800/40',
        text: 'text-slate-300',
        badgeBg: 'bg-slate-800/80 border-white/5 text-gray-200',
        icon: '☁️',
        label: 'Bewölkt / Trüb'
      };
    }
  };

  const currentTheme = forecast ? getTheme(forecast.numKWh) : null;

  return (
    <div className={`relative p-6 rounded-2xl shadow-xl border flex flex-col justify-between overflow-hidden bg-slate-900/95 backdrop-blur-md transition-all duration-500 ${currentTheme ? currentTheme.border : 'border-slate-700/80'}`}>
      
      <div>
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Solar-Prognose</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Massing (Joseph-Lipf-Str. 14) {isUsingFallback && <span className="text-xs text-amber-400/80">(Demo-Modus)</span>}
            </p>
          </div>
          <span className="text-3xl drop-shadow-md">
            {forecast ? currentTheme?.icon : '☀️'}
          </span>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 py-6 text-center animate-pulse">Lade Prognose...</div>
        ) : forecast && tomorrowForecast ? (
          <div className="space-y-3 relative z-10">
            
            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${currentTheme?.border} ${currentTheme?.bg} transition-all`}>
              <div className="flex items-center space-x-4">
                <div className="text-2xl drop-shadow-md flex-shrink-0">⚡</div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm ${currentTheme?.text} tracking-wide`}>
                    Ertrag Heute
                  </span>
                  <span className="text-xs text-gray-300 mt-0.5">
                    {currentTheme?.label}
                  </span>
                </div>
              </div>
              <div className={`ml-3 px-3.5 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap shadow-inner ${currentTheme?.badgeBg}`}>
                {forecast.kWh} kWh
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 transition-all">
              <div className="flex items-center space-x-4">
                <div className="text-2xl drop-shadow-md flex-shrink-0">📅</div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-slate-200 tracking-wide">
                    Ertrag Morgen
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    Vorschau nächster Tag
                  </span>
                </div>
              </div>
              <div className="ml-3 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-white/5 text-xs font-bold text-gray-200 whitespace-nowrap shadow-inner">
                {tomorrowForecast.kWh} kWh
              </div>
            </div>

          </div>
        ) : (
          <div className="text-sm text-red-400 py-4 text-center px-2">Keine Daten verfügbar</div>
        )}
      </div>

      {/* Dezenter Update-Stempel unten */}
      {!loading && lastUpdated && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-gray-500">
          <span>Aktualisiert: Heute, {lastUpdated} Uhr</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block" title="System synchronisiert"></span>
        </div>
      )}

    </div>
  );
}