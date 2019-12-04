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

export function grey(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("grey", callSite, bindings);
}

export function green(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("green", callSite, bindings);
}

export function yellow(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("yellow", callSite, bindings);
}

export function red(callSite: TemplateStringsArray, ...bindings: any[]) {
    return color("red", callSite, bindings);
}
