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

## Create Keystore & Trustore for TLS Communication

### Step 1: Create PKCS12 Keystore from Let’s Encrypt certificate

```bash
openssl pkcs12 -export \
  -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem \
  -inkey /etc/letsencrypt/live/yourdomain.com/privkey.pem \
  -out kafka-keystore.p12 \
  -name kafka \
  -password pass:pass123
```

### Step 2: Create PKCS12 Trustore from Let’s Encrypt certificate

````bash
keytool -keystore kafka-truststore.p12 \
    -alias kafka \
    -import \
    -file /etc/letsencrypt/live/yourdomain.com/fullchain.pem \
    -storepass pass123 \
    -noprompt \
    -storetype PKCS12
    ```
````

### Step 3: Configure docker-compose.yml file

```yaml
services:
  zookeeper:
    image: zookeeper:3.9
    # image: wurstmeister/zookeeper:latest
    container_name: zookeeper
    restart: always
    volumes:
      - zookeeper_data:/data
      - zookeeper_logs:/logs
    expose:
      - "2181"
    networks:
      - docker-network

  kafka:
    image: wurstmeister/kafka:2.13-2.8.1
    container_name: broker
    restart: always
    volumes:
      - kafka_data:/kafka
      - ./certs:/etc/kafka/secrets
    expose:
      - "9092"
    ports:
      - "9093:9093"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: "zookeeper:2181" # Connect to the Zookeeper service
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_DELETE_TOPIC_ENABLE: "true"
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_LISTENERS: INSIDE://0.0.0.0:9092,OUTSIDE://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: INSIDE://broker:9092,OUTSIDE://zamanfu.fun:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: INSIDE:PLAINTEXT,OUTSIDE:SSL
      KAFKA_INTER_BROKER_LISTENER_NAME: INSIDE
      KAFKA_SSL_KEYSTORE_LOCATION: "/etc/kafka/secrets/kafka-keystore.p12"
      KAFKA_SSL_KEYSTORE_PASSWORD: "pass123"
      KAFKA_SSL_KEY_PASSWORD: "pass123"
      KAFKA_SSL_TRUSTSTORE_LOCATION: "/etc/kafka/secrets/kafka-trustore.p12"
      KAFKA_SSL_TRUSTSTORE_PASSWORD: "pass123"
      KAFKA_SSL_ENABLED_PROTOCOLS: TLSv1.2,TLSv1.1,TLSv1
    networks:
      - docker-network
    depends_on:
      - zookeeper # Ensure Zookeeper starts before Kafka
networks:
  symbiotik-network:
    name: docker-network
volumes:
  kafka_data:
  zookeeper_data:
  zookeeper_logs:
```

### Step 4: Copy your Trustore and Keystore to your client

```bash
scp -i <specify-your-ssh-key> <user>@<server-ip>:/path/to/kafka-trustore.p12 /path/to/your/local/project/certs
scp -i <specify-your-ssh-key> <user>@<server-ip>:/path/to/kafka-keystore.p12 /path/to/your/local/project/certs
```

### Step 5: Convert your PKCS12 files to PEM files

Trustore:

```bash
openssl pkcs12 -in kafka-trustore.p12 -out kafka-trustore.pem -nokeys
```

Keystore:

```bash
openssl pkcs12 -in kafka-keystore.p12 -out kafka-keystore.pem -nodes -nocerts
```

### Step 6: Configure KafkaJS Client (same for consumer, producer and admin)

```javascript
const kafka = new Kafka({
  logLevel: logLevel.INFO,
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
```

### If you are using Python instead of NodeJS

The same configuration for Kafka Broker but instead of **Step 6** follow the configuration below.

In case you want to communicate via **PLAINTEXT** instead of **TLS** just remove:

- import ssl
- context (and relative lines)
- fields _security_protocol_ and _ssl_context_ from KafkaProducer and KafkaConsumer

from the code below.

```bash
python -m venv env
source env/Scripts/activate
pip install kafka-python
```

#### Producer

```python
from kafka import KafkaProducer
import json
import ssl

context = ssl.create_default_context()

context.load_cert_chain(certfile="certs/symbiotik/kafka-truststore.pem",keyfile="certs/symbiotik/kafka-keystore.pem")

TOPIC = "my-topic"
BROKER = "symbiotik.aegisresearch.eu:9093"
KEY = b"python-producer"

producer = KafkaProducer(
    bootstrap_servers=[BROKER],  # Adjust to your broker's SSL port
    security_protocol='SSL',
    ssl_context=context,
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    acks='all'
)

# Send messages securely
for i in range(10):
    message = {'number': i}
    future = producer.send(TOPIC, value=message,key=KEY)
    result = future.get(timeout=10)  # Wait for confirmation of message delivery

producer.flush()  # Ensure all messages are sent
producer.close()  # Close the producer when done

print("SSL Messages sent successfully.")
```

#### Consumer

```python
from kafka import KafkaConsumer
import json
import ssl
import os

# Generate 4 random bytes
random_bytes = os.urandom(4)
# Convert to hexadecimal string
GROUP_ID = random_bytes.hex()

context = ssl.create_default_context()

context.load_cert_chain(certfile="certs/symbiotik/kafka-truststore.pem",keyfile="certs/symbiotik/kafka-keystore.pem")

TOPIC = "my-topic"
BROKER = "symbiotik.aegisresearch.eu:9093"

consumer = KafkaConsumer(
    TOPIC,  # Replace with your topic name
    bootstrap_servers=[BROKER],
    group_id=GROUP_ID,
    security_protocol='SSL',
    ssl_context=context,
    auto_offset_reset='earliest', # Read from the beginning if no offset is found
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)
# Consume messages securely
print("Listening for SSL messages...")
for message in consumer:
    print(f"Received message: {message.value}")

consumer.close()
```
