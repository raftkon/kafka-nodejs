import { Kafka } from "kafkajs";
import { config } from "dotenv";

config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_PRODUCER,
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

async function getInputAndSendMessage() {
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

getInputAndSendMessage();

await producer.disconnect();
