import { WebSocketController, WebSocket, event } from "sfn";

declare global {
    namespace app {
        namespace controllers {
            const __mod__: ModuleProxy<__Controller__, WebSocket>;
        }
    }
}

export default class __Controller__ extends WebSocketController {
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