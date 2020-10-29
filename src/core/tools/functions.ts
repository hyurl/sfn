// Expose some internal functions as utilities to the public API.
export { green, grey, red, yellow } from "./internal/color";
export { tryLogError } from "./internal/error";
export { createImport } from "./internal/module";

/** Injects CSRF Token into HTML forms. */
export function injectCsrfToken(html: string, token: string): string {
    let ele = `<input type="hidden" name="x-csrf-token" value="${token}">`;
    let matches = html.match(/<form\s+.*?>/g);

    if (matches) {
        for (let match of matches) {
            let i = html.indexOf(match) + match.length;
            let j = html.indexOf("<", i);
            let spaces = html.substring(i, j);

            html = html.slice(0, i) + spaces + ele + html.slice(i);
        }
    }

    return html;
}
