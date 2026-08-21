import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const bmwData = {
      model: "BMW iX1 xDrive30",
      soc: 78,                // Beispiel-Akkustand
      range: 320,             // Beispiel-Reichweite
      chargingStatus: "CHARGING", 
      doorsLocked: true,      
      lastUpdate: new Date().toLocaleTimeString('de-DE')
    };

    return NextResponse.json(bmwData);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Abrufen der BMW-Daten' }, { status: 500 });
  }
}