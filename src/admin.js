import { Kafka } from "kafkajs";
import { config } from "dotenv";
import { randomBytes } from "crypto";
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFileSync } from "fs";

config();

class Admin {
  constructor(client) {
    this.client = client;
    this.admin = client.admin();
  }

  async createTopics(topic, numPartitions = 1) {
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

  async deleteTopic(topic) {
    await this.admin.connect();
    await this.admin.deleteTopics({
      topics: [topic],
    });
    await this.admin.disconnect();

    return;
  }
}

async function run() {
  try {
    const kafka = new Kafka({
      clientId: randomBytes(4).toString("hex"),
      brokers: [process.env.KAFKA_BROKER],
      ssl: {
        rejectUnauthorized: true,
        cert: readFileSync(
          new URL("../kafka-keys/trustore.pem", import.meta.url)
        ),
        key: readFileSync(
          new URL("../kafka-keys/keystore.pem", import.meta.url)
        ),
      },
    });

    const admin = new Admin(kafka);
    await admin.listTopics();
  } catch (error) {
    console.log({ error });
  }
}

run();
