import { NextResponse } from 'next/server';
// @ts-ignore
import ModbusRTU from 'modbus-serial';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let cachedHeating = {
  ausserTemp: 0,
  solarKollektor: 0,
  wwSpeicher: 0,
  wwSpeicherUnten: 0,
  puffer1Oben: 0,
  puffer1Unten: 0,
  hkVorlauf: 0,
  fbhVorlauf: 0,
  kesselRücklauf: 0,
  kesselVorlauf: 0,
  puffer2Oben: 0,
  puffer2Unten: 0,
  pool: 0,
  kesselAbgas: 0,
};

let cachedRawInputs1: any[] = [];
let cachedRawNetworkInputs1: any[] = [];

let cachedHeating37 = {
  eingang1: 0,
  eingang2: 0,
  eingang3: 0,
  eingang4: 0,
  ausgang1: 0,
  ausgang2: 0,
};

let cachedPv = { 
  currentPower: 0, 
  dailyYield: 0, 
  dailyConsumption: 0,
  batterySoc: 0,
  dailyExport: 0,
  dailyImport: 0,
  energyAnalysis: 0
};

let cachedMystrom = {
  switch1: { name: 'myStrom-Switch-DC9618', power: 0, relay: false, reachable: false, consumption: 0 },
  switch2: { name: 'myStrom-Switch-DD14B8', power: 0, relay: false, reachable: false, consumption: 0 },
};

let cachedKeba = {
  status: 0,
  substatus: 0,
  power: 0,
  current: 0,
  voltage: 0,
  totalEnergy: 0,
  reachable: false,
};

async function fetchHeatingData() {
  try {
    const cmiHost = process.env.CMI_HOST || 'http://192.168.2.215';
    const cmiNode = process.env.CMI_NODE || '1';
    const cmiUser = process.env.CMI_USER || 'admin';
    const cmiPass = process.env.CMI_PASSWORD || 'admin';
    const authHeader = 'Basic ' + Buffer.from(`${cmiUser}:${cmiPass}`).toString('base64');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${cmiHost}/INCLUDE/api.cgi?jsonnode=${cmiNode}&jsonparam=I,O,Na`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const cmiData = await res.json();
      const inputs = cmiData?.Data?.Inputs || cmiData?.inputs || cmiData?.Data?.inputs || [];
      const netInputs = cmiData?.Data?.['Network Analog'] || cmiData?.NetworkInputs || [];
      
      cachedRawInputs1 = inputs;
      cachedRawNetworkInputs1 = netInputs;

      const getIn = (inputNumber: number, arrayIndex: number) => {
        let item = inputs.find((i: any) => i?.Number === inputNumber || i?.number === inputNumber);
        if (!item) item = inputs[arrayIndex];
        if (!item) return 0;
        if (typeof item === 'number') return item;
        if (typeof item.Value === 'number') return item.Value;
        if (item.Value && typeof item.Value.Value === 'number') return item.Value.Value;
        if (item.Value && typeof item.Value.val === 'number') return item.Value.val;
        if (item.value !== undefined) return item.value;
        return 0;
      };

      const getNetIn = (num: number) => {
        const item = netInputs.find((i: any) => i?.Number === num || i?.number === num);
        if (!item) return 0;
        if (typeof item === 'number') return item;
        if (typeof item.Value === 'number') return item.Value;
        if (item.Value && typeof item.Value.Value === 'number') return item.Value.Value;
        return item.value ?? 0;
      };

      cachedHeating = {
        solarKollektor: getIn(1, 0),
        wwSpeicher: getIn(2, 1),
        wwSpeicherUnten: getIn(16, 15), 
        puffer1Oben: getIn(3, 2),
        puffer1Unten: getIn(4, 3),
        hkVorlauf: getIn(5, 4),
        fbhVorlauf: getIn(6, 5),
        kesselRücklauf: getIn(7, 6),
        kesselVorlauf: getNetIn(3) || getIn(8, 7),
        puffer2Oben: getIn(9, 8),
        puffer2Unten: getIn(10, 9),
        ausserTemp: getIn(11, 10),
        pool: getIn(13, 12),
        kesselAbgas: getNetIn(1),
      };
    }
  } catch (e: any) {
    console.error("CMI Node 1 Abruf Fehler:", e.message);
  }
}

async function fetchHeatingData37() {
  try {
    const cmiHost = process.env.CMI_HOST || 'http://192.168.2.215';
    const cmiUser = process.env.CMI_USER || 'admin';
    const cmiPass = process.env.CMI_PASSWORD || 'admin';
    const authHeader = 'Basic ' + Buffer.from(`${cmiUser}:${cmiPass}`).toString('base64');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${cmiHost}/INCLUDE/api.cgi?jsonnode=37&jsonparam=I,O`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const cmiData = await res.json();
      const inputs = cmiData?.Data?.Inputs || cmiData?.inputs || cmiData?.Data?.inputs || [];

      const getIn37 = (inputNumber: number, arrayIndex: number) => {
        let item = inputs.find((i: any) => i?.Number === inputNumber || i?.number === inputNumber);
        if (!item) item = inputs[arrayIndex];
        if (!item) return 0;
        if (typeof item === 'number') return item;
        if (typeof item.Value === 'number') return item.Value;
        if (item.Value && typeof item.Value.Value === 'number') return item.Value.Value;
        if (item.Value && typeof item.Value.val === 'number') return item.Value.val;
        if (item.value !== undefined) return item.value;
        return 0;
      };

      cachedHeating37 = {
        eingang1: getIn37(1, 0),
        eingang2: getIn37(2, 1),
        eingang3: getIn37(3, 2),
        eingang4: getIn37(4, 3),
        ausgang1: 0,
        ausgang2: 0,
      };
    }
  } catch (e: any) {
    console.error("CMI Node 37 Abruf Fehler:", e.message);
  }
}

