import client, { type Channel, type connect } from "amqplib";
import { env } from "~/env";
import type { Message } from "./worker/task";

class RabbitMQClient {
  private connection: Awaited<ReturnType<typeof connect>> | null = null;
  private channel: Channel | null = null;
  private connected: boolean = false;
  private readonly QUEUE = "celery";

  constructor() {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(
        "⚠️ Skipping RabbitMQ connection during build time. Connection will be established at runtime.",
      );
      return;
    }

    console.log("Initializing RabbitMQ Client");
    this.connect().finally(() => {});
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection?.close();
    }

    this.connection = null;
    this.channel = null;
    this.connected = false;
  }

  async connect(): Promise<void> {
    // Ensure any existing connection is closed before creating a new one
    await this.disconnect();

    // Assert env type
    if (env.RABBIT_MQ_URL === undefined || env.RABBIT_MQ_URL.trim() === "") {
      throw new Error("RABBIT_MQ_URL is required");
    }

    try {
      console.log("⌛️ Connecting to RabbitMQ Server");

      this.connection = await client.connect(env.RABBIT_MQ_URL);
      this.channel = await this.connection.createChannel();

      this.connection.on("error", (_err) => {
        this.connected = false;
      });
      this.connection.on("close", () => {
        this.connected = false;
      });

      this.connected = true;
      console.log("✅ RabbitMQ Connection is ready");
    } catch (error) {
      console.error("Error connecting to RabbitMQ Server:", error);
      throw error;
    }
  }

  async sendMessage(message: Message): Promise<void> {
    if (!this.connected || !this.connection || !this.channel) {
      await this.connect();
    }
    if (!this.connected || !this.connection || !this.channel) {
      throw new Error("Failed to establish RabbitMQ connection");
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      await this.channel.assertQueue(this.QUEUE, { durable: true });
      this.channel.sendToQueue(this.QUEUE, messageBuffer, {
        contentType: "application/json",
      });
    } catch (error) {
      console.error("Error sending message to RabbitMQ queue:", error);
      throw error;
    }
  }
}

const globalForRabbitMQClient = global as unknown as {
  rabbitMQClient?: RabbitMQClient;
};

function getRabbitMQClient(): RabbitMQClient {
  if (!globalForRabbitMQClient.rabbitMQClient) {
    globalForRabbitMQClient.rabbitMQClient = new RabbitMQClient();
  }
  return globalForRabbitMQClient.rabbitMQClient;
}

export const rabbitMQClient = getRabbitMQClient();
