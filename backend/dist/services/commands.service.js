"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = void 0;
const child_process_1 = require("child_process");
const env_1 = require("../config/env");
/**
 * Run a specific shell command based on the action name.
 */
const runCommand = (action) => {
    const commands = {
        restart: `systemctl restart ${env_1.config.pzService}`,
        status: `systemctl status ${env_1.config.pzService}`,
        start: `systemctl start ${env_1.config.pzService}`,
        stop: `systemctl stop ${env_1.config.pzService}`,
        update: `${env_1.config.pzSteamcmdPath} +login anonymous +force_install_dir ${env_1.config.pzDir} +app_update 380870 validate +quit`,
        backup: `/opt/pzserver/scripts/backup.sh`,
    };
    const cmd = commands[action];
    if (!cmd) {
        return Promise.reject(new Error(`Unsupported action: ${action}`));
    }
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
            if (err)
                return reject(stderr || err.message);
            resolve(stdout.trim());
        });
    });
};
exports.runCommand = runCommand;
