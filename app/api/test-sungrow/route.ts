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
    const host = process.env.SUNGROW_HOST || '192.168.2.181';
    await client.connectTCP(host, { port: 502 });
    client.setID(1);

    // Lese Register 5000 bis 5035 aus
    const res = await client.readInputRegisters(5000, 36);
    res.data.forEach((val: number, idx: number) => {
      const regNum = 5000 + idx;
      results[`Reg_${regNum}`] = {
        raw: val,
        as01: Number((val * 0.1).toFixed(1)),
        as001: Number((val * 0.01).toFixed(2)),
      };
    });

    client.close();
    return NextResponse.json({ success: true, registerScan: results });
  } catch (e: any) {
    if (client.isOpen) client.close();
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}