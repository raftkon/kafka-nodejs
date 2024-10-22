import { Kafka } from "kafkajs";
import { config } from "dotenv";
import { randomBytes } from "crypto";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

config();

class Admin {
  constructor(client) {
    this.client = client;
    this.admin = client.admin();
  }

  async createTopics(topic, numPartitions) {
    await this.admin.connect();
    await this.admin.createTopics({
      topics: [
        {
          topic,
          numPartitions,
        },
      ],
    });
    await this.admin.disconnect();
  }

  async listTopics() {
    await this.admin.connect();

    const topics = await this.admin.listTopics();
    console.log({ topics });
    await this.admin.disconnect();
    return topics;
  }

  async fetchTopicMetadata(topic) {
    await this.admin.connect();

    const metadata = await this.admin.fetchTopicMetadata([topic]);

    const [filteredTopic] = metadata["topics"].filter(
      (el) => el.name === topic
    );
    console.log(filteredTopic?.partitions || "no such topic");

    await this.admin.disconnect();

    return filteredTopic;
  }
}

async function run() {
  try {
    const kafka = new Kafka({
      clientId: randomBytes(4).toString("hex"),
      // clientId: process.env.KAFKA_CLIENT_ID_CONSUMER,
      brokers: [process.env.KAFKA_BROKER],
    });

    const admin = new Admin(kafka);

    const rl = readline.createInterface({
      input: stdin,
      output: stdout,
    });

    console.log(
      "\nPress 1 to create topic.\nPress 2 to list topics.\nPress 3 or 'exit' to terminate process\nEnter topic name to fetch metadata."
    );

    rl.on("line", async (input) => {
      input = input.trim(); // Remove any leading/trailing whitespace
      switch (input) {
        case "1":
          let topic = await rl.question("Name of topic: ");
          let numPartitions = await rl.question("Number of partitions: ");
          await admin.createTopics(topic, numPartitions);
          break;
        case "2":
          await admin.listTopics();
          break;
        case "3":
        case "exit":
          rl.close();
          return;
        default:
          await admin.fetchTopicMetadata(input);
          break;
      }
      console.log(
        "\nPress 1 to create topic.\nPress 2 to list topics.\nPress 3 or 'exit' to terminate process\nEnter topic name to fetch metadata."
      );
    });

    rl.on("close", () => {
      console.log("The process 'closed' gracefully.");
      process.exit(0);
    });
    rl.on("SIGINT", () => {
      console.log("Exiting...");
      process.exit(0);
    });
  } catch (error) {
    console.log({ error });
  }
}

run();
