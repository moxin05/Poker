import http from "http";
import { createApp } from "./app";
import { connectMongo } from "./db/mongoose";
import { env } from "./config/env";
import { setupSocket } from "./socket";

async function main() {
  await connectMongo();

  const app = createApp();
  const server = http.createServer(app);

  // WebSocket
  setupSocket(server);

  server.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
