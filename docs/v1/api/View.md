<!-- title: View; order: 15 -->

## View

```ts
interface View { }
```

## Methods

### render

Renders the view file with the `data` passed to the template.

```ts
render(data?: { [name: string]: any; }): string | Promise<string>;
```
