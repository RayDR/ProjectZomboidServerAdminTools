/**
 * @license MIT
 * © 2025 DomoForge (https://domoforge.com)
 */

import { promises as fs } from 'fs';
import path from 'path';

const SERVER_INI_PATH = '/home/steam/Zomboid/Server/servertest.ini';

export const getServerName = async (): Promise<string> => {
  try {
    const content = await fs.readFile(SERVER_INI_PATH, 'utf-8');
    const lines = content.split('\n');
    
    // Find PublicName or ServerName
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('PublicName=')) {
        return trimmed.split('=')[1].trim();
      }
      if (trimmed.startsWith('ServerName=')) {
        return trimmed.split('=')[1].trim();
      }
    }
    
    return 'Project Zomboid Server';
  } catch (error) {
    console.error('Error reading server name from INI:', error);
    return 'Project Zomboid Server';
  }
};

export const getServerConfig = async () => {
  try {
    const serverName = await getServerName();
    return {
      success: true,
      data: {
        serverName,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get server config',
    };
  }
};
