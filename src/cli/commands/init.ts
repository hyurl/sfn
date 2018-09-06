/** Initiate the project after SFN is installed. */
import * as path from "path";
import * as fs from "fs-extra";
import * as program from "commander";
import { SRC_PATH, isTypeScript, ROOT_PATH } from "../../init";
import { red, green } from "../../core/tools/functions-inner";

// Command `sfn init` is used to initiate your project.
program.command("init")
    .description("initiate a new project")
    .action(() => {
        console.log(red`Initiating...`);

        try {
            let sfnd = path.normalize(__dirname + "/../../.."),
                ext = isTypeScript ? "ts" : "js",
                bootstrap = `${SRC_PATH}/bootstrap`,
                assetsDir = `${SRC_PATH}/assets`,
                ctrlDir = `${SRC_PATH}/controllers`,
                localeDir = `${SRC_PATH}/locales`,
                viewDir = `${SRC_PATH}/views`,
                modelDir = `${SRC_PATH}/models`,
                scheduleDir = `${SRC_PATH}/schedules`,
                serviceDir = `${SRC_PATH}/services`,
                configFile = `${SRC_PATH}/config.${ext}`,
                indexFile = `${SRC_PATH}/index.${ext}`,
                envFile = `${ROOT_PATH}/.env`;

            if (!fs.existsSync(envFile))
                fs.copyFileSync(`${sfnd}/.env`, envFile);

            if (!fs.existsSync(SRC_PATH))
                fs.ensureDirSync(SRC_PATH);

            if (!fs.existsSync(assetsDir))
                fs.copySync(`${sfnd}/src/assets`, assetsDir);


            if (!fs.existsSync(bootstrap)) {
                fs.ensureDirSync(bootstrap);
                fs.writeFileSync(`${bootstrap}/master.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/worker.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/http.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/websocket.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/cli.${ext}`, "");
            }

            if (!fs.existsSync(ctrlDir)) {
                let dir = sfnd + (isTypeScript ? "/src" : "/templates") + "/controllers";
                fs.copySync(dir, ctrlDir);
            }

            if (!fs.existsSync(localeDir))
                fs.copySync(`${sfnd}/src/locales`, localeDir);

            if (!fs.existsSync(viewDir))
                fs.copySync(`${sfnd}/src/views`, viewDir);

            if (!fs.existsSync(modelDir))
                fs.ensureDirSync(modelDir);

            if (!fs.existsSync(scheduleDir))
                fs.ensureDirSync(scheduleDir);

            if (!fs.existsSync(serviceDir))
                fs.ensureDirSync(serviceDir);

            if (!fs.existsSync(configFile))
                fs.copySync(`${sfnd}/templates/config.${ext}`, configFile);

            if (!fs.existsSync(indexFile))
                fs.copySync(`${sfnd}/templates/index.${ext}`, indexFile);

            // expose vscode debug configurations
            let dir = `${ROOT_PATH}/.vscode/`,
                file = `${dir}/launch.json`;
            if (fs.existsSync(dir) && !fs.existsSync(file)) {
                fs.writeJsonSync(file, {
                    version: "0.2.0",
                    configurations: [
                        {
                            type: "node",
                            request: "launch",
                            protocol: "auto",
                            name: "Start Server",
                            program: "${workspaceFolder}/" + (isTypeScript ? "dist" : "src") + "/index",
                            autoAttachChildProcesses: true
                        }
                    ]
                }, { spaces: 4 });
            }

            console.log(green`Initiation succeed!`);
        } catch (err) {
            console.log(red`Initiation failed!`);
        }

        process.exit();
    });