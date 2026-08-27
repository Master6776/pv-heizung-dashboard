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
            val_1: unsigned,
            val_001: Number((unsigned * 0.01).toFixed(2))
          };
        }
      } catch (e: any) {
        return { error: e.message };
      }
      return null;
    };

    // Testung verschiedener potenzieller Register für Ertrag / Energie
    results['reg_13039_LoadEnergy'] = await readReg32(13039);
    results['reg_13041_ExportEnergy'] = await readReg32(13041);
    results['reg_13035_DirectEnergy'] = await readReg32(13035);
    results['reg_5070_TotalEnergy'] = await readReg32(5070);
    results['reg_5072_ExportEnergy'] = await readReg32(5072);
    results['reg_5074_ImportEnergy'] = await readReg32(5074);
    
    // Ergänzend: Direktes Testen von Register 5003 und 13000 (falls du die auch direkt sehen willst)
    results['reg_5003_DailyYield'] = await readReg32(5003);
    results['reg_13000_DailyYield'] = await readReg32(13000);

    client.close();
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, results });
  }

  return NextResponse.json({ success: true, results });
}