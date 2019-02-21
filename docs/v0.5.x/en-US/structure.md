<!-- title: Structure; order: 2 -->
# Files and Folders

In a standard **SFN** application, there are always some files and folders 
presented in you project directory, some of them are necessary, some of them are 
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
        - `index.ts` The default bootstrap file.
        - `http.ts` Bootstrap files related to HTTP controllers.
        - `websocket.ts` Bootstrap files related to WebSocket controllers.
        - Other files must be loaded by `index.ts`.
    - `controllers/`* The directory the stores all controller files.
    - `locales/`* The directory that stores all language packs.
    - `models/`* The directory that stores all models files.
    - `schedules/` The directory that stores all schedule files.
    - `services/`* The directory that stores all service files.
    - `views/`* The directory that stores all view files.
    - `config.ts` The file of configurations.
    - `index.ts` The entry file of the project.
- `package.json` The specification file of the project.
- `package-lock.json`
- `tsconfig.json` The configuration file of TypeScript compiler.

Apart from these, you can create any files and folders you want, just make 
sure they'll be loaded properly.

(NOTE: * indicates the files in the current item is hot-reloadable.)