# Kafka-NodeJS

Basic setup of Kafka with Zookeeper and NodeJS consumer and producer utilizing the kafkajs package.

## About docker-compose.yaml

Run docker compose -p kafka-test up

```bash
docker compose -p kafka-test up -d
```

To terminate the up Ctrl+C and then run:

```bash
docker compose -p kafka-test down -v
```

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
