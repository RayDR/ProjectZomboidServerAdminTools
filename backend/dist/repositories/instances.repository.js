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
exports.InstancesRepository = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const paths_1 = require("../config/paths");
const errors_1 = require("../utils/errors");
const instanceName_1 = require("../utils/instanceName");
class InstancesRepository {
    constructor(configPath = paths_1.DEFAULT_INSTANCES_CONFIG_PATH) {
        this.configPath = configPath;
    }
    async readAll() {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            const parsed = JSON.parse(data);
            // Validate schema on load and filter out invalid ones
            return parsed.instances.filter(this.validateSchema);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw new Error(`Failed to load instances configuration: ${error.message}`);
        }
    }
    async writeAll(instances) {
        this.preventDuplicates(instances);
        const config = { instances };
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    async findByName(name) {
        const instances = await this.readAll();
        return instances.find(i => i.name === name || i.id === name) || null;
    }
    async exists(name) {
        const instance = await this.findByName(name);
        return instance !== null;
    }
    validateSchema(instance) {
        try {
            if (!instance.name || !(0, instanceName_1.validateInstanceName)(instance.id))
                return false;
            (0, instanceName_1.assertValidServiceName)(instance.serviceName);
            if (typeof instance.gamePort !== 'number' || instance.gamePort <= 0 || instance.gamePort > 65535)
                return false;
            if (typeof instance.rconPort !== 'number' || instance.rconPort <= 0 || instance.rconPort > 65535)
                return false;
            // Ensure path is within PZ_INSTANCES_ROOT
            const resolvedPath = path.resolve(instance.pzDir);
            if (!resolvedPath.startsWith(paths_1.PZ_INSTANCES_ROOT))
                return false;
            return true;
        }
        catch (e) {
            return false; // Validation error means invalid schema
        }
    }
    preventDuplicates(instances) {
        const names = new Set();
        const serviceNames = new Set();
        for (const instance of instances) {
            if (names.has(instance.id))
                throw new errors_1.ValidationError(`Duplicate instance ID found: ${instance.id}`);
            if (serviceNames.has(instance.serviceName))
                throw new errors_1.ValidationError(`Duplicate serviceName found: ${instance.serviceName}`);
            names.add(instance.id);
            serviceNames.add(instance.serviceName);
        }
    }
}
exports.InstancesRepository = InstancesRepository;
