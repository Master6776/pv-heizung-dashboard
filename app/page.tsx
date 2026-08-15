'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import KebaTile from '@/components/KebaTile';
import TrashTile from '@/components/TrashTile';


const FALLBACK_DATA = {
  success: true,
  pv: {
    currentPower: 4250,
    batterySoc: 84,
    dailyYield: 24.5,
    dailyConsumption: 12.1,
    dailyExport: 15.2,
    currentConsumption: 850,
  },
  keba: {
    status: 'Nicht bereit',
    power: 0,
    current: 0,
    voltage: 230,
    totalEnergy: 127.3,
    reachable: true,
  },
  mystrom: {
    switch1: { name: 'Heizstab', power: 2000, relay: true, reachable: true, consumption: 4.5 },
    switch2: { name: 'Poolpumpe', power: 450, relay: false, reachable: true, consumption: 1.2 },
  },
  heating: {
    ausserTemp: 18.5,
    solarKollektor: 65.2,
    wwSpeicher: 54.0,
    pool: 26.5,
    puffer1Oben: 72.0,
    puffer1Unten: 58.0,
    puffer2Oben: 68.0,
    puffer2Unten: 45.0,
    fbhVorlauf: 31.5,
    hkVorlauf: 42.0,
  }
};

// Astronomische Hilfsfunktion zur Berechnung der Mondphase & Beleuchtung
function calculateMoonData() {
  const now = new Date();
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const synodicMonth = 29.5305877;
  const diffDays = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const cycleDay = diffDays % synodicMonth;
  const normalized = cycleDay < 0 ? cycleDay + synodicMonth : cycleDay;
  
  const illumination = Math.round(((1 - Math.cos((normalized / synodicMonth) * 2 * Math.PI)) / 2) * 100);
  
  let phase = 'Neumond';
  let icon = '🌑';
  
  if (normalized < 1.8) { phase = 'Neumond'; icon = '🌑'; }
  else if (normalized < 7.4) { phase = 'Zunehmende Sichel'; icon = '🌒'; }
  else if (normalized < 11.1) { phase = 'Erstes Viertel'; icon = '🌓'; }
  else if (normalized < 14.8) { phase = 'Zunehmender Mond'; icon = '🌔'; }
  else if (normalized < 18.5) { phase = 'Vollmond'; icon = '🌕'; }
  else if (normalized < 22.1) { phase = 'Abnehmender Mond'; icon = '🌖'; }
  else if (normalized < 25.8) { phase = 'Letztes Viertel'; icon = '🌗'; }
  else { phase = 'Abnehmende Sichel'; icon = '🌘'; }

  const moonProgress = Math.round((normalized / synodicMonth) * 100);

  return { phase, icon, illumination, moonProgress };
}

