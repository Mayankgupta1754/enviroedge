import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("data");
const STATE_PATH = path.join(DATA_DIR, "edge-model-state.json");
const SAMPLE_BUFFER_SIZE = Number(process.env.EDGE_SAMPLE_BUFFER_SIZE || 2000);
const RETRAIN_INTERVAL_MS = Number(process.env.EDGE_RETRAIN_INTERVAL_MS || 10 * 60 * 1000);
const MIN_TRAIN_SAMPLES = Number(process.env.EDGE_MIN_TRAIN_SAMPLES || 60);

const FEATURE_KEYS = ["MQ5A0", "MQ5D0", "MQ135A0", "DHT11_T", "DHT11_H"];

const defaultModel = {
  version: 1,
  bias: -4.7566971426,
  weights: {
    MQ5A0: 0.000029467,
    MQ5D0: -0.1580552106,
    MQ135A0: 0.0012048012,
    DHT11_T: 0.1435473991,
    DHT11_H: 0.0040330661,
  },
  metrics: {
    validationLoss: null,
    trainingSamples: 0,
    lastRetrainedAt: null,
    nextRetrainAt: null,
  },
};

let state = {
  model: defaultModel,
  samples: [],
};

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sigmoid = (z) => 1 / (1 + Math.exp(-clamp(z, -40, 40)));

const dotProduct = (weights, x) =>
  FEATURE_KEYS.reduce((sum, key) => sum + (weights[key] || 0) * (Number(x[key]) || 0), 0);

const binaryCrossEntropy = (y, p) => {
  const prob = clamp(p, 1e-8, 1 - 1e-8);
  return -(y * Math.log(prob) + (1 - y) * Math.log(1 - prob));
};

const saveState = () => {
  ensureDataDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
};

const loadState = () => {
  ensureDataDir();
  if (!fs.existsSync(STATE_PATH)) {
    saveState();
    return;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    if (parsed?.model?.weights) {
      state = parsed;
    }
  } catch (error) {
    console.error("Failed to load edge model state, using defaults:", error.message);
    saveState();
  }
};

const normalizeLabel = (pValue) => {
  const parsed = Number(pValue);
  if (Number.isNaN(parsed)) return null;
  return parsed > 0 ? 1 : 0;
};

const splitTrainValidation = (samples) => {
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * 0.8);
  return {
    train: shuffled.slice(0, splitIndex),
    validation: shuffled.slice(splitIndex),
  };
};

const evaluateLoss = (model, dataset) => {
  if (!dataset.length) return Number.POSITIVE_INFINITY;
  const totalLoss = dataset.reduce((sum, sample) => {
    const prediction = predictProbability(sample.features, model);
    return sum + binaryCrossEntropy(sample.label, prediction);
  }, 0);
  return totalLoss / dataset.length;
};

const trainCandidateModel = (baseModel, trainSet) => {
  const candidate = {
    ...baseModel,
    weights: { ...baseModel.weights },
  };

  const learningRate = 1e-6;
  const epochs = 4;

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    for (const sample of trainSet) {
      const predicted = predictProbability(sample.features, candidate);
      const error = predicted - sample.label;

      candidate.bias -= learningRate * error;
      for (const key of FEATURE_KEYS) {
        const x = Number(sample.features[key]) || 0;
        candidate.weights[key] -= learningRate * error * x;
      }
    }
  }

  return candidate;
};

const scheduleMetadataUpdate = () => {
  state.model.metrics.nextRetrainAt = new Date(Date.now() + RETRAIN_INTERVAL_MS).toISOString();
};

export const initEdgeIntelligence = () => {
  loadState();
  scheduleMetadataUpdate();
  saveState();

  setInterval(() => {
    retrainModel();
  }, RETRAIN_INTERVAL_MS);
};

export const predictProbability = (sensorData, model = state.model) => {
  const linear = model.bias + dotProduct(model.weights, sensorData);
  return sigmoid(linear);
};

export const appendTrainingSample = (sensorData) => {
  const label = normalizeLabel(sensorData?.p);
  if (label === null) return;

  const sample = {
    timestamp: new Date().toISOString(),
    features: FEATURE_KEYS.reduce((acc, key) => {
      acc[key] = Number(sensorData[key]) || 0;
      return acc;
    }, {}),
    label,
  };

  state.samples.push(sample);
  if (state.samples.length > SAMPLE_BUFFER_SIZE) {
    state.samples = state.samples.slice(state.samples.length - SAMPLE_BUFFER_SIZE);
  }
};

export const retrainModel = () => {
  if (state.samples.length < MIN_TRAIN_SAMPLES) {
    scheduleMetadataUpdate();
    saveState();
    return { updated: false, reason: "Not enough samples" };
  }

  const { train, validation } = splitTrainValidation(state.samples);
  if (!train.length || !validation.length) {
    scheduleMetadataUpdate();
    saveState();
    return { updated: false, reason: "Insufficient split data" };
  }

  const baseLoss = evaluateLoss(state.model, validation);
  const candidate = trainCandidateModel(state.model, train);
  const candidateLoss = evaluateLoss(candidate, validation);

  const improved = candidateLoss + 1e-6 < baseLoss;
  if (improved) {
    state.model = {
      ...candidate,
      version: (state.model.version || 1) + 1,
      metrics: {
        validationLoss: Number(candidateLoss.toFixed(6)),
        trainingSamples: state.samples.length,
        lastRetrainedAt: new Date().toISOString(),
        nextRetrainAt: null,
      },
    };
  }

  scheduleMetadataUpdate();
  saveState();

  return {
    updated: improved,
    previousLoss: Number(baseLoss.toFixed(6)),
    candidateLoss: Number(candidateLoss.toFixed(6)),
    version: state.model.version,
  };
};

export const getEdgeModelStatus = () => ({
  version: state.model.version,
  metrics: state.model.metrics,
  sampleCount: state.samples.length,
  featureKeys: FEATURE_KEYS,
});
