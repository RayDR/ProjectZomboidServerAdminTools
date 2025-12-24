module.exports = {
  apps: [
    {
      name: 'pzwebadmin-backend',
      cwd: '/opt/pzwebadmin/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/opt/pzwebadmin/backend/logs/pm2-error.log',
      out_file: '/opt/pzwebadmin/backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'pzwebadmin-frontend',
      cwd: '/opt/pzwebadmin/frontend',
      script: 'npx',
      args: 'serve -s dist -l 3000',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/opt/pzwebadmin/frontend/logs/pm2-error.log',
      out_file: '/opt/pzwebadmin/frontend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '300M',
    },
  ],
};
