import { WebSocketController } from "../controllers/WebSocketController";

export interface EventMap {
    [namespace: string]: {
        [event: string]: {
            Class: typeof WebSocketController;
            method: string;
        }
    }
}

export const EventMap: EventMap = {};