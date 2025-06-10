#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const configPath = process.argv[2] || './config.template.json';
if (!fs.existsSync(configPath)) {
  console.error(`❌ [ERROR] - Config file not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const backendEnv = `PZ_DIR=${config.pz_dir}
PZ_NAME=${config.pz_name}
PZ_ADMIN_USER=${config.pz_admin_user}
PZ_SERVICE=${config.pz_service}
PZ_LOG_PATH=${config.pz_log_path}
PZ_MAINTENANCE_LOG_PATH=${config.pz_maintenance_log_path}
PZ_INI_PATH=${config.pz_ini_path}
PZ_SAVE_PATH=${config.pz_save_path}
PZ_STEAMCMD_PATH=${config.pz_steamcmd_path}
PZ_RCON_PASSWORD=${config.pz_rcon_password}
PZ_RCON_PORT=${config.pz_rcon_port}
PZ_RCON_HOST=${config.pz_rcon_host}
`;

const frontendEnv = `NEXT_PUBLIC_API_URL=${config.backend_url}
NEXT_PUBLIC_SERVER_NAME=${config.pz_name}
NEXT_PUBLIC_PZ_LOG_PATH=${config.pz_log_path}
NEXT_PUBLIC_PZ_NAME=${config.pz_name}
NEXT_PUBLIC_WEBADMIN_URL=${config.frontend_url}
`;

fs.mkdirSync('../backend', { recursive: true });
fs.mkdirSync('../frontend', { recursive: true });
fs.writeFileSync('../backend/.env', backendEnv);
fs.writeFileSync('../frontend/.env.local', frontendEnv);

console.log('✅ [OK] - Environment Setup Completed');
