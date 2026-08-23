'use client';

import { useEffect, useState } from 'react';
import HeatingTile from '@/components/HeatingTile';
import WeatherTile from '@/components/WeatherTile';

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
  trash: [
    { type: 'Restmüll', date: '25.08.2026', icon: '🗑️' },
    { type: 'Gelber Sack', date: '28.08.2026', icon: '🟡' },
    { type: 'Bio', date: '30.08.2026', icon: '🌿' },
    { type: 'Papier', date: '02.09.2026', icon: '📄' },
  ],
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
    ausserTemp: 23.3,
    solarKollektor: 59.8,
    garage: 26.8,
    pool: 25.0,
    kesselLinks: 23.9,
    hauptkessel: 73.6,
    abgas: 185.0,
    wwSpeicherOben: 46.2,
    wwSpeicherUnten: 47.1,
    puffer1Oben: 68.8,
    puffer1Unten: 63.3,
    puffer2Oben: 59.6,
    puffer2Unten: 47.4,
    fbhVorlauf: 26.0,
    hkVorlauf: 22.5,
  }
};

interface DayForecast {
  date: string;
  kWh: string;
  numKWh: number;
}

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
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [history, setHistory] = useState<any[]>(() => [
    { time: 'Vor 15 Min', pv: 1200, house: 500, exportVal: 3 },
    { time: 'Vor 10 Min', pv: 1800, house: 650, exportVal: 8 },
    { time: 'Vor 5 Min', pv: 2400, house: 600, exportVal: 14 },
    { time: 'Live', pv: 3100, house: 750, exportVal: 19 },
  ]);
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
    humidity: 50,
    clouds: 40,
    pressure: 1013,
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
    dailyWeather: [
      { day: 'Heute', max: 22, min: 14, icon: '⛅', condition: 'Teils bewölkt' },
      { day: 'Morgen', max: 24, min: 15, icon: '☀️', condition: 'Klar' },
      { day: 'Übermorgen', max: 21, min: 13, icon: '🌧️', condition: 'Regen' }
    ]
  });
  const [alerts, setAlerts] = useState<any[]>([]);

  // Forecast.solar States
  const [forecastToday, setForecastToday] = useState<DayForecast | null>(null);
  const [forecastTomorrow, setForecastTomorrow] = useState<DayForecast | null>(null);
  const [forecastDay3, setForecastDay3] = useState<DayForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [lastUpdatedSolar, setLastUpdatedSolar] = useState<string | null>(null);

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
    } finally {
      setTimeLeft(300);
    }
  };

  const fetchWeather = async () => {
    try {
      const weatherRes = await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.3833&longitude=12.5667&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day,shortwave_radiation,uv_index,wind_speed_10m,cloud_cover,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunrise,sunset&timezone=auto');
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
        
        const humidityVal = weatherJson.current.relative_humidity_2m ?? 0;
        const cloudsVal = weatherJson.current.cloud_cover ?? 0;
        const pressureVal = weatherJson.current.surface_pressure ?? 0;

        const sunriseStr = weatherJson.daily?.sunrise?.[0] || '';
        const sunsetStr = weatherJson.daily?.sunset?.[0] || '';
        
        const sunriseTime = sunriseStr ? sunriseStr.split('T')[1].substring(0, 5) : '06:00';
        const sunsetTime = sunsetStr ? sunsetStr.split('T')[1].substring(0, 5) : '20:30';

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

        const dailyTimes = weatherJson.daily?.time || [];
        const maxTemps = weatherJson.daily?.temperature_2m_max || [];
        const minTemps = weatherJson.daily?.temperature_2m_min || [];
        const dailyCodes = weatherJson.daily?.weather_code || [];

        const dailyWeather = dailyTimes.slice(0, 3).map((timeStr: string, idx: number) => {
          const dateObj = new Date(timeStr);
          const dayName = idx === 0 ? 'Heute' : idx === 1 ? 'Morgen' : dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
          const dCode = dailyCodes[idx] ?? 0;
          
          let dIcon = '☀️';
          if (dCode >= 1 && dCode <= 3) dIcon = '⛅';
          else if (dCode >= 45 && dCode <= 48) dIcon = '🌫️';
          else if (dCode >= 51 && dCode <= 67) dIcon = '🌧️';
          else if (dCode >= 71 && dCode <= 77) dIcon = '❄️';
          else if (dCode >= 95) dIcon = '⛈️';

          return {
            day: dayName,
            max: Math.round(maxTemps[idx] ?? 0),
            min: Math.round(minTemps[idx] ?? 0),
            icon: dIcon
          };
        });

        const activeAlerts = [];
        if (code >= 95) {
          activeAlerts.push({
            title: 'Unwetterwarnung: Gewitter',
            desc: 'Schwere Gewitteraktivität in der Region registriert.',
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
          humidity: humidityVal,
          clouds: cloudsVal,
          pressure: pressureVal,
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
          dailyWeather
        });
      }
    } catch (error) { 
      console.error('Fehler beim Laden des Wetters:', error); 
    }
  };

  useEffect(() => {
    async function fetchSolarForecast() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const cachedData = localStorage.getItem('solar_forecast_data');
        const cachedDate = localStorage.getItem('solar_forecast_date');
        const cachedTimeStr = localStorage.getItem('solar_forecast_update_time');

        if (cachedData && cachedDate === todayStr) {
          const parsed = JSON.parse(cachedData);
          setForecastToday(parsed.today);
          setForecastTomorrow(parsed.tomorrow);
          setForecastDay3(parsed.day3);
          if (cachedTimeStr) setLastUpdatedSolar(cachedTimeStr);
          setForecastLoading(false);
          return;
        }

        const lat = 48.397;
        const lon = 12.571;
        const system1 = { kwp: 4.8, declination: 23, azimuth: 15 };
        const system2 = { kwp: 3.7, declination: 20, azimuth: 100 };
        const system3 = { kwp: 2.0, declination: 20, azimuth: -79 }; // 79 Grad Ost (-79)

        const url1 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system1.declination}/${system1.azimuth}/${system1.kwp}`;
        const url2 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system2.declination}/${system2.azimuth}/${system2.kwp}`;
        const url3 = `https://api.forecast.solar/estimate/${lat}/${lon}/${system3.declination}/${system3.azimuth}/${system3.kwp}`;

        const [res1, res2, res3] = await Promise.all([fetch(url1), fetch(url2), fetch(url3)]);
        const data1 = await res1.json();
        const data2 = await res2.json();
        const data3 = await res3.json();

        const nowTimeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        if (!res1.ok || !res2.ok || !res3.ok || !data1?.result?.watt_hours_day) {
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            setForecastToday(parsed.today);
            setForecastTomorrow(parsed.tomorrow);
            setForecastDay3(parsed.day3);
          }
          setForecastLoading(false);
          return;
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

        const todayObj = { 
          date: 'Heute', 
          kWh: (val(data1.result.watt_hours_day, tStr) + val(data2.result.watt_hours_day, tStr) + val(data3.result.watt_hours_day, tStr)).toFixed(1), 
          numKWh: 0 
        };
        todayObj.numKWh = parseFloat(todayObj.kWh);
        
        const tomObj = { 
          date: 'Morgen', 
          kWh: (val(data1.result.watt_hours_day, t1Str) + val(data2.result.watt_hours_day, t1Str) + val(data3.result.watt_hours_day, t1Str)).toFixed(1), 
          numKWh: 0 
        };
        tomObj.numKWh = parseFloat(tomObj.kWh);
        
        const d3ValRaw = val(data1.result.watt_hours_day, t2Str) + val(data2.result.watt_hours_day, t2Str) + val(data3.result.watt_hours_day, t2Str);
        const d3KWh = d3ValRaw > 0 ? d3ValRaw.toFixed(1) : (tomObj.numKWh * 0.95).toFixed(1);
        const d3Obj = { date: 'Übermorgen', kWh: d3KWh, numKWh: parseFloat(d3KWh) };

        setForecastToday(todayObj);
        setForecastTomorrow(tomObj);
        setForecastDay3(d3Obj);
        setLastUpdatedSolar(nowTimeStr);

        localStorage.setItem('solar_forecast_data', JSON.stringify({ today: todayObj, tomorrow: tomObj, day3: d3Obj }));
        localStorage.setItem('solar_forecast_date', todayStr);
        localStorage.setItem('solar_forecast_update_time', nowTimeStr);
      } catch (error) {
        console.error('Forecast.solar error:', error);
      } finally {
        setForecastLoading(false);
      }
    }
    fetchSolarForecast();
  }, []);

  const getBatteryColor = (soc: number) => {
    if (soc >= 75) return 'text-emerald-400';
    if (soc >= 50) return 'text-yellow-400';
    if (soc >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTheme = (kWh: number) => {
    if (kWh > 20) return { border: 'border-yellow-500/30', glow: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '☀️' };
    else if (kWh > 10) return { border: 'border-blue-500/30', glow: 'bg-blue-500/10', text: 'text-blue-400', icon: '⛅' };
    return { border: 'border-slate-700/50', glow: 'bg-slate-500/5', text: 'text-slate-400', icon: '☁️' };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData(); 
    fetchWeather();
    
    const interval = setInterval(() => { 
      fetchData(); 
      fetchWeather(); 
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const rawHeating = data?.heating || {};

  const heating = {
    ...FALLBACK_DATA.heating,
    ausserTemp: rawHeating.ausserTemp ?? rawHeating.Aussen ?? rawHeating.Aussentemperatur ?? FALLBACK_DATA.heating.ausserTemp,
    solarKollektor: rawHeating.solarKollektor ?? rawHeating.Solar ?? rawHeating.Kollektor ?? FALLBACK_DATA.heating.solarKollektor,
    garage: rawHeating.garage ?? rawHeating.Garage ?? FALLBACK_DATA.heating.garage,
    pool: rawHeating.pool ?? rawHeating.Pool ?? FALLBACK_DATA.heating.pool,
    kesselLinks: rawHeating.kesselRücklauf ?? rawHeating.kesselRuecklauf ?? rawHeating.kesselLinks ?? FALLBACK_DATA.heating.kesselLinks,
    hauptkessel: rawHeating.kesselVorlauf ?? rawHeating.kessel ?? rawHeating.hauptkessel ?? FALLBACK_DATA.heating.hauptkessel,
    abgas: rawHeating.kesselAbgas ?? rawHeating.abgas ?? rawHeating.Abgas ?? FALLBACK_DATA.heating.abgas,
    wwSpeicherOben: rawHeating.wwSpeicher ?? rawHeating.wwSpeicherOben ?? FALLBACK_DATA.heating.wwSpeicherOben,
    wwSpeicherUnten: rawHeating.wwSpeicherUnten ?? rawHeating['TSP. unten'] ?? FALLBACK_DATA.heating.wwSpeicherUnten,
    puffer1Oben: rawHeating.puffer10ben ?? rawHeating.puffer1Oben ?? FALLBACK_DATA.heating.puffer1Oben,
    puffer1Unten: rawHeating.puffer1Unten ?? FALLBACK_DATA.heating.puffer1Unten,
    puffer2Oben: rawHeating.puffer20ben ?? rawHeating.puffer2Oben ?? FALLBACK_DATA.heating.puffer2Oben,
    puffer2Unten: rawHeating.puffer2Unten ?? FALLBACK_DATA.heating.puffer2Unten,
    fbhVorlauf: rawHeating.fbhVorlauf ?? FALLBACK_DATA.heating.fbhVorlauf,
    hkVorlauf: rawHeating.hkVorlauf ?? FALLBACK_DATA.heating.hkVorlauf,
  };

  const pv = { ...FALLBACK_DATA.pv, ...(data?.pv || {}) };
  const keba = { ...FALLBACK_DATA.keba, ...(data?.keba || {}) };
  const mystrom = {
    switch1: { ...FALLBACK_DATA.mystrom.switch1, ...(data?.mystrom?.switch1 || {}) },
    switch2: { ...FALLBACK_DATA.mystrom.switch2, ...(data?.mystrom?.switch2 || {}) }
  };
  const trash = data?.trash || FALLBACK_DATA.trash;

  const dailyYield = pv.dailyYield ?? 0;
  const dailyExport = pv.dailyExport ?? 0;
  const dailyConsumption = pv.dailyConsumption ?? 0;
  const selfConsumption = Math.max(0, dailyYield - dailyExport);
  const selfConsumptionRate = dailyYield > 0 ? Math.min(100, Math.round((selfConsumption / dailyYield) * 100)) : 0;
  const autarkyRate = dailyConsumption > 0 ? Math.min(100, Math.round((selfConsumption / dailyConsumption) * 100)) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Heizung & PV Dashboard</h1>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">
              Nächster Abruf in: <strong className="text-white font-mono">{formatTime(timeLeft)}</strong>
            </span>
            <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              Live aktiv
            </span>
          </div>
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

        {/* Dashboard Kacheln Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1. Heizung Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop" 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>
            <div className="relative z-10">
              <HeatingTile heating={heating} />
            </div>
          </div>

          {/* 2. Photovoltaik Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?q=80&w=1000&auto=format&fit=crop" 
              alt="" 
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

          {/* 3. Wallbox & Plugs Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000&auto=format&fit=crop" 
              alt="" 
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

              <div>
                <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">Keba Wallbox</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Status:</span>
                    <span className="text-gray-300 font-bold text-sm">{keba.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-300 text-sm">Leistung:</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {(keba.power > 100 ? keba.power / 1000 : Number(keba.power || 0)).toFixed(2)} kW
                    </span>
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

          {/* 4. Wetter Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop" 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>
            <div className="relative z-10">
              <WeatherTile weather={weather} />
            </div>
          </div>

          {/* 5. PV-Prognose Kachel */}
          <div className="relative p-6 rounded-2xl shadow-xl border border-slate-700/80 flex flex-col justify-between overflow-hidden bg-slate-900">
            <img 
              src="https://images.unsplash.com/photo-1509391365330-0a68ead84f45?q=80&w=1000&auto=format&fit=crop" 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-xl font-bold text-white">PV-Prognose</h2>
                  <p className="text-xs text-gray-300">Forecast.solar (3 Ausrichtungen)</p>
                </div>
                <span className="text-2xl">📈</span>
              </div>

              {forecastLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Lade Prognose...</div>
              ) : (
                <div className="space-y-3">
                  {[forecastToday, forecastTomorrow, forecastDay3].map((f, i) => {
                    if (!f) return null;
                    const th = getTheme(f.numKWh);
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${th.border} ${th.glow} flex items-center justify-between backdrop-blur-md`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{th.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-gray-300 block">{f.date}</span>
                            <span className="text-lg font-bold text-white">{f.kWh} kWh</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}