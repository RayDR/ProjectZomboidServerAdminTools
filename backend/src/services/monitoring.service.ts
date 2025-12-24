/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */

import * as os from 'os';
import { getInstancesStatus, stopInstance, updateInstance } from './instances.service';
import { runRconCommand } from './rcon.service';
import * as fs from 'fs/promises';

const MONITOR_INTERVAL_MS = 60 * 1000; // 1 minute
const CPU_THRESHOLD = 0.9; // 90% load per core

export function startMonitoring() {
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

    if (loadPerCore < CPU_THRESHOLD) return;

    console.warn(`[Monitoring] High CPU Load detected: ${load.toFixed(2)} (${(loadPerCore * 100).toFixed(0)}%)`);

    const instances = await getInstancesStatus();
    const runningInstances = instances.filter(i => i.running);

    // If only one instance is running, maybe we shouldn't kill it? 
    // User said: "detener la instancia que no tenga usuarios activos"
    // Does not specify "if multiple running". Just "starts to saturate".

    for (const instance of runningInstances) {
        try {
            // Check players via RCON
            // Response format depends on version, usually "Players connected (0):"
            const response = await runRconCommand(instance.id, 'players');

            if (response.toLowerCase().includes('players connected (0)') || response.includes('Players connected (0)')) {
                console.log(`[Monitoring] Stopping idle instance ${instance.name} due to resource saturation.`);

                await updateInstance(instance.id, { shutdownReason: 'Auto-Stop: Resource Saturation (High Load)' });
                await stopInstance(instance.id);

                // Append to log
                const logMsg = `[${new Date().toISOString()}] AUTO-STOP: System Load ${load.toFixed(2)}. Instance ${instance.name} was idle (0 players).\n`;
                try {
                    if (instance.maintenanceLogPath) await fs.appendFile(instance.maintenanceLogPath, logMsg);
                } catch (e) {
                    console.error('Failed to write log', e);
                }
            }
        } catch (error) {
            console.error(`[Monitoring] Failed to check/stop instance ${instance.name}:`, error);
        }
    }
}
