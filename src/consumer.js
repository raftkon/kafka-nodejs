import { Kafka, logLevel } from "kafkajs";
import { config } from "dotenv";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";

config();

const kafka = new Kafka({
  logLevel: logLevel.INFO,
  // clientId: process.env.KAFKA_CLIENT_ID_CONSUMER,
  clientId: randomBytes(4).toString("hex"),
  brokers: [process.env.KAFKA_BROKER],
  ssl: {
    ca: readFileSync(
      new URL(
        "../secrets/kafka-keys/symbiotik_2025-06-11/rootCA.pem",
        import.meta.url
      )
    ),
    rejectUnauthorized: true,
    // cert: readFileSync(new URL("../kafka-keys/trustore.pem", import.meta.url)),
    // key: readFileSync(new URL("../kafka-keys/keystore.pem", import.meta.url)),
    cert: readFileSync(
      new URL(
        "../secrets/kafka-keys/symbiotik_2025-06-11/trustore.pem",
        import.meta.url
      )
    ),
    key: readFileSync(
      new URL(
        "../secrets/kafka-keys/symbiotik_2025-06-11/keystore.pem",
        import.meta.url
      )
    ),
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300, // backoff starts at 300ms
    retries: 10, // up to 10 retries
    maxRetryTime: 60000, // stop after 60s of trying
    factor: 0.2,
    multiplier: 2,
  },
});

// ! Consumers subscribed to the same topic must have DIFFERENT GROUP_ID
const consumer = kafka.consumer({
  groupId: randomBytes(4).toString("hex"),
});

async function run() {
  await consumer.connect();

  await consumer.subscribe({
    topics: [
      "mouse-tracking",
      "question-read",
      "answer-created",
      "action_rl",
      "my-topic",
    ],
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        key: message.key?.toString(),
        //        value: JSON.parse(message.value.toString()),
        value: message.value.toString(),
        partition,
        offset: message.offset,
        partition,
        topic,
      });
    },
  });

  // * To ensure that the consumer listens from the beginning of the topic
  // consumer.seek({ topic: process.env.KAFKA_TOPIC, partition: 0, offset: 0 });
}

run().catch((e) => console.error(`[example/consumer] ${e.message}`, e));

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.map((type) => {
  process.on(type, async (e) => {
    try {
      console.log(`process.on ${type}`);
      console.error(e);
      await consumer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach((type) => {
  process.on(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      console.log("Disconnected");
      process.exit(0);
    }
  });
});
