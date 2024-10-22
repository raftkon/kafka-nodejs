# Kafka-NodeJS

Basic setup of Kafka with Zookeeper and NodeJS consumer, producer and admin utilizing the kafkajs package. The project implements **TLS communication**, in order to communicate via PLAINTEXT if there is no SSL configuration on your Kafka Broker just **remove the ssl field from new Kafka() class in Producer, Consumer and Admin**.

In the `.env` file specify:

- BROKER
- TOPIC
- CLIENT_ID for consumer and producer

## About docker-compose.yaml

To start the Kafka & Zookeeper containers run the dev.sh script.
It will prompt you to enter a choice:

- `make`: build the project
- `kill`: stop the project
- `logs`: see the logs of the containers

## Kafka-Consumer

After initiating Kafka with docker-compose then run the command:

```bash
npm run consume
```

## Kafka-Producer

After initiating Kafka with docker-compose then run the command:

```bash
npm run produce
```

## Kafka-Admin

After initiating Kafka with docker-compose then run the command:

```bash
npm run admin
```

Admin works as a control in order to list and create a topic.
