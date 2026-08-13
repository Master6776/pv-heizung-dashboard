'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardTimer({ intervalSeconds = 300 }: { intervalSeconds?: number }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(intervalSeconds);
  const [spinning, setSpinning] = useState<boolean>(false);

  // Manueller Refresh per Klick
  const handleManualRefresh = () => {
    setSpinning(true);
    router.refresh();
    setTimeLeft(intervalSeconds); // Timer zurücksetzen
    setTimeout(() => setSpinning(false), 800); // Animation stoppen
  };

  useEffect(() => {
    // Sekundlicher Countdown-Ticker
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          router.refresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, intervalSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <button 
      onClick={handleManualRefresh}
      title="Klicken zum sofortigen Aktualisieren"
      className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-3 py-1 rounded-full shadow-sm text-xs hover:border-slate-500 transition-all cursor-pointer group"
    >
      <span className="text-gray-400">Update in:</span>
      <span className="font-mono text-emerald-400 font-bold">{formattedTime}</span>
      <span className={`inline-block text-sm transition-transform duration-700 ${spinning ? 'rotate-180' : 'group-hover:scale-110'}`}>
        🔄
      </span>
    </button>
  );
}