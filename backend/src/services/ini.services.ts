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

import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/env';

const iniFilePath = path.join(config.pzIniPath, `${config.pzName}.ini`);

export const readIniFile = async (): Promise<string> => {
  return await fs.readFile(iniFilePath, 'utf-8');
};

export const writeIniFile = async (content: string): Promise<void> => {
  await fs.writeFile(iniFilePath, content, 'utf-8');
};
