import { NextResponse } from 'next/server';
// @ts-ignore
import ModbusRTU from 'modbus-serial';

let cachedHeating = {
  ausserTemp: 0,
  solarKollektor: 0,
  wwSpeicher: 0,
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

let cachedPv = { 
  currentPower: 0, 
  dailyYield: 0, 
  dailyConsumption: 0,
  batterySoc: 0,
  dailyExport: 0
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
    const cmiHost = process.env.CMI_HOST || 'http://192.168.2.133';
    const cmiNode = process.env.CMI_NODE || '1';
    const cmiUser = process.env.CMI_USER || 'admin';
    const cmiPass = process.env.CMI_PASSWORD || 'admin';
    const authHeader = 'Basic ' + Buffer.from(`${cmiUser}:${cmiPass}`).toString('base64');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${cmiHost}/INCLUDE/api.cgi?jsonnode=${cmiNode}&jsonparam=I,O`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const cmiData = await res.json();
      const inputs = cmiData?.Data?.Inputs || cmiData?.inputs || [];
      const getIn = (idx: number) => {
        const item = inputs[idx];
        if (!item) return 0;
        if (typeof item === 'number') return item;
        if (typeof item.Value === 'number') return item.Value;
        if (item.Value && typeof item.Value.Value === 'number') return item.Value.Value;
        if (item.Value && typeof item.Value.val === 'number') return item.Value.val;
        if (item.value !== undefined) return item.value;
        return 0;
      };

      cachedHeating = {
        solarKollektor: getIn(0),
        wwSpeicher: getIn(1),
        puffer1Oben: getIn(2),
        puffer1Unten: getIn(3),
        hkVorlauf: getIn(4),
        fbhVorlauf: getIn(5),
        kesselRücklauf: getIn(6),
        kesselVorlauf: getIn(7),
        puffer2Oben: getIn(8),
        puffer2Unten: getIn(9),
        ausserTemp: getIn(10),
        pool: getIn(12),
        kesselAbgas: 0,
      };
    }
  } catch (e: any) {
    console.error("CMI Abruf Fehler:", e.message);
  }
}

async function fetchPvData() {
  try {
    const client = new ModbusRTU();
    client.setTimeout(2000);
    await client.connectTCP(process.env.SUNGROW_HOST || '192.168.2.102', { port: 502 });
    client.setID(1);

    const dataPower = await client.readInputRegisters(5000, 20);
    const dataEnergy = await client.readInputRegisters(13000, 50);
    
    if (dataPower?.data && dataEnergy?.data) {
      const regsPower = dataPower.data;
      const regsEnergy = dataEnergy.data;
      const powerRaw = regsPower[16] ?? 0;
      const dailyYieldRaw = regsEnergy[1] ?? 0;          
      const directConsumptionRaw = regsEnergy[16] ?? 0;  
      const batteryDischargeRaw = regsEnergy[25] ?? 0;   
      const importEnergyRaw = regsEnergy[35] ?? 0;       
      const batterySocRaw = regsEnergy[22] ?? 0;         
      const dailyExportRaw = regsEnergy[44] ?? 0;        
      const totalConsumption = (directConsumptionRaw + batteryDischargeRaw + importEnergyRaw) * 0.1;

      cachedPv = {
        currentPower: powerRaw,
        dailyYield: Number((dailyYieldRaw * 0.1).toFixed(1)),
        dailyConsumption: Number(totalConsumption.toFixed(1)),
        batterySoc: Number((batterySocRaw * 0.1).toFixed(0)),
        dailyExport: Number((dailyExportRaw * 0.1).toFixed(1)),
      };
    }
    client.close();
  } catch (e: any) {
    console.error("Sungrow Abruf Fehler:", e.message);
  }
}

async function fetchMystromData() {
  const fetchSwitch = async (ip: string, name: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`http://${ip}/report`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const totalWs = data.energy_since_boot ?? data.Ws ?? 0;
        const consumptionValue = totalWs / 3600000;

        return {
          name,
          power: data.power ?? 0,
          relay: data.relay ?? false,
          consumption: consumptionValue,
          reachable: true,
        };
      }
    } catch (e) {
      console.error(`myStrom Fehler bei ${ip}:`, e);
    }
    return { name, power: 0, relay: false, reachable: false, consumption: 0 };
  };

  try {
    const [s1, s2] = await Promise.all([
      fetchSwitch('192.168.2.115', 'myStrom-Switch-DC9618'),
      fetchSwitch('192.168.2.118', 'myStrom-Switch-DD14B8'),
    ]);

    cachedMystrom = {
      switch1: s1,
      switch2: s2,
    };
  } catch (e: any) {
    console.error("myStrom Abruf Fehler:", e.message);
  }
}

async function fetchKebaData() {
  try {
    const client = new ModbusRTU();
    client.setTimeout(5000);
    await client.connectTCP(process.env.KEBA_HOST || '192.168.2.142', { port: 502 });
    client.setID(255); 

    // Geändert auf readHoldingRegisters (FC 03) für KEBA P40 Telemetrie
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

    const totalEnergyKwh = Number(((energyRaw * 0.1) / 1000).toFixed(1));

    cachedKeba = {
      status: status,
      substatus: 0,
      power: Number((powerMw / 1000000).toFixed(2)),
      current: Number((currentMa / 1000).toFixed(1)),
      voltage: voltageV,
      totalEnergy: totalEnergyKwh,
      reachable: true,
    };
    client.close();
  } catch (e: any) {
    console.error("KEBA P40 Abruf Fehler:", e.message);
    cachedKeba.reachable = false;
  }
}

export async function GET() {
  await Promise.allSettled([
    fetchHeatingData(),
    fetchPvData(),
    fetchMystromData(),
    fetchKebaData(),
  ]);

  return NextResponse.json({
    success: true,
    heating: cachedHeating,
    pv: cachedPv,
    mystrom: cachedMystrom,
    keba: cachedKeba,
  });
}