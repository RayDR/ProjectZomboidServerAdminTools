// backend/scripts/add-license.ts

import fs from 'fs';
import path from 'path';

const licenseBlock = `/**
 * @license MIT
 * © ${new Date().getFullYear()} DomoForge (https://domoforge.com)
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
`;

const srcDir = path.resolve(__dirname, '../src');

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('@license MIT')) return;

  const updated = `${licenseBlock}\n\n${content}`;
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`✅ Licencia agregada: ${filePath}`);
}

function walk(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (file.endsWith('.ts')) {
      processFile(full);
    }
  }
}

walk(srcDir);
console.log('✅ Added License to src/');
