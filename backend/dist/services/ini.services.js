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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeIniFile = exports.readIniFile = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const env_1 = require("../config/env");
const iniFilePath = env_1.config.pzIniPath; // Already includes full path with filename
const readIniFile = async () => {
    return await promises_1.default.readFile(iniFilePath, 'utf-8');
};
exports.readIniFile = readIniFile;
const writeIniFile = async (content) => {
    await promises_1.default.writeFile(iniFilePath, content, 'utf-8');
};
exports.writeIniFile = writeIniFile;