export default function Dashboard() {
  const [data, setData] = useState<any>(FALLBACK_DATA);
  const [history, setHistory] = useState<any[]>(() => [
    { time: 'Vor 15 Min', pv: 1200, house: 500, exportVal: 3 },
    { time: 'Vor 10 Min', pv: 1800, house: 650, exportVal: 8 },
    { time: 'Vor 5 Min', pv: 2400, house: 600, exportVal: 14 },
    { time: 'Live', pv: 3100, house: 750, exportVal: 19 },
  ]);
  const [history7d, setHistory7d] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>({ 
    temp: 19, 
    rain: 0, 
    windSpeed: 12,
    condition: 'Teils bewölkt', 
    icon: '⛅',
    aqi: 22,
    aqiText: 'Gut',
    radiation: 450,
    uvIndex: 4,
    sunrise: '06:00',
    sunset: '20:30',
    daylightProgress: 50,
    daylightTotal: '14h 30m',
    moonPhase: 'Vollmond',
    moonIcon: '🌕',
    moonIllumination: 98,
    moonProgress: 50,
    moonrise: '21:15',
    moonset: '06:45',
    daily: [
      { day: 'Do', max: 22, min: 14, pop: 10 },
      { day: 'Fr', max: 24, min: 15, pop: 20 },
      { day: 'Sa', max: 21, min: 13, pop: 45 }
    ] 
  });
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/metrics', { cache: 'no-store' });
      const json = await res.json();
      if (json && json.success) {
        setData(json);

        const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const pvPower = json.pv?.currentPower ?? 0;
        const housePower = json.pv?.currentConsumption ?? json.pv?.housePower ?? 0;
        const dailyExport = json.pv?.dailyExport ?? 0;

        setHistory(prev => [
          ...prev.slice(-29),
          { time: now, pv: pvPower, house: housePower, exportVal: dailyExport }
        ]);
      }
    } catch {
      // Fallback
    }
  };

  const fetchWeather = async () => {
    try {
      const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.3833&longitude=12.5667&current=temperature_2m,precipitation,weather_code,is_day,shortwave_radiation,uv_index,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset&timezone=auto');
      const weatherJson = await weatherRes.json();

      const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=48.3833&longitude=12.5667&current=european_aqi');
      const aqiJson = await aqiRes.json();

      if (weatherJson && weatherJson.current) {
        const code = weatherJson.current.weather_code;
        const isDay = weatherJson.current.is_day;
        const radiationVal = weatherJson.current.shortwave_radiation ?? 0;
        const uvVal = weatherJson.current.uv_index ?? 0;
        const windVal = weatherJson.current.wind_speed_10m ?? 0;
        const rainVal = weatherJson.current.precipitation ?? 0;

        const sunriseStr = weatherJson.daily?.sunrise?.[0] || '';
        const sunsetStr = weatherJson.daily?.sunset?.[0] || '';
        
        const sunriseTime = sunriseStr ? sunriseStr.split('T')[1] : '06:00';
        const sunsetTime = sunsetStr ? sunsetStr.split('T')[1] : '20:30';

        let daylightProgress = 50;
        let daylightTotalFormatted = '14h 30m';

        if (sunriseStr && sunsetStr) {
          const sunriseDate = new Date(sunriseStr);
          const sunsetDate = new Date(sunsetStr);
          const nowTime = new Date().getTime();

          const totalMs = sunsetDate.getTime() - sunriseDate.getTime();
          const elapsedMs = nowTime - sunriseDate.getTime();

          if (totalMs > 0) {
            daylightProgress = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
          }

          const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
          const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
          daylightTotalFormatted = `${totalHours}h ${totalMinutes}m`;
        }

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

        const activeAlerts = [];
        if (code >= 95) {
          activeAlerts.push({
            title: 'Unwetterwarnung: Gewitter',
            desc: 'Schwere Gewitteraktivität in der Region Massing registriert.',
            type: 'danger'
          });
        }
        if (windVal > 50) {
          activeAlerts.push({
            title: 'Sturmwarnung',
            desc: `Erhöhte Windgeschwindigkeiten von ${windVal} km/h gemessen.`,
            type: 'warning'
          });
        }
        if (rainVal > 15) {
          activeAlerts.push({
            title: 'Starkregenwarnung',
            desc: `Starker Niederschlag (${rainVal} mm) aktiv.`,
            type: 'warning'
          });
        }
        setAlerts(activeAlerts);

        const aqiVal = aqiJson?.current?.european_aqi ?? 0;
        let aqiText = 'Sehr gut';
        if (aqiVal > 20 && aqiVal <= 40) aqiText = 'Gut';
        else if (aqiVal > 40 && aqiVal <= 60) aqiText = 'Mäßig';
        else if (aqiVal > 60 && aqiVal <= 80) aqiText = 'Schlecht';
        else if (aqiVal > 80) aqiText = 'Sehr schlecht';

        const moon = calculateMoonData();

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
          rain: rainVal,
          windSpeed: windVal,
          condition: conditionText,
          icon: weatherIcon,
          aqi: aqiVal,
          aqiText: aqiText,
          radiation: radiationVal,
          uvIndex: uvVal,
          sunrise: sunriseTime,
          sunset: sunsetTime,
          daylightProgress: daylightProgress,
          daylightTotal: daylightTotalFormatted,
          moonPhase: moon.phase,
          moonIcon: moon.icon,
          moonIllumination: moon.illumination,
          moonProgress: moon.moonProgress,
          moonrise: '21:30',
          moonset: '07:10',
          daily: dailyData
        });
      }
    } catch (error) { 
      console.error('Fehler beim Laden des Wetters:', error); 
    }
  };

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
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYield = data?.pv?.dailyYield ?? 0;
    const currentConsumption = data?.pv?.dailyConsumption ?? 0;

    const savedHistory = JSON.parse(localStorage.getItem('pv_daily_history') || '{}');

    savedHistory[todayStr] = {
      yield: currentYield,
      consumption: currentConsumption
    };

    localStorage.setItem('pv_daily_history', JSON.stringify(savedHistory));

    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '');

      const dayData = savedHistory[dateKey] || { yield: 0, consumption: 0 };

      past7Days.push({
        day: dayName,
        yield: dayData.yield,
        consumption: dayData.consumption,
      });
    }

    setHistory7d(past7Days);
  }, [data]);

  const heating = { ...FALLBACK_DATA.heating, ...(data?.heating || {}) };
  const pv = { ...FALLBACK_DATA.pv, ...(data?.pv || {}) };
  const keba = { ...FALLBACK_DATA.keba, ...(data?.keba || {}) };
  const mystrom = {
    switch1: { ...FALLBACK_DATA.mystrom.switch1, ...(data?.mystrom?.switch1 || {}) },
    switch2: { ...FALLBACK_DATA.mystrom.switch2, ...(data?.mystrom?.switch2 || {}) }
  };

  const dailyYield = pv.dailyYield ?? 0;
  const dailyExport = pv.dailyExport ?? 0;
  const dailyConsumption = pv.dailyConsumption ?? 0;
  const selfConsumption = Math.max(0, dailyYield - dailyExport);
  const selfConsumptionRate = dailyYield > 0 ? Math.min(100, Math.round((selfConsumption / dailyYield) * 100)) : 0;
  const autarkyRate = dailyConsumption > 0 ? Math.min(100, Math.round((selfConsumption / dailyConsumption) * 100)) : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Heizung & PV Dashboard</h1>
          <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            Live aktiv
          </span>
        </header>

        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between shadow-xl ${
                  alert.type === 'danger' 
                    ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl animate-pulse">{alert.type === 'danger' ? '⚡' : '⚠️'}</span>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">{alert.title}</h3>
                    <p className="text-xs opacity-90">{alert.desc}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  alert.type === 'danger' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  Aktiv
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Grid für die Kacheln (jetzt inkl. TrashTile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* 1. Photovoltaik Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?q=80&w=1000&auto=format&fit=crop" 
              alt="Photovoltaik" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Photovoltaik</h2>
                <span className="text-2xl">☀️</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                  <span className="text-gray-300">Aktuelle Leistung:</span>
                  <span className="text-amber-400 font-bold text-base">{pv.currentPower ?? 0} W</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                  <span className="text-gray-300">Batterie SoC:</span>
                  <span className={`font-bold text-base ${getBatteryColor(pv.batterySoc ?? 0)}`}>{pv.batterySoc ?? 0} %</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                  <span className="text-gray-300">Tagesertrag:</span>
                  <span className="text-white font-bold text-base">{dailyYield} kWh</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                  <span className="text-gray-300">Hausverbrauch:</span>
                  <span className="text-white font-bold text-base">{dailyConsumption} kWh</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                  <span className="text-gray-300">Netzeinspeisung:</span>
                  <span className="text-white font-bold text-base">{dailyExport} kWh</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-white/10">
                  <span className="text-gray-300">Eigenverbrauchsquote:</span>
                  <span className="text-emerald-400 font-bold text-base">{selfConsumptionRate} %</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-300">Autarkiegrad:</span>
                  <span className="text-cyan-400 font-bold text-base">{autarkyRate} %</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Wallbox & Plugs Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop" 
              alt="Mobilität & Smart Plugs" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-xl font-bold text-white">Wallbox & Plugs</h2>
                  <p className="text-xs text-gray-300">Keba & myStrom</p>
                </div>
                <span className="text-2xl">⚡🔌</span>
              </div>

              {/* Keba Sektion */}
              <div>
                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">Keba Wallbox</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Status:</span>
                    <span className="text-gray-300 font-bold text-sm">{keba.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Leistung:</span>
                    <span className="text-amber-400 font-bold text-sm">{(keba.power / 1000).toFixed(2)} kW</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Stromstärke:</span>
                    <span className="text-white font-bold text-sm">{keba.current} A</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Spannung:</span>
                    <span className="text-white font-bold text-sm">{keba.voltage} V</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Gesamtladung:</span>
                    <span className="text-cyan-300 font-bold text-sm">{keba.totalEnergy} kWh</span>
                  </div>
                </div>
              </div>

              {/* myStrom Sektion */}
              <div className="pt-2">
                <div className="text-xs text-cyan-300 font-bold uppercase tracking-wider mb-2">myStrom Smart Plugs</div>
                
                <div className="space-y-3">
                  <div className="py-2 border-b border-white/10 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{mystrom.switch1.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${mystrom.switch1.reachable ? (mystrom.switch1.relay ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-300') : 'bg-red-500/20 text-red-400'}`}>
                        {mystrom.switch1.reachable ? (mystrom.switch1.relay ? 'An' : 'Aus') : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-300">
                      <span>Leistung: <strong className="text-amber-400">{mystrom.switch1.power} W</strong></span>
                      <span>Gesamt: <strong className="text-white">{Number(mystrom.switch1.consumption ?? 0).toFixed(2)} kWh</strong></span>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{mystrom.switch2.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${mystrom.switch2.reachable ? (mystrom.switch2.relay ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-300') : 'bg-red-500/20 text-red-400'}`}>
                        {mystrom.switch2.reachable ? (mystrom.switch2.relay ? 'An' : 'Aus') : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-300">
                      <span>Leistung: <strong className="text-amber-400">{mystrom.switch2.power} W</strong></span>
                      <span>Gesamt: <strong className="text-white">{Number(mystrom.switch2.consumption ?? 0).toFixed(2)} kWh</strong></span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Wetter, Sonne & Mond Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop" 
              alt="Wetter" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h2 className="text-xl font-bold text-white">Wetter & Sonne</h2>
                  <p className="text-xs text-gray-300">84323 Massing</p>
                </div>
                <span className="text-2xl">{weather.icon}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-gray-300 text-sm">Temperatur:</span>
                  <span className="text-white font-bold text-base">{weather.temp} °C</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-gray-300 text-sm">Niederschlag:</span>
                  <span className="text-blue-300 font-bold text-base">{weather.rain} mm</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-gray-300 text-sm">Wind:</span>
                  <span className="text-teal-300 font-bold text-base">{weather.windSpeed} km/h</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-gray-300 text-sm">Strahlung:</span>
                  <span className="text-amber-300 font-bold text-base">{weather.radiation} W/m²</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-gray-300 text-sm">UV-Index:</span>
                  <span className={`font-bold text-base ${getUvColor(weather.uvIndex)}`}>{weather.uvIndex}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-gray-300 text-sm">Luftqualität:</span>
                  <span className={`font-bold text-sm ${getAqiColor(weather.aqi)}`}>{weather.aqiText}</span>
                </div>
              </div>

              {/* Sonnenstand Widget */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/10 backdrop-blur-md space-y-2 shadow-inner">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <span>✨</span>
                    <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">Sonnenstand</span>
                  </div>
                  <span className="text-amber-400 font-extrabold text-xs">{Math.round(weather.daylightProgress)}%</span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                    style={{ width: `${weather.daylightProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-gray-300 pt-0.5 font-medium">
                  <div className="flex items-center space-x-1">
                    <span>🌄</span>
                    <span className="text-amber-300 font-bold">{weather.sunrise}</span>
                  </div>
                  <span className="text-gray-400 font-semibold">{weather.daylightTotal} Licht</span>
                  <div className="flex items-center space-x-1">
                    <span>🌇</span>
                    <span className="text-orange-300 font-bold">{weather.sunset}</span>
                  </div>
                </div>
              </div>

              {/* Mondverlauf & Phase Widget */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-white/10 backdrop-blur-md space-y-2 shadow-inner">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <span>{weather.moonIcon}</span>
                    <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Mondverlauf</span>
                  </div>
                  <span className="text-indigo-400 font-extrabold text-xs">{weather.moonIllumination}% beleuchtet</span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-indigo-900 via-indigo-500 to-slate-200 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(129,140,248,0.4)]"
                    style={{ width: `${weather.moonProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-gray-300 pt-0.5 font-medium">
                  <div className="flex items-center space-x-1">
                    <span>🌙</span>
                    <span className="text-indigo-300 font-bold">{weather.moonrise}</span>
                  </div>
                  <span className="text-indigo-200 font-semibold">{weather.moonPhase}</span>
                  <div className="flex items-center space-x-1">
                    <span>🌑</span>
                    <span className="text-slate-400 font-bold">{weather.moonset}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-300 text-xs mb-1.5">Vorschau</div>
                <div className="grid grid-cols-3 gap-2">
                  {weather.daily.map((d: any, idx: number) => (
                    <div key={idx} className="bg-slate-900/90 p-2 rounded-xl border border-white/10 text-center backdrop-blur-md">
                      <div className="text-gray-300 text-xs">{d.day}</div>
                      <div className="text-white font-bold text-xs mt-1">{d.max}° / {d.min}°</div>
                      <div className="text-blue-300 text-xs mt-0.5">💧 {d.pop}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Heizung C.M.I. Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1000&auto=format&fit=crop" 
              alt="Heizungsraum Keller" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Heizung (C.M.I.)</h2>
                <span className="text-2xl">🔥</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Außen</div>
                  <div className="text-white font-bold text-base">{heating.ausserTemp ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Solar Koll.</div>
                  <div className="text-white font-bold text-base">{heating.solarKollektor ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">WW Speicher</div>
                  <div className="text-white font-bold text-base">{heating.wwSpeicher ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Pool</div>
                  <div className="text-white font-bold text-base">{heating.pool ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 1 Oben</div>
                  <div className="text-white font-bold text-base">{heating.puffer1Oben ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 1 Unten</div>
                  <div className="text-white font-bold text-base">{heating.puffer1Unten ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 2 Oben</div>
                  <div className="text-white font-bold text-base">{heating.puffer2Oben ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">Puffer 2 Unten</div>
                  <div className="text-white font-bold text-base">{heating.puffer2Unten ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">FBH Vorlauf</div>
                  <div className="text-white font-bold text-base">{heating.fbhVorlauf ?? 0} °C</div>
                </div>
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="text-gray-300 text-xs">HK Vorlauf</div>
                  <div className="text-white font-bold text-base">{heating.hkVorlauf ?? 0} °C</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Müllabfuhr Massing (AWV) Kachel */}
          <TrashTile />

        </div>

      </div>
    </main>
  );
}