const ModbusRTU = require("modbus-serial");
const client = new ModbusRTU();

async function readWallbox() {
  try {
    await client.connectTCP("192.168.2.142", { port: 502 });
    // Wichtig: Die KEBA P40 verwendet standardmäßig Unit ID 255
    client.setID(255);
    console.log("Verbunden! Lese Status-Register 1000...");

    const data = await client.readHoldingRegisters(1000, 2);
    console.log("Register-Werte:", data.data);

    client.close();
  } catch (e) {
    console.error("Fehler:", e.message);
    client.close();
  }
}

readWallbox();
