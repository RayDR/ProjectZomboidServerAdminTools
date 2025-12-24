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

/*!
 * MIT License
 *
 * Copyright (c) 2025 DomoForge (domoforge.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

import { Router } from 'express';
import { exec } from 'child_process';
import os from 'os';
import sqlite3 from 'sqlite3';
import { getInstancesStatus } from '../services/instances.service';

const router = Router();

const checkMemory = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total,
    free,
    used,
    usagePercent: parseFloat(((used / total) * 100).toFixed(2)),
  };
};

const checkDatabase = (): Promise<{ ok: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const db = new sqlite3.Database('./db/pzadmin.db', (err) => {
      if (err) return resolve({ ok: false, error: err.message });

      db.get('SELECT 1', [], (queryErr) => {
        db.close();
        if (queryErr) return resolve({ ok: false, error: queryErr.message });
        resolve({ ok: true });
      });
    });
  });
};

router.get('/', async (_req, res) => {
  const memory = checkMemory();
  const dbStatus = await checkDatabase();
  const instances = await getInstancesStatus();

  const runningCount = instances.filter(i => i.running).length;

  res.json({
    system: 'Online',
    instancesRunning: runningCount,
    totalInstances: instances.length,
    components: {
      memory,
      database: dbStatus,
    },
    checkedAt: new Date().toISOString(),
  });
});

export default router;
