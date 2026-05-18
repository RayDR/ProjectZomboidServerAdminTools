"use strict";
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
exports.getSystemStats = void 0;
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const getSystemStats = async () => {
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
    }
    catch (e) {
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
exports.getSystemStats = getSystemStats;
