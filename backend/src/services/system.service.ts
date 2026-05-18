
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface SystemStats {
    cpu: number; // Percentage
    memory: {
        total: number;
        free: number;
        used: number;
        percent: number;
    };
    disk: {
        total: string;
        used: string;
        free: string;
        percent: number;
    };
    uptime: number; // Seconds
    load: number[];
}

export const getSystemStats = async (): Promise<SystemStats> => {
    // Memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    // CPU Load (approximate from loadavg)
    // On Linux, loadavg is 1, 5, 15 min averages.
    // To get instant CPU usage without a library involves reading /proc/stat twice, which is complex for a simple check.
    // We will use loadavg[0] normalized by CPU core count as a rough estimate.
    const cpus = os.cpus();
    const coreCount = cpus.length;
    const loadAvg = os.loadavg();
    const cpuPercent = Math.min(100, Math.round((loadAvg[0] / coreCount) * 100));

    // Disk Usage (Root partition)
    let disk = { total: '0', used: '0', free: '0', percent: 0 };
    try {
        const { stdout } = await execPromise('df -k / | tail -1');
        // Filesystem     1K-blocks     Used Available Use% Mounted on
        // /dev/sda1       10000000  5000000   5000000  50% /
        const parts = stdout.split(/\s+/).filter(p => p !== '');
        if (parts.length >= 5) {
            const total = parseInt(parts[1]) * 1024; // KB to Bytes
            const used = parseInt(parts[2]) * 1024;
            const free = parseInt(parts[3]) * 1024;
            const percent = parseInt(parts[4].replace('%', ''));

            disk = {
                total: (total / 1024 / 1024 / 1024).toFixed(1) + ' GB',
                used: (used / 1024 / 1024 / 1024).toFixed(1) + ' GB',
                free: (free / 1024 / 1024 / 1024).toFixed(1) + ' GB',
                percent
            };
        }
    } catch (e) {
        console.error('Failed to get disk stats', e);
    }

    return {
        cpu: cpuPercent,
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            percent: memPercent
        },
        disk,
        uptime: os.uptime(),
        load: loadAvg
    };
};