async function fetchPvData() {
  try {
    const client = new ModbusRTU();
    client.setTimeout(4000);
    await client.connectTCP(process.env.SUNGROW_HOST || '192.168.2.181', { port: 502 });
    client.setID(1);

    let powerVal = 0;
    let rawYieldVal = 0;
    let rawConsumptionVal = 0;
    let batterySocVal = 0;

    const parseSigned16 = (val: number) => (val > 32767 ? val - 65536 : val);

    // 1. Aktuelle Leistung (Register 5016)
    try {
      const resPower = await client.readInputRegisters(5016, 1);
      if (resPower?.data && resPower.data.length > 0) {
        powerVal = Math.abs(parseSigned16(resPower.data[0]));
      }
    } catch (e) {}

    // 2. Register 5002 auslesen
    try {
      const resYield = await client.readInputRegisters(5002, 1);
      if (resYield?.data && resYield.data.length > 0) {
        rawYieldVal = resYield.data[0] * 0.1;
      }
    } catch (e) {}

    // 3. Register 13016 auslesen
    try {
      const resConsumption = await client.readInputRegisters(13016, 1);
      if (resConsumption?.data && resConsumption.data.length > 0) {
        rawConsumptionVal = resConsumption.data[0] * 0.1;
      }
    } catch (e) {}

    // Hier getauscht: Da Register 13016 in Wahrheit die Produktion (Tagesertrag) liefert und 5002 den Hausverbrauch:
    const realYield = rawConsumptionVal;
    const realConsumption = rawYieldVal;

    // 4. Batterie-SoC (Register 13022) mit Standardfaktor 0.1
    try {
      const socRes = await client.readInputRegisters(13022, 1);
      if (socRes?.data && socRes.data.length > 0) {
        const val = socRes.data[0];
        batterySocVal = Number((val * 0.1).toFixed(1));
      }
    } catch (e) {}

    const calculatedEnergyAnalysis = Number((realYield - realConsumption).toFixed(1));

    cachedPv = {
      currentPower: Number(powerVal),
      dailyYield: Number(realYield.toFixed(1)),
      dailyConsumption: Number(realConsumption.toFixed(1)),
      batterySoc: Number(batterySocVal), 
      dailyExport: 0.0,          
      dailyImport: 0.0,
      energyAnalysis: calculatedEnergyAnalysis
    };

    client.close();
  } catch (e: any) {
    console.error("Sungrow Live-Abruf Fehler:", e.message);
  }
}

async function fetchMystromData() {
  const fetchSwitch = async (ip: string, name: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`http://${ip}/report`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const totalWs = data.energy_since_boot ?? data.Ws ?? 0;
        return {
          name,
          power: data.power ?? 0,
          relay: data.relay ?? false,
          consumption: totalWs / 3600000,
          reachable: true,
        };
      }
    } catch (e) {}
    return { name, power: 0, relay: false, reachable: false, consumption: 0 };
  };

  try {
    const [s1, s2] = await Promise.all([
      fetchSwitch('192.168.2.115', 'myStrom-Switch-DC9618'),
      fetchSwitch('192.168.2.122', 'myStrom-Switch-DD14B8'),
    ]);
    cachedMystrom = { switch1: s1, switch2: s2 };
  } catch (e: any) {
    console.error("myStrom Abruf Fehler:", e.message);
  }
}

async function fetchKebaData() {
  try {
    const client = new ModbusRTU();
    client.setTimeout(10000);
    await client.connectTCP(process.env.KEBA_HOST || '192.168.2.142', { port: 502 });
    client.setID(255); 

    const readReg32 = async (addr: number) => {
      const res = await client.readHoldingRegisters(addr, 2);
      if (res?.data && res.data.length >= 2) {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt16BE(res.data[0], 0);
        buffer.writeUInt16BE(res.data[1], 2);
        return buffer.readUInt32BE(0);
      }
      return 0;
    };

    const status = await readReg32(1000);
    const voltageV = await readReg32(1040);
    const currentMa = await readReg32(1008);
    const powerMw = await readReg32(1020);
    const energyRaw = await readReg32(1036);

    cachedKeba = {
      status: status,
      substatus: 0,
      power: Number((powerMw / 1000000).toFixed(2)),
      current: Number((currentMa / 1000).toFixed(1)),
      voltage: voltageV,
      totalEnergy: Number(((energyRaw * 0.1) / 1000).toFixed(1)),
      reachable: true,
    };
    client.close();
  } catch (e: any) {
    cachedKeba.reachable = false;
  }
}

export async function GET() {
  await Promise.allSettled([
    fetchHeatingData(),
    fetchHeatingData37(),
    fetchPvData(),
    fetchMystromData(),
    fetchKebaData(),
  ]);

  return NextResponse.json({
    success: true,
    heating: cachedHeating,
    rawInputs1: cachedRawInputs1,
    rawNetworkInputs1: cachedRawNetworkInputs1,
    heating37: cachedHeating37,
    pv: cachedPv,
    mystrom: cachedMystrom,
    keba: cachedKeba,
  });
}