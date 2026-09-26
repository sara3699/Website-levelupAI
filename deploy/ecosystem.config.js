// PM2 process definition for the levelup-ai site.
//
// Runs on port 3001: the platfomelevelup project already holds 3000 under
// levelupia.app, so the two apps run side by side on one server.
//
//   pm2 start deploy/ecosystem.config.js
//   pm2 save
module.exports = {
  apps: [
    {
      name: "levelup-ai",
      cwd: "/root/app/web/levelup-ai",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "600M",
    },
  ],
};
