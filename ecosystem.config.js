module.exports = {
  apps: [
    {
      name: "smart-pos",

      cwd: "/home/hnf/smart-pos",

      script: "npm",
      args: "start",

      instances: 1,
      exec_mode: "fork",

      autorestart: true,
      watch: false,

      max_memory_restart: "500M",

      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },

      error_file: "/home/hnf/.pm2/logs/smart-pos-error.log",
      out_file: "/home/hnf/.pm2/logs/smart-pos-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};