module.exports = {
  apps: [
    {
      name: 'petshop-api',
      cwd: './api',
      script: 'uvicorn',
      args: 'src.main:app --host 0.0.0.0 --port 8000 --reload',
      interpreter: 'python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PYTHONPATH: './api',
      },
      env_production: {
        NODE_ENV: 'production',
        args: 'src.main:app --host 0.0.0.0 --port 8000 --workers 4',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'petshop-web',
      cwd: './web',
      script: 'npm',
      args: 'run dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        args: 'run start',
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],

  // Configuração de deploy (opcional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'seu-servidor.com',
      ref: 'origin/main',
      repo: 'https://github.com/DarlanCavalcante/petshop.git',
      path: '/var/www/petshop',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};
