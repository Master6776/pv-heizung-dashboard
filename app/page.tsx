'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [weather, setWeather] = useState<any>({ 
    temp: 0, 
    rain: 0, 
    condition: 'Lade...', 
    icon: '☀️',
    aqi: 0,
    aqiText: 'Lade...',
    radiation: 0,
    uvIndex: 0,
    daily: [] 
  });
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

  const fetchWeather = async () => {
    try {
      const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.3833&longitude=12.5667&current=temperature_2m,precipitation,weather_code,is_day,shortwave_radiation,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto');
      const weatherJson = await weatherRes.json();

      const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=48.3833&longitude=12.5667&current=european_aqi');
      const aqiJson = await aqiRes.json();

      if (weatherJson && weatherJson.current) {
        const code = weatherJson.current.weather_code;
        const isDay = weatherJson.current.is_day;
        const radiationVal = weatherJson.current.shortwave_radiation ?? 0;
        const uvVal = weatherJson.current.uv_index ?? 0;

        let conditionText = 'Klar';
        let weatherIcon = '☀️';

        if (code === 0) {
          conditionText = isDay ? 'Klar' : 'Klarer Himmel';
          weatherIcon = isDay ? '☀️' : '🌙';
        } else if (code >= 1 && code <= 3) {
          conditionText = 'Teils bewölkt';
          weatherIcon = isDay ? '⛅' : '☁️';
        } else if (code >= 45 && code <= 48) {
          conditionText = 'Nebelig';
          weatherIcon = '🌫️';
        } else if (code >= 51 && code <= 67) {
          conditionText = 'Regen';
          weatherIcon = '🌧️';
        } else if (code >= 71 && code <= 77) {
          conditionText = 'Schnee';
          weatherIcon = '❄️';
        } else if (code >= 95) {
          conditionText = 'Gewitter';
          weatherIcon = '⛈️';
        }

        const aqiVal = aqiJson?.current?.european_aqi ?? 0;
        let aqiText = 'Sehr gut';
        if (aqiVal > 20 && aqiVal <= 40) aqiText = 'Gut';
        else if (aqiVal > 40 && aqiVal <= 60) aqiText = 'Mäßig';
        else if (aqiVal > 60 && aqiVal <= 80) aqiText = 'Schlecht';
        else if (aqiVal > 80) aqiText = 'Sehr schlecht';

        const dailyData = [];
        if (weatherJson.daily && weatherJson.daily.time) {
          for (let i = 1; i <= 3; i++) {
            if (weatherJson.daily.time[i]) {
              const dateStr = new Date(weatherJson.daily.time[i]).toLocaleDateString('de-DE', { weekday: 'short' });
              dailyData.push({
                day: dateStr,
                max: Math.round(weatherJson.daily.temperature_2m_max[i]),
                min: Math.round(weatherJson.daily.temperature_2m_min[i]),
                pop: weatherJson.daily.precipitation_probability_max?.[i] ?? 0,
              });
            }
          }
        }

        setWeather({
          temp: weatherJson.current.temperature_2m,
          rain: weatherJson.current.precipitation,
          condition: conditionText,
          icon: weatherIcon,
          aqi: aqiVal,
          aqiText: aqiText,
          radiation: radiationVal,
          uvIndex: uvVal,
          daily: dailyData
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Wetters:', error);
    }
  };

  // Hilfsfunktionen für dynamische Farben
  const getUvColor = (uv: number) => {
    if (uv <= 2) return 'text-emerald-400';
    if (uv <= 5) return 'text-yellow-400';
    if (uv <= 7) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 20) return 'text-emerald-400';
    if (aqi <= 40) return 'text-green-400';
    if (aqi <= 60) return 'text-yellow-400';
    if (aqi <= 80) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBatteryColor = (soc: number) => {
    if (soc >= 75) return 'text-emerald-400';
    if (soc >= 50) return 'text-yellow-400';
    if (soc >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  useEffect(() => {
    fetchData();
    fetchWeather();
    
    const interval = setInterval(() => {
      fetchData();
      fetchWeather();
    }, 30000); 

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* PV & Energie Karte mit Hintergrundbild */}
          <div 
            className="relative p-6 rounded-2xl shadow-xl border border-slate-700 flex flex-col justify-between bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508873696983-2df5c92091c7?q=80&w=1000&auto=format&fit=crop')` }}
          >
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Photovoltaik & Speicher</h2>
                <span className="text-2xl">☀️</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300">Aktuelle Leistung:</span>
                  <span className="text-amber-400 font-bold text-lg">{pv.currentPower ?? 0} W</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300">Batterie SoC:</span>
                  <span className={`font-bold text-lg ${getBatteryColor(pv.batterySoc ?? 0)}`}>{pv.batterySoc ?? 0} %</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300">Tagesertrag:</span>
                  <span className="text-white font-bold text-lg">{pv.dailyYield ?? 0} kWh</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-300">Hausverbrauch (heute):</span>
                  <span className="text-white font-bold text-lg">{pv.dailyConsumption ?? 0} kWh</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300">Netzeinspeisung (heute):</span>
                  <span className="text-white font-bold text-lg">{pv.dailyExport ?? 0} kWh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wetter & Umwelt Karte für Massing (84323) */}
          <div 
            className="relative p-6 rounded-2xl shadow-xl border border-slate-700 flex flex-col justify-between bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop')` }}
          >
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Wetter & Umwelt</h2>
                  <p className="text-xs text-gray-300">84323 Massing</p>
                </div>
                <span className="text-2xl">{weather.icon}</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-300">Temperatur:</span>
                  <span className="text-white font-bold text-lg">{weather.temp} °C</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-300">Niederschlag:</span>
                  <span className="text-blue-300 font-bold text-lg">{weather.rain} mm</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-300">Solare Strahlung:</span>
                  <span className="text-amber-300 font-bold text-lg">{weather.radiation} W/m²</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-300">UV-Index:</span>
                  <span className={`font-bold text-lg ${getUvColor(weather.uvIndex)}`}>{weather.uvIndex}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-300">Luftqualität:</span>
                  <span className={`font-bold text-base ${getAqiColor(weather.aqi)}`}>{weather.aqiText}</span>
                </div>

                {/* Vorschau nächste Tage */}
                <div className="pt-2">
                  <div className="text-gray-300 text-xs mb-2">Vorschau nächste Tage</div>
                  <div className="grid grid-cols-3 gap-2">
                    {weather.daily.map((d: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/80 p-2 rounded-xl border border-white/10 text-center backdrop-blur-md">
                        <div className="text-gray-300 text-xs">{d.day}</div>
                        <div className="text-white font-bold text-xs mt-1">{d.max}° / {d.min}°</div>
                        <div className="text-blue-300 text-xs mt-0.5">💧 {d.pop}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heizung / C.M.I. Karte mit Hintergrundbild */}
          <div 
            className="relative p-6 rounded-2xl shadow-xl border border-slate-700 flex flex-col justify-between bg-cover bg-center overflow-hidden"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop')` }}
          >
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Heizung (C.M.I.)</h2>
                <span className="text-2xl">🔥</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Außentemperatur</div>
                  <div className="text-white font-bold text-lg">{heating.ausserTemp ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Solar Kollektor</div>
                  <div className="text-white font-bold text-lg">{heating.solarKollektor ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">WW Speicher</div>
                  <div className="text-white font-bold text-lg">{heating.wwSpeicher ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Pool</div>
                  <div className="text-white font-bold text-lg">{heating.pool ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 1 Oben</div>
                  <div className="text-white font-bold text-lg">{heating.puffer1Oben ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 1 Unten</div>
                  <div className="text-white font-bold text-lg">{heating.puffer1Unten ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 2 Oben</div>
                  <div className="text-white font-bold text-lg">{heating.puffer2Oben ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 2 Unten</div>
                  <div className="text-white font-bold text-lg">{heating.puffer2Unten ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">FBH Vorlauf</div>
                  <div className="text-white font-bold text-lg">{heating.fbhVorlauf ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Heizkreis Vorlauf</div>
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