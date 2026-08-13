import { NextResponse } from 'next/server';
import * as ical from 'node-ical';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'abfuhr.ics');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        events: [
          { type: 'abfuhr.ics nicht gefunden', date: 'Heute', daysLeft: 0, icon: '⚠️', color: 'text-yellow-400', bgColor: 'bg-yellow-950/60 border-yellow-500/40' }
        ]
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const webEvents = ical.parseICS(fileContent);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const parsedEvents = [];

    for (const key in webEvents) {
      const event = webEvents[key] as any;
      if (event.type === 'VEVENT' && event.start) {
        const startDate = new Date(event.start);
        
        // Wir nehmen alle Termine (auch ältere aus diesem Jahr, falls du testen willst, oder ab heute)
        let icon = '🗑️';
        let color = 'text-gray-300';
        let bgColor = 'bg-gray-800/80 border-gray-600/50';
        const summary = event.summary || '';

        const lowerSummary = summary.toLowerCase();
        if (lowerSummary.includes('bio')) {
          icon = '🍎';
          color = 'text-emerald-400';
          bgColor = 'bg-emerald-950/60 border-emerald-500/40';
        } else if (lowerSummary.includes('papier')) {
          icon = '📦';
          color = 'text-blue-400';
          bgColor = 'bg-blue-950/60 border-blue-500/40';
        } else if (lowerSummary.includes('gelb') || lowerSummary.includes('sack')) {
          icon = '🟡';
          color = 'text-yellow-400';
          bgColor = 'bg-yellow-950/60 border-yellow-500/40';
        }

        parsedEvents.push({
          type: summary,
          dateObj: startDate,
          icon,
          color,
          bgColor
        });
      }
    }

    // Sortieren: Nur Termine ab heute (oder Zukunft)
    const futureEvents = parsedEvents
      .filter(e => e.dateObj >= now)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    // Fallback falls die ICS-Datei aus einem anderen Jahr ist: Zeige einfach die nächsten 4 Events überhaupt an
    const eventsToDisplay = futureEvents.length > 0 ? futureEvents : parsedEvents.slice(0, 4);

    const nextEvents = eventsToDisplay.slice(0, 4).map(e => {
      const diffTime = e.dateObj.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const formattedDate = e.dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
      
      return {
        type: e.type,
        date: formattedDate,
        daysLeft,
        icon: e.icon,
        color: e.color,
        bgColor: e.bgColor
      };
    });

    return NextResponse.json({ success: true, events: nextEvents });
  } catch (error) {
    console.error('Fehler beim Laden des Abfuhrkalenders:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Abfuhrkalenders' }, { status: 500 });
  }
}