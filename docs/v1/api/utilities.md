<!-- title: utilities; order: 16 -->

## utilities

This section includes all utility functions exposed by SFN that can be used in
user code.

## createImport

Used to create a `require`-like function, unlike the regular require function,
the created function will not throw error if the module doesn't exist, instead
if returns an empty object `{}`, and the function supports JSONC (JSON with
Comments) files by default.

```ts
function createImport(require: NodeRequire): (id: string) => {
    [x: string]: any;
    default?: any;
};
```

## tryLogError

Logs the error in a friendly way, if it detects the current process runs in
dev mode, it will print out the error with call-site records.

```ts
tryLogError(err: any, stack?: string): Promise<void>;
```

## injectCsrfToken

Injects CSRF Token into HTML forms.

```ts
function injectCsrfToken(html: string, token: string): string;
```

## escapeTags

Escapes HTML tags.

```ts
function escapeTags(html: string, tags?: string | string[]): string;
```

## escapeScriptHrefs

Escapes href attributes of JavaScript code in HTML tags.

```ts
function escapeScriptHrefs(html: string): string;
```

## escapeEventAttributes

Escapes HTML tag attributes started with `on`.

```ts
function escapeEventAttributes(html: string): string;
```
