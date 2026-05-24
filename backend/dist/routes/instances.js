"use strict";
/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const instancesController = __importStar(require("../controllers/instances.controller"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: path_1.default.join(__dirname, '../../uploads') });
// Tasks monitoring
router.get('/tasks', auth_1.auth, (req, res) => { void instancesController.getTasksController(req, res); });
router.get('/tasks/:taskId', auth_1.auth, (req, res) => { void instancesController.getTaskController(req, res); });
// Crear instancia desde versión seleccionada
router.post('/from-version', auth_1.auth, (req, res) => { void instancesController.createInstanceFromVersionController(req, res); });
// List available PZ server versions
router.get('/versions', auth_1.auth, (req, res) => { void instancesController.getAvailableVersionsController(req, res); });
// Instances management
router.get('/', auth_1.auth, (req, res) => { void instancesController.getInstancesController(req, res); });
router.post('/', auth_1.auth, (req, res) => { void instancesController.addInstanceController(req, res); });
router.post('/:instanceId/start', auth_1.auth, (req, res) => { void instancesController.startInstanceController(req, res); });
router.post('/:instanceId/retry-install', auth_1.auth, (req, res) => { void instancesController.retryInstanceInstallController(req, res); });
router.post('/:instanceId/stop', auth_1.auth, (req, res) => { void instancesController.stopInstanceController(req, res); });
router.post('/:instanceId/restart', auth_1.auth, (req, res) => { void instancesController.restartInstanceController(req, res); });
router.post('/:instanceId/kill', auth_1.auth, (req, res) => { void instancesController.forceStopInstanceController(req, res); });
router.patch('/:instanceId', auth_1.auth, (req, res) => { void instancesController.updateInstanceController(req, res); });
router.delete('/:instanceId', auth_1.auth, (req, res) => { void instancesController.deleteInstanceController(req, res); });
// Mods Management
router.get('/:instanceId/mods', auth_1.auth, (req, res) => { void instancesController.getModsController(req, res); });
router.post('/:instanceId/mods', auth_1.auth, (req, res) => { void instancesController.addModController(req, res); });
router.post('/:instanceId/mods/upload', auth_1.auth, upload.single('file'), (req, res) => { void instancesController.uploadModController(req, res); });
router.delete('/:instanceId/mods/:modId', auth_1.auth, (req, res) => { void instancesController.removeModController(req, res); });
exports.default = router;
