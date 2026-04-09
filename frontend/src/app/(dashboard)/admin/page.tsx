"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import GasChart from "@/components/gaschart";
import UserCard from "@/components/UserCard";
import RiskTrendChart from "@/components/RiskTrendChart";
import GasComparisonChart from "@/components/GasComparisonChart";

interface GasData {
  LPG_Concentration?: string;
  CO_Concentration?: string;
  Methane_Concentration?: string;
  Hydrogen_Concentration?: string;
  NH3_Concentration?: string;
  CO2_Concentration?: string;
  Alcohol_Concentration?: string;
  success?: boolean;
  probability?: string;
}

interface RiskPoint {
  time: string;
  probability: number;
}

interface EdgeModelStatus {
  version: number;
  sampleCount: number;
  metrics?: {
    validationLoss?: number | null;
    trainingSamples?: number;
    lastRetrainedAt?: string | null;
    nextRetrainAt?: string | null;
  };
}

const AdminPage = () => {
  const [gasData, setGasData] = useState<GasData | null>(null);
  const [lastValidGasData, setLastValidGasData] = useState<GasData | null>(null);
  const [probability, setProbability] = useState<number | null>(null);
  const [lastValidProbability, setLastValidProbability] = useState<number | null>(null);
  const [riskHistory, setRiskHistory] = useState<RiskPoint[]>([]);
  const [edgeStatus, setEdgeStatus] = useState<EdgeModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGasData = async () => {
      try {
        const snapshotResponse = await axios.get("/api/probability/snapshot");
        const gasData = snapshotResponse.data as GasData;

        // Check if the response contains valid numerical data
        if (gasData && gasData.success) {
          setGasData(gasData);
          setLastValidGasData(gasData); // Update last valid value
        }

        const probValue = parseFloat(String(gasData.probability));

        if (!isNaN(probValue)) {
          setProbability(probValue);
          setLastValidProbability(probValue);
          setRiskHistory((prev) => {
            const nextPoint = {
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              probability: Number((probValue * 100).toFixed(2)),
            };
            const next = [...prev, nextPoint];
            return next.length > 20 ? next.slice(next.length - 20) : next;
          });
        }
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Live stream interrupted. Showing last valid values.");
      } finally {
        setLoading(false);
      }
    };

    fetchGasData();

    // Refresh data every 1 second
    const interval = setInterval(fetchGasData, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchModelStatus = async () => {
      try {
        const response = await axios.get("/api/probability/model-status");
        if (response.data?.success) {
          setEdgeStatus(response.data.status);
        }
      } catch (err) {
        console.error("Model status fetch error:", err);
      }
    };

    fetchModelStatus();
    const interval = setInterval(fetchModelStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p className="text-center mt-10 text-lg text-gray-600 dark:text-slate-300">Loading...</p>;

  return (
    <div className="w-full p-1.5 sm:p-4 md:p-6">

      <div className="w-full space-y-2 sm:space-y-6">
        {error && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {error}
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5 sm:gap-3">
          <div>
            <h1 className="text-sm sm:text-2xl font-bold text-gray-800 dark:text-slate-100">Operational Dashboard</h1>
            <p className="hidden sm:block text-[11px] sm:text-sm text-gray-500 dark:text-slate-400">
              Real-time environmental and suffocation risk monitoring
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {error ? "Reconnecting..." : "Live Stream"}
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              1s Refresh
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Edge Model v{edgeStatus?.version ?? 1}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-4">
          <div className="rounded-2xl border border-indigo-100 bg-white/90 p-3 sm:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">Samples</p>
            <p className="mt-1 text-sm sm:text-2xl font-semibold text-gray-800 dark:text-slate-100">
              {edgeStatus?.sampleCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white/90 p-3 sm:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">Retrained</p>
            <p className="mt-1 text-[10px] sm:text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
              {edgeStatus?.metrics?.lastRetrainedAt
                ? new Date(edgeStatus.metrics.lastRetrainedAt).toLocaleTimeString()
                : "Pending"}
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white/90 p-3 sm:p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400">Loss</p>
            <p className="mt-1 text-sm sm:text-2xl font-semibold text-gray-800 dark:text-slate-100">
              {edgeStatus?.metrics?.validationLoss ?? "--"}
            </p>
          </div>
        </div>

        {/* Gas Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-4">
          <UserCard 
            type="O2" 
            displayName="LPG"
            percentage={
              !isNaN(gasData?.LPG_Concentration) 
                ? gasData?.LPG_Concentration 
                : lastValidGasData?.LPG_Concentration || "N/A"
            }
          />
          <UserCard 
            type="CO2" 
            displayName="Carbon Dioxide (CO₂)"
            percentage={
              !isNaN(gasData?.CO2_Concentration) 
                ? gasData?.CO2_Concentration 
                : lastValidGasData?.CO2_Concentration || "N/A"
            }
          />
          <UserCard 
            type="H2O" 
            displayName="Ammonia (NH3)"
            percentage={
              !isNaN(gasData?.NH3_Concentration) 
                ? gasData?.NH3_Concentration 
                : lastValidGasData?.NH3_Concentration || "N/A"
            }
          />
          <UserCard 
            type="CO" 
            displayName="Carbon Monoxide (CO)"
            percentage={
              !isNaN(gasData?.CO_Concentration) 
                ? gasData?.CO_Concentration 
                : lastValidGasData?.CO_Concentration || "N/A"
            }
          />
        </div>

        {/* Probability Display */}
        <div className="bg-white/90 border border-indigo-100 shadow-sm rounded-2xl p-2 sm:p-5 text-center dark:bg-slate-900 dark:border-slate-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100">Suffocation Probability</h2>
          <p className="text-2xl sm:text-3xl text-indigo-600 font-semibold mt-2 dark:text-indigo-400">
            {probability !== null 
              ? `${(probability*100).toFixed(2)}%` 
              : lastValidProbability !== null 
                ? `${(lastValidProbability*100).toFixed(2)}%`
                : "N/A"
            }
          </p>
        </div>

        {/* Pro Analytics Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 sm:gap-4">
          <RiskTrendChart data={riskHistory} />
          <GasComparisonChart gasData={gasData || lastValidGasData} />
        </div>

        {/* Charts Section */}
        <div className="w-full">
          <div className="bg-white/90 border border-indigo-100 rounded-2xl shadow-sm p-2 sm:p-4 h-[260px] sm:h-[400px] overflow-auto dark:bg-slate-900 dark:border-slate-700">
            <GasChart gasData={gasData || lastValidGasData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
