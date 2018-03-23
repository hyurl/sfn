import { App } from "webium";
import { session } from "../bootstrap/session";

export function handleHttpSession(app: App) {
    app.use(session);
}