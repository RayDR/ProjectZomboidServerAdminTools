"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INSTANCES_CONFIG_PATH = exports.SYSTEMD_TEMPLATE_PREFIX = exports.SYSTEMD_UNIT_PREFIX = exports.STEAMCMD_PATH = exports.PZ_INSTANCES_ROOT = exports.PZWEBADMIN_ROOT = void 0;
const path_1 = __importDefault(require("path"));
exports.PZWEBADMIN_ROOT = '/opt/pzwebadmin';
exports.PZ_INSTANCES_ROOT = '/opt';
exports.STEAMCMD_PATH = '/steamcmd/steamcmd.sh';
exports.SYSTEMD_UNIT_PREFIX = 'pzomboid-';
exports.SYSTEMD_TEMPLATE_PREFIX = 'pzomboid@';
exports.DEFAULT_INSTANCES_CONFIG_PATH = path_1.default.join(exports.PZWEBADMIN_ROOT, 'backend/src/config/instances.json');
