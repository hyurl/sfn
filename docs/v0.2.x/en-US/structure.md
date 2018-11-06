<!-- title: Structure; order: 2 -->
# Relations Map

In **SFN**, there are many entities, and they're related to each other, this 
map shows the relations of them.

<pre>

          +--------------+         +-------------+
          | EventEmitter | ======> | Modelar ORM | ==============++
          +--------------+         +-------------+               ||
                 ||                    ||                        ||
                 \/                    \/                        ||
          +--------------+         +-------------------+         ||
          |    Service   | ======> | Extended Services | =====>  ||
          +--------------+         +-------------------+         ||
                 ||                       ||                     ||
                 \/                       \/                     ||
          +--------------+         +-------------+               ||
          |  Controller  |         |  Schedules  | <=============++
          +--------------+         +-------------+               ||
           //           \\           //      \\                  ||
          |/             \|         |/        \|                 ||
+----------------+ +---------------------+ +-------------------+ ||
| HttpController | | WebSocketController | | Broadcast Channel | ||
+----------------+ +---------------------+ +-------------------+ ||
        /\   \\           //      /\                ||           ||
        ||    \|         |/       ||                ||           ||
        ||  +----------------+    ||                ||           ||
        ||  | User Interface | <==~~================++           ||
        ||  +----------------+    ||                             ||
        ||                        ||                             ||
        ++========================++=============================++

</pre>

# Files and Folders

In a standard **SFN** application, there are always some files and folders 
presented in you project directory, some of them are necessary, some of them are 
just recommended.

- `dist/` The distribution directory that stores compiled files.
- `logs/` The directory that stores log files.
- `node_modules/` The directory that stores all installed NodeJS modules.
- `sessions/` The directory that stores session files, only appears when using 
    `session-file-store` module.
- `src/` The directory that stores all source files.
    - `assets/` The directory that stores static files.
    - `bootstrap/` The directory that stores bootstrap files.
        - `http.ts` The file that loads bootstrap files related to HTTP 
            controllers.
        - `websocket.ts`  The files that loads bootstrap files related to 
            WebSocket controllers.
        - Other files must be loaded either by `http.ts` or `websocket.ts`.
    - `controllers/` The directory the stores all controller files.
    - `locales/` The directory that stores all language packs.
    - `models/` The directory that stores all models files.
    - `schedules/` The directory that stores all schedule files.
    - `services/` The directory that stores all service files.
    - `views/` The directory that stores all view files.
    - `config.ts` The file of configurations.
    - `index.ts` The entry file of the project.
- `package.json` The specification file of the project.
- `package-lock.json`
- `tsconfig.json` The configuration file of TypeScript compiler.

Apart from these, you can create any files and folders you want, just make 
sure they'll be loaded properly.