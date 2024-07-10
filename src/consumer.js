import { Kafka } from "kafkajs";
import { config } from "dotenv";

config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_CONSUMER,
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID,
});

await consumer.connect();

await consumer.subscribe({
  topics: [process.env.KAFKA_TOPIC],
  fromBeginning: true,
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      key: message.key.toString(),
      value: JSON.parse(message.value.toString()),
      headers: message.headers,
    });
  },
});

// * To ensure that the consumer listens from the beginning of the topic
consumer.seek({ topic: process.env.KAFKA_TOPIC, partition: 0, offset: 0 });
