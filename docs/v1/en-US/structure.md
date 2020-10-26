<!-- title: Structure; order: 2 -->
## Files and Folders

In a standard **SFN** application, there are always some files and folders 
presented in your project directory, some of them are necessary, some of them are 
just recommended.

- `cache/` The directory that stores cache copies.
- `dist/` The distribution directory that stores compiled files.
- `logs/` The directory that stores log files.
- `node_modules/` The directory that stores all installed NodeJS modules.
- `sessions/` The directory that stores session files, only appears when using 
    `session-file-store` module.
- `src/` The directory that stores all source files.
    - `assets/` The directory that stores static files.
    - `bootstrap/` The directory that stores bootstrap files.
        - `index.ts` The default user-defined bootstrap file.
        - `http.ts`  User-defined bootstrap file related to HTTP controllers.
        - `websocket.ts` User-defined bootstrap file related to WebSocket controllers.
        - Other files must be loaded by `index.ts`.
    - `controllers/`* The directory that stores controller files.
    - `locales/`* The directory that stores language packs.
    - `models/`* The directory that stores model files.
    - `hooks`* The directory that stores hook files. 
    - `services/`* The directory that stores service files.
    - `utils/`* The directory that stores utility module files.
    - `views/`* The directory that stores view files.
    - `config.ts` The file of configurations, you can load other configuration
        files from this file and merge them to the default export.
    - `index.ts` The entry file of the server.
- `package.json` The specification file of the project.
- `package-lock.json`
- `tsconfig.json` The configuration file for TypeScript compiler.

Apart from these, you can create any files and folders you want, just make 
sure they'll be loaded properly.

(NOTE: * indicates the files in the current item is hot-reloadable.)

## Tips of Hot-reloading

The hot-reloading feature gives application the ability to reload modified
modules without reboot the program, however, there are things needed to be
considered since your program will automatically reload the modules, which means
any state, memory cache, variables, etc., will be wiped out once reloaded, you
have to change your development habit and design your program to be stateless,
or implement a way to save the state during service pause (in `destroy()` method)
and resume them after reload (in `init()` method). If doing so is hard for you,
just turn off hot-reloading, and it's fine.

### Configure Hot-reloading

Hot-reloading features can be enabled in the config file by setting the
`watch` option, for example:

```ts
// src/config.ts
export default <app.Config>{
    // ...
    watch: [ // configure modules will be hot-reloadable
        app.controllers,
        app.views,
        app.locales,
        app.hooks,
        app.services,
        app.utils
    ],
    // ...
}
```
