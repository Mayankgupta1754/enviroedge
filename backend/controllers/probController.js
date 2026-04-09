import { SerialPort } from "serialport";
import {
  appendTrainingSample,
  getEdgeModelStatus,
  predictProbability,
} from "../services/edgeIntelligence.js";

const PORT_NAME = "COM3"; // Change this as per your port
const BAUD_RATE = 9600;
const SNAPSHOT_TTL_MS = Number(process.env.SNAPSHOT_TTL_MS || 900);

let latestSnapshot = null;
let lastSnapshotAt = 0;
let pendingSnapshotPromise = null;

const GAS_CONSTANTS = {
  LPG: { A: 200, B: -0.45 },
  CO: { A: 300, B: -0.35 },
  Methane: { A: 150, B: -0.4 },
  Hydrogen: { A: 180, B: -0.42 },
  NH3: { A: 250, B: -0.3 },
  CO2: { A: 400, B: -0.5 },
  Alcohol: { A: 220, B: -0.38 },
};

const calculateGasConcentration = (sensorValue, A, B) => {
  const VRL = (sensorValue / 1023.0) * 5.0;
  const RS = ((5.0 - VRL) / VRL) * 10;
  return A * Math.pow(RS / 10, B);
};

const buildGasPayload = (sensorData) => {
  const LPG_Concentration = calculateGasConcentration(
    sensorData.MQ5A0,
    GAS_CONSTANTS.LPG.A,
    GAS_CONSTANTS.LPG.B
  );
  const CO_Concentration = calculateGasConcentration(
    sensorData.MQ135A0,
    GAS_CONSTANTS.CO.A,
    GAS_CONSTANTS.CO.B
  );
  const Methane_Concentration = calculateGasConcentration(
    sensorData.MQ5A0,
    GAS_CONSTANTS.Methane.A,
    GAS_CONSTANTS.Methane.B
  );
  const Hydrogen_Concentration = calculateGasConcentration(
    sensorData.MQ5A0,
    GAS_CONSTANTS.Hydrogen.A,
    GAS_CONSTANTS.Hydrogen.B
  );
  const NH3_Concentration = calculateGasConcentration(
    sensorData.MQ135A0,
    GAS_CONSTANTS.NH3.A,
    GAS_CONSTANTS.NH3.B
  );
  const CO2_Concentration = calculateGasConcentration(
    sensorData.MQ135A0,
    GAS_CONSTANTS.CO2.A,
    GAS_CONSTANTS.CO2.B
  );
  const Alcohol_Concentration = calculateGasConcentration(
    sensorData.MQ135A0,
    GAS_CONSTANTS.Alcohol.A,
    GAS_CONSTANTS.Alcohol.B
  );

  return {
    LPG_Concentration: LPG_Concentration.toFixed(2),
    CO_Concentration: CO_Concentration.toFixed(2),
    Methane_Concentration: Methane_Concentration.toFixed(2),
    Hydrogen_Concentration: Hydrogen_Concentration.toFixed(2),
    NH3_Concentration: NH3_Concentration.toFixed(2),
    CO2_Concentration: CO2_Concentration.toFixed(2),
    Alcohol_Concentration: Alcohol_Concentration.toFixed(2),
  };
};

const buildFullSnapshot = (sensorData) => {
  const probability = predictProbability(sensorData);
  appendTrainingSample(sensorData);
  const gasPayload = buildGasPayload(sensorData);

  return {
    success: true,
    probability: probability.toFixed(4),
    ...gasPayload,
  };
};

const getSharedSnapshot = async () => {
  const now = Date.now();
  if (latestSnapshot && now - lastSnapshotAt < SNAPSHOT_TTL_MS) {
    return latestSnapshot;
  }

  if (pendingSnapshotPromise) {
    return pendingSnapshotPromise;
  }

  pendingSnapshotPromise = (async () => {
    const sensorData = await readSerialData();
    const snapshot = buildFullSnapshot(sensorData);
    latestSnapshot = snapshot;
    lastSnapshotAt = Date.now();
    return snapshot;
  })();

  try {
    return await pendingSnapshotPromise;
  } finally {
    pendingSnapshotPromise = null;
  }
};

const readSerialData = async () => {
  return new Promise((resolve, reject) => {
    try {
      const port1 = new SerialPort({
        path: PORT_NAME,
        baudRate: BAUD_RATE,
        autoOpen: false, // Prevent auto-open
      });

      let buffer = "";

      // Open the port explicitly
      port1.open((err) => {
        if (err) {
          return reject(new Error("Failed to open serial port: " + err.message));
        }
      });

      const onData = (data) => {
        buffer += data.toString("utf-8");

        if (buffer.includes("\n")) {
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep incomplete data

          const cleanLine = lines[0]?.replace("\r", "").trim();
          if (cleanLine) {
            const values = cleanLine.split(",").map((val) => val.trim());
            if (values.length === 7) {
              const [MQ5A0, MQ5D0, MQ135A0, MQ135D0, DHT11_T, DHT11_H, p] =
                values.map(Number);

              const sensorData = {
                MQ5A0,
                MQ5D0,
                MQ135A0,
                MQ135D0,
                DHT11_T,
                DHT11_H,
                p,
              };

              cleanup();
              return resolve(sensorData);
            } else {
              cleanup();
              return reject(new Error("Invalid sensor data format"));
            }
          }
        }
      };

      // Function to clean up the serial connection
      const cleanup = () => {
        if (port1 && port1.isOpen) {
          port1.removeListener("data", onData);
          port1.close((err) => {
            if (err) console.error("Error closing port:", err.message);
          });
        }
      };

      port1.on("data", onData);

      port1.on("error", (err) => {
        cleanup();
        return reject(new Error("Serial Port Error: " + err.message));
      });

      // Timeout to prevent hanging requests
      setTimeout(() => {
        cleanup();
        return reject(new Error("Timeout: No data received from sensor"));
      }, 5000);
    } catch (error) {
      return reject(error);
    }
  });
};

// **Controller for Probability Calculation**
const probValue = async (req, res) => {
  try {
    const snapshot = await getSharedSnapshot();
    return res.json({ success: true, probability: snapshot.probability });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

const edgeModelStatus = async (req, res) => {
  try {
    return res.json({ success: true, status: getEdgeModelStatus() });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

const snapshotValue = async (req, res) => {
  try {
    const snapshot = await getSharedSnapshot();
    return res.json(snapshot);
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// **Controller for Gas Concentration Calculation**
const gasValue = async (req, res) => {
  try {
    const snapshot = await getSharedSnapshot();
    res.json({
      success: true,
      LPG_Concentration: snapshot.LPG_Concentration,
      CO_Concentration: snapshot.CO_Concentration,
      Methane_Concentration: snapshot.Methane_Concentration,
      Hydrogen_Concentration: snapshot.Hydrogen_Concentration,
      NH3_Concentration: snapshot.NH3_Concentration,
      CO2_Concentration: snapshot.CO2_Concentration,
      Alcohol_Concentration: snapshot.Alcohol_Concentration,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export { probValue, gasValue, edgeModelStatus, snapshotValue };

