import { createApp } from "./app";
import { connectMongo } from "./db/mongoose";
import { env } from "./config/env";

async function main() {
  await connectMongo();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[backend] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

