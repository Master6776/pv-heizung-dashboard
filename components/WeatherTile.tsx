interface WeatherProps {
  weather: {
    temp: number;
    rain: number;
    windSpeed: number;
    condition: string;
    icon: string;
    aqi: number;
    aqiText: string;
    radiation: number;
    uvIndex: number;
    humidity: number;
    pressure: number;
    clouds: number;
    sunrise: string;
    sunset: string;
    moonPhase: string;
    moonIcon: string;
    moonIllumination: number;
    dailyWeather?: Array<{
      day: string;
      max: number;
      min: number;
      icon: string;
    }>;
  };
}

export default function WeatherTile({ weather }: WeatherProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-bold text-white">Wetter & Astronomie</h2>
          <p className="text-xs text-gray-300">Aktuelle Daten & Vorhersage</p>
        </div>
        <span className="text-2xl">{weather.icon}</span>
      </div>

      {/* Hauptwerte */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Temperatur</span>
          <span className="text-2xl font-bold text-white">{weather.temp}°C</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Bedingung</span>
          <span className="text-base font-bold text-white truncate block">{weather.condition}</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Wind</span>
          <span className="text-lg font-bold text-white">{weather.windSpeed} km/h</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Niederschlag</span>
          <span className="text-lg font-bold text-white">{weather.rain} mm</span>
        </div>
      </div>

      {/* Zusatzwerte (Energie- & Klima-relevant) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Luftfeuchte</span>
          <span className="text-lg font-bold text-cyan-400">{weather.humidity}%</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Bewölkung</span>
          <span className="text-lg font-bold text-blue-300">{weather.clouds}%</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">UV-Index</span>
          <span className="text-lg font-bold text-amber-400">{weather.uvIndex}</span>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <span className="text-xs text-gray-300 block mb-1">Sonnestärke</span>
          <span className="text-base font-bold text-yellow-400">{Math.round(weather.radiation || 0)} W/m²</span>
        </div>
      </div>

      {/* Astronomie & Luftqualität */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-gray-300">Luftqualität</span>
          <div>
            <span className="text-sm font-bold text-emerald-400">{weather.aqiText || 'Gut'}</span>
            <span className="text-[10px] text-gray-400 block">AQI: {weather.aqi}</span>
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-gray-300">Sonne</span>
          <div className="text-xs space-y-0.5 mt-1">
            <div className="flex items-center space-x-1">
              <span>🌅</span>
              <span className="text-white font-medium">{weather.sunrise}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🌇</span>
              <span className="text-white font-medium">{weather.sunset}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-gray-300">Mondphase</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg">{weather.moonIcon || '🌕'}</span>
            <div>
              <span className="text-xs font-bold text-white block truncate">{weather.moonPhase}</span>
              <span className="text-[10px] text-gray-400">{weather.moonIllumination}% beleuchtet</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tage Wettervorhersage */}
      <div className="pt-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold block mb-2">Vorhersage (3 Tage)</span>
        <div className="grid grid-cols-3 gap-3">
          {weather.dailyWeather?.map((dayItem, idx) => (
            <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 text-center flex flex-col items-center justify-between">
              <span className="text-xs font-bold text-gray-300">{dayItem.day}</span>
              <span className="text-2xl my-1">{dayItem.icon}</span>
              <div className="text-xs font-bold space-x-1">
                <span className="text-white">{dayItem.max}°</span>
                <span className="text-gray-400 font-normal">{dayItem.min}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}