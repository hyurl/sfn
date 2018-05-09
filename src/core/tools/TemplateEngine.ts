import { isDevMode } from "../../init";

export interface TemplateOptions {
    [option: string]: any;
    /**
     * Wether the compiler shuld be cached in memory, in `dev` mode, it's 
     * `true` by default, while in `pro` mode, it's `false`.
     */
    cache?: boolean;
    /**
     * Use a specified encoding to load a template file (default: `utf8`).
     */
    encoding?: string;
}

/**
 * Template engine adapter for view system.
 */
export abstract class TemplateEngine {
    options: TemplateOptions;

    /**
     * @param options Options for the corresponding view engine.
     */
    constructor(options?: TemplateOptions) {
        this.options = Object.assign({
            cache: !isDevMode,
            encoding: "utf8"
        }, options);

        if (!(this.renderFile instanceof Function)) {
            throw new ReferenceError(this.constructor.name
                + ".renderFile() is not implemented.");
        }
    }

    /**
     * Render a view file.
     * @param vars Local variables passed to the view file.
     */
    abstract renderFile(filename: string, vars?: { [name: string]: any }): Promise<string>;
}