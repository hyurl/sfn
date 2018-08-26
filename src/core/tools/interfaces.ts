import * as webium from "webium";
import * as SocketIO from "socket.io";
import { DB, User } from "modelar";
import { UploadedFile } from "../controllers/HttpController";

export type HttpRequestMethod = string;

export interface Locale {
    [statement: string]: string;
}

interface SessionCookieData {
    path: string;
    maxAge: number | null;
    secure?: boolean;
    httpOnly: boolean;
    domain?: string;
    expires: Date | boolean;
}

interface SessionData {
    [key: string]: any;
    readonly cookie: SessionCookieData;
}

interface SessionCookie extends SessionCookieData {
    serialize(name: string, value: string): string;
}

export interface Session extends SessionData {
    readonly id: string;
    regenerate(callback: (err: any) => void): void;
    destroy(callback: (err: any) => void): void;
    reload(callback: (err: any) => void): void;
    save(callback: (err: any) => void): void;
    touch(callback: (err: any) => void): void;
    readonly cookie: SessionCookie;
    /** ID of logged-in user. */
    uid: number;
}

export interface Request extends webium.Request {
    /** Gets a DB instance for `modelar`. */
    db: DB;
    /** The logged-in user of the request. */
    user?: User;
    /** Whether the request comes from an EventSource.  */
    isEventSource: boolean;
    /** Gets the CSRF token if available. */
    csrfToken?: string;
    /** In a sfn app, the session is shared between HTTP and WebSocket. */
    session: Session;
    /** The same session ID as `session.id`. */
    sessionID: string;
    /** 
     * A short-version url, when the url contains more than 64 characters,
     * the rest part will be cut off and changed to `...`.
     */
    shortUrl: string;
    /**
     * When in the controller constructor, the files are in uploading state,
     * when in the method bound to the route, the files are uploaded and 
     * stored in disk.
     */
    files?: { [field: string]: UploadedFile[] };
}

export interface Response extends webium.Response {
    /** Sends data to the client via XML document. */
    xml(data: { [key: string]: any }): void;
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
}

export interface WebSocket extends SocketIO.Socket {
    /** The domain name of the handshake. */
    domainName?: string;
    /** The subdomain name of the handshake. */
    subdomain?: string;
    /** Gets a DB instance for `modelar`. */
    db: DB;
    /** The logged-in user of the socket. */
    user?: User;
    /** In a sfn app, the session is shared between HTTP and WebSocket. */
    session: Session;
    /** * The cookies of handshake. */
    cookies: { [name: string]: any };
    /** The proxy information of handshake. */
    proxy?: {
        protocol: string,
        host: string,
        ips: string[],
        ip: string
    };
    /** The protocol of the socket, either `ws` or `wss`. */
    protocol: string;
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
    /** `true` if the protocol is `wss`, `false` otherwise. */
    secure: boolean;
}