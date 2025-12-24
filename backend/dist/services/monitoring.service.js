"use strict";
/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMonitoring = startMonitoring;
const os = __importStar(require("os"));
const instances_service_1 = require("./instances.service");
const rcon_service_1 = require("./rcon.service");
const fs = __importStar(require("fs/promises"));
const MONITOR_INTERVAL_MS = 60 * 1000; // 1 minute
const CPU_THRESHOLD = 0.9; // 90% load per core
function startMonitoring() {
    console.log('[Monitoring] Service started');
    // Run initial check after 10s
    setTimeout(checkResources, 10000);
    setInterval(checkResources, MONITOR_INTERVAL_MS);
}
async function checkResources() {
    const cpus = os.cpus().length;
    const load = os.loadavg()[0]; // 1 min avg
    const loadPerCore = load / cpus;
    // Log stats for debugging (optional, maybe verbose)
    // console.log(`[Monitoring] Load: ${load.toFixed(2)} / ${cpus} cores (${(loadPerCore*100).toFixed(0)}%)`);
    if (loadPerCore < CPU_THRESHOLD)
        return;
    console.warn(`[Monitoring] High CPU Load detected: ${load.toFixed(2)} (${(loadPerCore * 100).toFixed(0)}%)`);
    const instances = await (0, instances_service_1.getInstancesStatus)();
    const runningInstances = instances.filter(i => i.running);
    // If only one instance is running, maybe we shouldn't kill it? 
    // User said: "detener la instancia que no tenga usuarios activos"
    // Does not specify "if multiple running". Just "starts to saturate".
    for (const instance of runningInstances) {
        try {
            // Check players via RCON
            // Response format depends on version, usually "Players connected (0):"
            const response = await (0, rcon_service_1.runRconCommand)(instance.id, 'players');
            if (response.toLowerCase().includes('players connected (0)') || response.includes('Players connected (0)')) {
                console.log(`[Monitoring] Stopping idle instance ${instance.name} due to resource saturation.`);
                await (0, instances_service_1.updateInstance)(instance.id, { shutdownReason: 'Auto-Stop: Resource Saturation (High Load)' });
                await (0, instances_service_1.stopInstance)(instance.id);
                // Append to log
                const logMsg = `[${new Date().toISOString()}] AUTO-STOP: System Load ${load.toFixed(2)}. Instance ${instance.name} was idle (0 players).\n`;
                try {
                    if (instance.maintenanceLogPath)
                        await fs.appendFile(instance.maintenanceLogPath, logMsg);
                }
                catch (e) {
                    console.error('Failed to write log', e);
                }
            }
        }
        catch (error) {
            console.error(`[Monitoring] Failed to check/stop instance ${instance.name}:`, error);
        }
    }
}
