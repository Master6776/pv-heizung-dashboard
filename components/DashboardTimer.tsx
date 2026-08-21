'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardTimer() {
  const router = useRouter();
  const intervalSeconds = 300; // 5 Minuten
  const [timeLeft, setTimeLeft] = useState(intervalSeconds);

  // 1. Timer-Logik (läuft jede Sekunde)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : intervalSeconds));
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds]);

  // 2. Router-Refresh sauber in ein useEffect ausgelagert
  useEffect(() => {
    if (timeLeft === intervalSeconds) {
      router.refresh();
    }
  }, [timeLeft, intervalSeconds, router]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="text-xs text-gray-400">
      Nächstes Update in: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </span>
  );
}