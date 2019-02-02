import { isDevMode } from "../../init";

export interface TemplateOptions {
    [option: string]: any;
    /**
     * Whether the compiled function should be cached in memory, in `dev` mode, 
     * it's `false` by default, while in `pro` mode, it's `true`.
     */
    cache?: boolean;
    /**
     * Sets a specified encoding for loading the template file (default: `utf8`).
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
     * Renders a view file.
     * @param vars Local variables passed to the view file.
     */
    abstract renderFile(filename: string, vars?: { [name: string]: any }): Promise<string>;
}