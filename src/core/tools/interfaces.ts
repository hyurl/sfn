import * as webium from "webium";
import * as SocketIO from "socket.io";
import * as ExpressSession from "express-session";
import { SSE } from "sfn-sse";
import { UploadedFile, UploadingFile } from "./upload";

export interface Locale {
    $alias: string;
    [statement: string]: string;
}

export interface View {
    /** Renders the view file with the `data` passed to the template. */
    render(data?: { [name: string]: any; }): string | Promise<string>;
}

export interface Session extends Express.Session {
    /**
     * This property stores all CSRF tokens of the current session, tokens will
     * be deleted automatically after the validation is finished.
     */
    csrfTokens?: { [url: string]: string; };
}

export abstract class Session {
    static [Symbol.hasInstance](ins: any) {
        return ins instanceof ExpressSession["Session"];
    }
}

export interface Request extends webium.Request {
    /** Whether the request comes from an EventSource client.  */
    isEventSource: boolean;
    /** Gets the CSRF token if available. */
    csrfToken?: string;
    /** The session object of the current request. */
    session?: Session;
    /** An MD5 string representing the identical signature of the request. */
    readonly sign: string;
    /** 
     * A short-version URL, when the URL contains more than 64 characters,
     * the rest part will be cut off and replaced with `...`.
     */
    shortUrl: string;
    /**
     * When in the controller constructor, the files are in uploading state,
     * when in the method bound to the route, the files are uploaded and 
     * stored in disk.
     */
    files?: { [field: string]: UploadedFile[] | UploadingFile[]; };
}

export abstract class Request {
    static [Symbol.hasInstance](ins: any) {
        return (ins instanceof webium.RequestConstructor)
            || (ins instanceof webium.Http2RequestConstructor);
    }
}

export interface Response extends webium.Response {
    /** Sends data to the client as an XML document. */
    xml(data: { [key: string]: any; }, rootTag?: string, headless?: boolean): void;
    /** Whether the response data should be compressed to GZIP. */
    gzip: boolean;
    /**
     * Whether the response has been sent.
     * Because the framework uses package `express-session`, which will delay 
     * changing the property `res.finished`, so after calling `res.end()`, 
     * `res.send()`, `res.redirect()`, the `res.finished` will still be `false`,
     * so if you want to check if the response has been sent, check `res.sent` 
     * instead.
     */
    sent: boolean;
    /** The Sever-Sent Events channel of the response. */
    sse?: SSE;
}

export abstract class Response {
    static [Symbol.hasInstance](ins: any) {
        return (ins instanceof webium.ResponseConstructor)
            || (ins instanceof webium.Http2ResponseConstructor);
    }
}

export interface WebSocket extends SocketIO.Socket {
    /** The domain name of the handshake request. */
    domainName?: string;
    /** The subdomain name of the handshake request. */
    subdomain?: string;
    /** The cookies of the handshake request. */
    cookies: { [name: string]: any; };
    /** The session object of the current socket. */
    session?: Session;
    /** The proxy information of handshake request. */
    proxy?: {
        protocol: string,
        host: string,
        ips: string[],
        ip: string;
    };
    /** The protocol of the socket, either `ws` or `wss`. */
    protocol: "ws" | "wss";
    host: string;
    hostname: string;
    port?: number;
    /** The remote IP of the socket. */
    ip: string;
    ips: string[];
    /** The language that the client uses. */
    lang: string;
    /** All languages that the client accepts. */
    langs: string[];
    /** Whether the connection uses SSL/TSL. */
    secure: boolean;
}

export abstract class WebSocket {
    static [Symbol.hasInstance](ins: SocketIO.Socket) {
        return app.ws && ins.server === app.ws;
    }
}
