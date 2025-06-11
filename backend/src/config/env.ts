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

import dotenv from 'dotenv';
dotenv.config();

/** Require a string environment variable */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/** Require a numeric environment variable */
function requireEnvNumber(key: string): number {
  const value = process.env[key];
  if (!value || isNaN(Number(value))) {
    throw new Error(`Missing or invalid numeric environment variable: ${key}`);
  }
  return Number(value);
}

export const config = {
  // Server Info
  port: requireEnv('PORT'),
  pzName: requireEnv('PZ_NAME'),
  pzService: requireEnv('PZ_SERVICE'),
  pzAdminUser: requireEnv('PZ_ADMIN_USER'),
  pzEnvScript: requireEnv('PZ_ENV_SCRIPT'),

  // File System Paths
  pzDir: requireEnv('PZ_DIR'),
  pzLogPath: requireEnv('PZ_LOG_PATH'),
  pzMaintenanceLogPath: requireEnv('PZ_MAINTENANCE_LOG_PATH'),
  pzIniPath: requireEnv('PZ_INI_PATH'),
  pzSavePath: requireEnv('PZ_SAVE_PATH'),
  pzSteamcmdPath: requireEnv('PZ_STEAMCMD_PATH'),

  // RCON Configuration
  pzRconPassword: requireEnv('PZ_RCON_PASSWORD'),
  pzRconPort: requireEnvNumber('PZ_RCON_PORT'),
  pzRconHost: requireEnv('PZ_RCON_HOST'),
};
