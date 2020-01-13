import { WebSocketController, WebSocket, event } from "sfn";

export default class extends WebSocketController {
    @event("/{name}/create")
    create(data: any, socket: WebSocket) {
        // TODO
    }

    @event("/{name}/get")
    get(data: any, socket: WebSocket) {
        // TODO
    }

    @event("/{name}/update")
    update(data: any, socket: WebSocket) {
        // TODO
    }

    @event("/{name}/delete")
    delete(data: any, socket: WebSocket) {
        // TODO
    }

    // ...
}