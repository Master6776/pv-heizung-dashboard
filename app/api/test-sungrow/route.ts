import { NextResponse } from 'next/server';
// @ts-ignore
import ModbusRTU from 'modbus-serial';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const client = new ModbusRTU();
  client.setTimeout(4000);

  const results: Record<string, any> = {};

  try {
    await client.connectTCP(process.env.SUNGROW_HOST || '192.168.2.181', { port: 502 });
    client.setID(1);

    const parseSigned16 = (val: number) => (val > 32767 ? val - 65536 : val);

    // Hilfsfunktion zum Lesen einzelner Register (16-bit)
    const readReg16 = async (addr: number) => {
      try {
        const res = await client.readInputRegisters(addr, 1);
        if (res?.data && res.data.length > 0) {
          const raw = res.data[0];
          return {
            raw,
            signed: parseSigned16(raw),
            val_01: Number((raw * 0.1).toFixed(1)),
            val_1: raw
          };
        }
      } catch (e: any) {
        return { error: e.message };
      }
      return null;
    };

    // Hilfsfunktion zum Lesen von 32-bit Registern (2 Register zusammen)
    const readReg32 = async (addr: number) => {
      try {
        const res = await client.readInputRegisters(addr, 2);
        if (res?.data && res.data.length >= 2) {
          const buffer = Buffer.alloc(4);
          buffer.writeUInt16BE(res.data[0], 0);
          buffer.writeUInt16BE(res.data[1], 2);
          const unsigned = buffer.readUInt32BE(0);
          return {
            raw: [res.data[0], res.data[1]],
            unsigned,
            val_01: Number((unsigned * 0.1).toFixed(1)),
          };
        }
      } catch (e: any) {
        return { error: e.message };
      }
      return null;
    };

    // Wir testen alle verdächtigen Register für Leistung, Ertrag und Verbrauch
    results['reg_5016_Power'] = await readReg16(5016); // Aktuelle Leistung
    results['reg_5002_DailyYield'] = await readReg16(5002); // Tagesertrag
    results['reg_5034_Test1'] = await readReg16(5034);
    results['reg_5038_Test2'] = await readReg16(5038);
    results['reg_5082_Test3'] = await readReg16(5082);
    results['reg_5778_Test4'] = await readReg16(5778);
    results['reg_13016_Test5'] = await readReg16(13016);
    results['reg_13022_BatterySoC'] = await readReg16(13022);

    // Manche Energieregister sind 32-bit
    results['reg_32bit_5031'] = await readReg32(5031);
    results['reg_32bit_5078'] = await readReg32(5078);
    results['reg_32bit_5080'] = await readReg32(5080);

    client.close();
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, results });
  }

  return NextResponse.json({
    success: true,
    note: "Vergleiche die Werte, um das exakte Register für den Hausverbrauch zu finden.",
    results,
  });
}