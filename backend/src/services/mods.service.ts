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

import * as fs from 'fs/promises';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/env';
import * as path from 'path';

const execPromise = promisify(exec);

interface Mod {
  id: string;
  name: string;
  workshopId?: string;
}

/**
 * Mods Service
 * Handles Workshop mods installation and management
 */

/**
 * Parse the server INI file to get installed mods
 */
export const getInstalledMods = async (): Promise<Mod[]> => {
  try {
    const iniContent = await fs.readFile(config.pzIniPath, 'utf-8');
    
    // Extract Mods= and WorkshopItems= lines
    const modsMatch = iniContent.match(/^Mods=(.*)$/m);
    const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
    
    if (!modsMatch) {
      return [];
    }
    
    const modIds = modsMatch[1].split(';').filter(id => id.trim());
    const workshopIds = workshopMatch ? workshopMatch[1].split(';').filter(id => id.trim()) : [];
    
    // Map mod IDs to workshop IDs
    const mods: Mod[] = modIds.map((id, index) => ({
      id: id.trim(),
      name: id.trim(), // We'll use the ID as name for now
      workshopId: workshopIds[index] || undefined
    }));
    
    return mods;
  } catch (error) {
    throw new Error(`Failed to read installed mods: ${error instanceof Error ? error.message : error}`);
  }
};

/**
 * Install a mod from Steam Workshop
 */
export const installMod = async (workshopId: string, modId: string): Promise<string> => {
  try {
    // Download mod via SteamCMD
    const downloadCommand = `${config.pzSteamcmdPath} +login anonymous +workshop_download_item 108600 ${workshopId} +quit`;
    
    await new Promise<void>((resolve, reject) => {
      const process = spawn('bash', ['-c', downloadCommand], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let error = '';
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to download mod: ${error}`));
        } else {
          resolve();
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
    
    // Update server INI file
    const iniContent = await fs.readFile(config.pzIniPath, 'utf-8');
    
    let updatedContent = iniContent;
    
    // Add to Mods= line
    const modsMatch = iniContent.match(/^Mods=(.*)$/m);
    if (modsMatch) {
      const currentMods = modsMatch[1];
      const newMods = currentMods ? `${currentMods};${modId}` : modId;
      updatedContent = updatedContent.replace(/^Mods=.*$/m, `Mods=${newMods}`);
    } else {
      updatedContent += `\nMods=${modId}`;
    }
    
    // Add to WorkshopItems= line
    const workshopMatch = iniContent.match(/^WorkshopItems=(.*)$/m);
    if (workshopMatch) {
      const currentItems = workshopMatch[1];
      const newItems = currentItems ? `${currentItems};${workshopId}` : workshopId;
      updatedContent = updatedContent.replace(/^WorkshopItems=.*$/m, `WorkshopItems=${newItems}`);
    } else {
      updatedContent += `\nWorkshopItems=${workshopId}`;
    }
    
    // Write updated INI
    await fs.writeFile(config.pzIniPath, updatedContent, 'utf-8');
    
    return `Mod ${modId} (${workshopId}) installed successfully`;
  } catch (error) {
    throw new Error(`Failed to install mod: ${error instanceof Error ? error.message : error}`);
  }
};

/**
 * Uninstall a mod
 */
export const uninstallMod = async (modId: string): Promise<string> => {
  try {
    const iniContent = await fs.readFile(config.pzIniPath, 'utf-8');
    
    // Remove from Mods= line
    const modsMatch = iniContent.match(/^Mods=(.*)$/m);
    if (modsMatch) {
      const mods = modsMatch[1].split(';').filter(id => id.trim() !== modId);
      const updatedContent = iniContent.replace(
        /^Mods=.*$/m,
        `Mods=${mods.join(';')}`
      );
      
      await fs.writeFile(config.pzIniPath, updatedContent, 'utf-8');
      
      return `Mod ${modId} uninstalled successfully`;
    }
    
    throw new Error('Mod not found in configuration');
  } catch (error) {
    throw new Error(`Failed to uninstall mod: ${error instanceof Error ? error.message : error}`);
  }
};

/**
 * Update all mods
 */
export const updateAllMods = async (): Promise<string> => {
  try {
    const mods = await getInstalledMods();
    const workshopIds = mods
      .map(m => m.workshopId)
      .filter((id): id is string => id !== undefined);
    
    if (workshopIds.length === 0) {
      return 'No workshop mods to update';
    }
    
    // Update all workshop items
    const workshopCommands = workshopIds
      .map(id => `+workshop_download_item 108600 ${id}`)
      .join(' ');
    
    const updateCommand = `${config.pzSteamcmdPath} +login anonymous ${workshopCommands} +quit`;
    
    await new Promise<void>((resolve, reject) => {
      const process = spawn('bash', ['-c', updateCommand], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let error = '';
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to update mods: ${error}`));
        } else {
          resolve();
        }
      });
      
      process.on('error', (err) => {
        reject(err);
      });
    });
    
    return `Updated ${workshopIds.length} mods successfully`;
  } catch (error) {
    throw new Error(`Failed to update mods: ${error instanceof Error ? error.message : error}`);
  }
};

/**
 * Validate mod files
 */
export const validateMods = async (): Promise<{
  valid: number;
  invalid: string[];
}> => {
  try {
    const mods = await getInstalledMods();
    const workshopPath = path.join(config.pzSteamcmdPath, '..', 'steamapps', 'workshop', 'content', '108600');
    
    const invalid: string[] = [];
    let valid = 0;
    
    for (const mod of mods) {
      if (mod.workshopId) {
        const modPath = path.join(workshopPath, mod.workshopId);
        try {
          await fs.access(modPath);
          valid++;
        } catch {
          invalid.push(mod.id);
        }
      }
    }
    
    return { valid, invalid };
  } catch (error) {
    throw new Error(`Failed to validate mods: ${error instanceof Error ? error.message : error}`);
  }
};
