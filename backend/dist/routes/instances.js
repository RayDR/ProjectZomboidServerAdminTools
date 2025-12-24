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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const instancesController = __importStar(require("../controllers/instances.controller"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @route GET /api/instances
 * @desc Get all server instances with their status
 * @access Private
 */
router.get('/', auth_1.auth, instancesController.getInstancesController);
/**
 * @route POST /api/instances
 * @desc Add a new instance
 * @access Private
 */
router.post('/', auth_1.auth, instancesController.addInstanceController);
/**
 * @route POST /api/instances/:instanceId/start
 * @desc Start an instance
 * @access Private
 */
router.post('/:instanceId/start', auth_1.auth, instancesController.startInstanceController);
/**
 * @route POST /api/instances/:instanceId/stop
 * @desc Stop an instance
 * @access Private
 */
router.post('/:instanceId/stop', auth_1.auth, instancesController.stopInstanceController);
/**
 * @route POST /api/instances/:instanceId/restart
 * @desc Restart an instance
 * @access Private
 */
router.post('/:instanceId/restart', auth_1.auth, instancesController.restartInstanceController);
/**
 * @route POST /api/instances/:instanceId/kill
 * @desc Force stop an instance
 * @access Private
 */
router.post('/:instanceId/kill', auth_1.auth, instancesController.forceStopInstanceController);
/**
 * @route PATCH /api/instances/:instanceId
 * @desc Update instance configuration
 * @access Private
 */
router.patch('/:instanceId', auth_1.auth, instancesController.updateInstanceController);
exports.default = router;
