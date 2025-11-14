import { createClient } from "redis";

async function main() {
  const engine = new Engine();
  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");
  while (1) {
    const response = await redisClient.rPop("messages" as string);
    if (response) {
      engine.processMessage(JSON.parse(response));
    }
  }
}

main();
