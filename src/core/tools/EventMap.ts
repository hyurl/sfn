import { WebSocketController } from "../controllers/WebSocketController";
import { WebSocket } from "./interfaces";

export interface EventMap {
    [event: string]: {
        Class: typeof WebSocketController;
        method: string;
    }
}

export const EventMap: EventMap = {};