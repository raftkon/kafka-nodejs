import { Kafka, CompressionTypes } from "kafkajs";
import { config } from "dotenv";
import { randomNumber } from "../lib/helperFunctions.js";
import { readFileSync } from "fs";

config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_PRODUCER,
  brokers: [process.env.KAFKA_BROKER],
  ssl: {
    rejectUnauthorized: true,
    cert: readFileSync(
      new URL("../certs/symbiotik/kafka-truststore.pem", import.meta.url)
    ),
    key: readFileSync(
      new URL("../certs/symbiotik/kafka-keystore.pem", import.meta.url)
    ),
  },
});

console.log({ broker: process.env.KAFKA_BROKER });

const MyPartitioner = () => {
  return ({ topic, partitionMetadata, message }) => {
    return randomNumber(2);
  };
};

const producer = kafka.producer({
  // createPartitioner: MyPartitioner,
});

async function run() {
  process.stdin.setEncoding("utf8");

  try {
    await producer.connect();
    process.stdout.write('Enter something (press "exit" to quit): ');
    process.stdin.on("data", async function (input) {
      input = input.trim(); // Remove any leading/trailing whitespace

      if (input.toLowerCase() === "exit") {
        process.stdout.write("Exiting...\n");
        process.exit(); // Exit the program
      }

      let data = {
        input,
      };

      await producer.send({
        topic: process.env.KAFKA_TOPIC,
        compression: CompressionTypes.GZIP,
        messages: [{ key: "userAccount", value: JSON.stringify(data) }],
      });
      process.stdout.write('Enter something (press "exit" to quit): ');
    });

    process.stdin.on("end", function () {
      process.stdout.write("End of input\n");
    });
  } catch (error) {
    console.log(error);
  }
}

run().catch((e) => console.error(`[example/producer] ${e.message}`, e));

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

errorTypes.map((type) => {
  process.on(type, async () => {
    try {
      console.log(`process.on ${type}`);
      await producer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.map((type) => {
  process.once(type, async () => {
    try {
      await producer.disconnect();
    } finally {
      console.log("Disconnected");
      process.exit(0);
    }
  });
});
