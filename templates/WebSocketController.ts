import { WebSocketController, WebSocket, event } from "sfn";

export default class extends WebSocketController {
    @event("/{name}/create")
    create(data: any, socket: WebSocket) {
        // ...
    }

    @event("/{name}/get")
    get(data: any, socket: WebSocket) {
        // ...
    }

    @event("/{name}/update")
    update(data: any, socket: WebSocket) {
        // ...
    }

    @event("/{name}/delete")
    delete(data: any, socket: WebSocket) {
        // ...
    }
}