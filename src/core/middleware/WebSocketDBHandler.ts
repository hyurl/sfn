import { DB } from "modelar";
import { Server } from "socket.io";
import { config } from "../../init";
import { WebSocket } from "../tools/interfaces";
import { realDB } from "../tools/symbols";

export function handleWebSocketDB(io: Server): void {
    io.use((socket: WebSocket, next) => {
        Object.defineProperty(socket, "db", {
            get: () => {
                if (socket[realDB] === undefined) {
                    socket[realDB] = new DB(config.database);
                }
                return socket[realDB];
            },
            set(v: DB) {
                socket[realDB] = v;
            }
        });

        // When the socket is disconnected, recycle the database 
        // connection.
        socket.on("disconnected", () => {
            if (socket[realDB])
                socket[realDB].release();
        });

        next();
    });
}