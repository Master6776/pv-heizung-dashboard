import { NextResponse } from 'next/server';
// @ts-ignore
import ModbusRTU from 'modbus-serial';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = new ModbusRTU();
    client.setTimeout(4000);
    await client.connectTCP(process.env.SUNGROW_HOST || '192.168.2.181', { port: 502 });
    client.setID(1);

    const results: any = {};

    // Hilfsfunktion zum Auslesen von 32-Bit Registern (2 Register)
    async function read32(addr: number) {
      try {
        const res = await client.readInputRegisters(addr, 2);
        if (res?.data && res.data.length >= 2) {
          const buffer = Buffer.alloc(4);
          buffer.writeUInt16BE(res.data[0], 0);
          buffer.writeUInt16BE(res.data[1], 2);
          const unsigned = buffer.readUInt32BE(0);
          return {
            raw: res.data,
            unsigned,
            val_01: unsigned * 0.1,
            val_001: unsigned * 0.01,
            val_0001: unsigned * 0.001,
            val_00001: unsigned * 0.0001,
          };
        }
      } catch (e: any) {
        return { error: e.message };
      }
      return { error: "Keine Daten" };
    }

    // Hilfsfunktion für 16-Bit Register
    async function read16(addr: number) {
      try {
        const res = await client.readInputRegisters(addr, 1);
        if (res?.data && res.data.length > 0) {
          const val = res.data[0];
          return {
            raw: val,
            val_1: val,
            val_01: val * 0.1,
            val_001: val * 0.01,
          };
        }
      } catch (e: any) {
        return { error: e.message };
      }
      return { error: "Keine Daten" };
    }

    // Wir testen die typischen Register für Last / Verbrauch / Tagesverbrauch
    results.reg_13039_LoadEnergy = await read32(13039); // 32-bit Lastenergie
    results.reg_13009_DailyLoad = await read16(13009);  // oft täglicher Eigenverbrauch / Last
    results.reg_13001_DailyYield = await read16(13001); // Tagesertrag (zum Vergleich)

    client.close();

    return NextResponse.json({ success: true, results }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}