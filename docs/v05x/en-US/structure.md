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
    - `plugins`* The directory that stores all plugin files. 
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

# Hot-reloading

The hot-reloading feature was introduced since SFN 0.3, back then only 
controllers that can be hot-reloaded. However, since version 0.5, SFN introduced
a new hot-reloading model via [Alar](https://github.com/hyurl/alar) framework,
now almost all facilities in a SFN project will be hot-reloadable.

The switch to turn on hot-reloading feature is `config.hotReloading`, which is 
now set to `true` by default, that means the moment you install SFN and run the
program, your program will be watched and is waiting to hot-reload any source 
file that may potentially be modified at runtime.

But there are things need to be considered since your program will automatically
reload the imported modules, which means any state, memory cache, variables, etc.
will be wiped out once reloaded, you have to change your development habit and 
design your program to be stateless. If doing so is hard for you, just turn off 
hot-reloading, and it's fine.