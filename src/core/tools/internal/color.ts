import * as moment from "moment";
import * as chalk from "chalk";

function color(
    color: string,
    callSite: TemplateStringsArray,
    bindings: any[]
): string {
    let msg = callSite.map((str, i) => {
        return i > 0 ? bindings[i - 1] + str : str;
    }).join("");
    let timeStr = moment().format("YYYY-MM-DD HH:mm:ss");

    return chalk[color](`[${timeStr}]`) + " " + msg;
}

/**
 * Use this functions as a string tag with console functions to print a string
 * in grey color with date-time string prefixed.
 */
export function grey(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("grey", callSite, bindings);
}

/**
 * Use this functions as a string tag with console functions to print a string
 * in green color with date-time string prefixed.
 */
export function green(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("green", callSite, bindings);
}

/**
 * Use this functions as a string tag with console functions to print a string
 * in yellow color with date-time string prefixed.
 */
export function yellow(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("yellow", callSite, bindings);
}

/**
 * Use this functions as a string tag with console functions to print a string
 * in red color with date-time string prefixed.
 */
export function red(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("red", callSite, bindings);
}
