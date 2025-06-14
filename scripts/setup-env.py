#!/usr/bin/env python3
import json
import sys
from pathlib import Path

script_dir = Path(__file__).resolve().parent
config_file = Path(sys.argv[1]) if len(sys.argv) > 1 else script_dir / "config.template.json"

if not config_file.exists():
    print(f"❌ [ERROR] - Config file not found: {config_file}")
    sys.exit(1)

with open(config_file) as f:
    config = json.load(f)

backend_env = (script_dir / "../backend/.env").resolve()
frontend_env = (script_dir / "../frontend/.env.local").resolve()
backend_env.parent.mkdir(parents=True, exist_ok=True)
frontend_env.parent.mkdir(parents=True, exist_ok=True)

backend_env.write_text(f"""PORT={config['backend_port']}
PZ_NAME={config['pz_name']}
PZ_DIR={config['pz_dir']}
PZ_ADMIN_USER={config['pz_admin_user']}
PZ_SERVICE={config['pz_service']}
PZ_ENV_SCRIPT={config['pz_env']}
PZ_LOG_PATH={config['pz_log_path']}
PZ_MAINTENANCE_LOG_PATH={config['pz_maintenance_log_path']}
PZ_INI_PATH={config['pz_ini_path']}
PZ_SAVE_PATH={config['pz_save_path']}
PZ_STEAMCMD_PATH={config['pz_steamcmd_path']}
PZ_RCON_PASSWORD={config['pz_rcon_password']}
PZ_RCON_PORT={config['pz_rcon_port']}
PZ_RCON_HOST={config['pz_rcon_host']}
""")
frontend_env.write_text(f"""NEXT_PUBLIC_FE_PORT={config['frontend_port']}
NEXT_PUBLIC_API_URL={config['backend_url']}
NEXT_PUBLIC_SERVER_NAME={config['pz_name']}
NEXT_PUBLIC_PZ_LOG_PATH={config['pz_log_path']}
NEXT_PUBLIC_PZ_NAME={config['pz_name']}
NEXT_PUBLIC_WEBADMIN_URL={config['frontend_url']}
""")
print("✅ [OK] - Environment Setup Completed")
