/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */

import * as os from 'os';
import { instanceManager } from '../managers/instance.manager';
import { runRconCommand } from './rcon.service';
import * as fs from 'fs/promises';

const MONITOR_INTERVAL_MS = 60 * 1000; // 1 minute
const CPU_THRESHOLD = 0.9; // 90% load per core

export function startMonitoring() {
    setTimeout(checkResources, 10000);
    setInterval(checkResources, MONITOR_INTERVAL_MS);
}

async function checkResources() {
    const cpus = os.cpus().length;
    const load = os.loadavg()[0];
    const loadPerCore = load / cpus;

    if (loadPerCore < CPU_THRESHOLD) return;

    console.warn(`[Monitoring] High CPU Load detected: ${load.toFixed(2)} (${(loadPerCore * 100).toFixed(0)}%)`);

    const instances = await instanceManager.listInstances();
    const runningInstances = instances.filter((i: any) => i.running);

    for (const instance of runningInstances) {
        try {
            const response = await runRconCommand(instance.id, 'players');

            if (response.toLowerCase().includes('players connected (0)') || response.includes('Players connected (0)')) {
                await instanceManager.updateInstance(instance.id, { shutdownReason: 'Auto-Stop: Resource Saturation (High Load)' });
                await instanceManager.performSystemdAction(instance.id, 'stop');

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
