module.exports = {
  apps: [
    {
      name: "app-blud",

      cwd: "/home/hnf/app-blud",

      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3004",

      instances: 1,
      exec_mode: "fork",

      autorestart: true,
      watch: false,

      max_memory_restart: "500M",

      env: {
        NODE_ENV: "production",
        PORT: 3004,
      },

      error_file: "/home/hnf/.pm2/logs/app-blud-error.log",
      out_file: "/home/hnf/.pm2/logs/app-blud-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};