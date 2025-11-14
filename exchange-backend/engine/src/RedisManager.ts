import { createClient, RedisClientType } from "redis";
import { DbMessage } from "./types";
import { MessageToApi } from "./types/toAPI";

export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }
  public pushMessage(message: DbMessage) {
    this.client.lPush("messages", JSON.stringify(message));
  }
  public publishMessage(channel: string, message: WsMessage) {
    this.client.publish(channel, JSON.stringify(message));
  }
  public sendToApi(clientId: string, message: MessageToApi) {
    this.client.publish(clientId, JSON.stringify(message));
  }
}
