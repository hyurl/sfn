import { Service } from "../tools/Service";
import { ControllerIntercepter } from '../tools/functions';

/**
 * The Controller give you a common API to return data to the underlying 
 * response context, all controllers will be automatically handled by the 
 * framework.
 */
export class Controller extends Service {
    /**
     * The file that defines the current class, this property will be set
     * automatically by the framework when the controller is imported.
     */
    static filename: string;

    /** Sets what methods that require authentication. */
    static RequireAuth: string[] = [];

    static BeforeIntercepters: {
        [method: string]: Array<ControllerIntercepter>
    } = {};

    static AfterIntercepters: {
        [method: string]: Array<ControllerIntercepter>
    } = {};

    /** Indicates whether the operation is authorized. */
    authorized: boolean = false;

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

    /** This method will be auto-called before calling the actual method. */
    before(): void | boolean | Promise<void | boolean> { }

    /** This method will be auto-called after calling the actual method. */
    after(): void | boolean | Promise<void | boolean> { }
}