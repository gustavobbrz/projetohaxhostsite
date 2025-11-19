/**
 * Template do PM2 Ecosystem Config
 *
 * Placeholders que serão substituídos pelo backend:
 * - <SERVER_ID>
 * - <TOKEN>
 * - <ROOM_NAME>
 * - <MAP>
 * - <MAX_PLAYERS>
 * - <PASSWORD>
 * - <IS_PUBLIC>
 * - <ADMINS_JSON>
 * - <HAXHOST_API_URL>
 * - <HAXHOST_WEBHOOK_SECRET>
 * - <PM2_PROCESS_NAME>
 */

module.exports = {
  apps: [
    {
      name: "<PM2_PROCESS_NAME>",
      script: "./index.js",
      cwd: "/home/ubuntu/haxball-servers/<SERVER_ID>",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",

        // Haxball Config
        TOKEN: "<TOKEN>",
        ROOM_NAME: "<ROOM_NAME>",
        MAP: "<MAP>",
        MAX_PLAYERS: "<MAX_PLAYERS>",
        PASSWORD: "<PASSWORD>",
        IS_PUBLIC: "<IS_PUBLIC>",

        // Admin Config (JSON string com hashes)
        ADMINS_JSON: "<ADMINS_JSON>",

        // HaxHost Integration
        HAXHOST_API_URL: "<HAXHOST_API_URL>",
        HAXHOST_WEBHOOK_SECRET: "<HAXHOST_WEBHOOK_SECRET>",
        PM2_PROCESS_NAME: "<PM2_PROCESS_NAME>",
        SERVER_ID: "<SERVER_ID>",
      },
      error_file: "/home/ubuntu/haxball-servers/<SERVER_ID>/logs/error.log",
      out_file: "/home/ubuntu/haxball-servers/<SERVER_ID>/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
