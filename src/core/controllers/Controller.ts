import * as path from "path";
import { Service } from "../tools/Service";
import { MarkdownParser } from "../tools/MarkdownParser";

/**
 * The Controller give you a common API to return data to the underlying 
 * response context, all controllers will be automatically handled by the 
 * framework.
 */
export class Controller extends Service {
    /** Sets what methods require authentication. */
    static RequireAuth: string[] = [];
    /** Indicates whether the operation is authorized. */
    authorized: boolean;
    /**
     * The file that defines the current class, this property will be set
     * automatically by the framework when the controller is imported.
     */
    static filename: string;

    constructor() {
        super();
        this.authorized = false;
    }

    /** Sends successful action results to the response context. */
    success(data: any, code: number = 200) {
        return {
            success: true,
            code,
            data,
        };
    }

    /** Sends failed action results to the response context. */
    error(msg: string | Error, code: number = 500) {
        msg = msg instanceof Error ? msg.message : msg;
        return {
            success: false,
            code,
            error: msg
        };
    }
}