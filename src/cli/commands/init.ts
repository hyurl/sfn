/** Initiate the project after SFN is installed. */
import * as path from "path";
import * as fs from "fs-extra";
import * as program from "commander";
import { SRC_PATH, isTypeScript, ROOT_PATH } from "../../init";
import { red, green, grey } from "../../core/tools/functions-inner";

// Command `sfn init` is used to initiate your project.
program.command("init")
    .description("initiate a new project")
    .action(() => {
        console.log(grey`Initiating...`);

        try {
            let sfnd = path.normalize(__dirname + "/../../.."),
                tplDir = `${sfnd}/templates`,
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
                fs.copySync(`${tplDir}/assets`, assetsDir);

            if (!fs.existsSync(bootstrap)) {
                fs.ensureDirSync(bootstrap);
                fs.writeFileSync(`${bootstrap}/master.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/worker.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/http.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/websocket.${ext}`, "");
                fs.writeFileSync(`${bootstrap}/cli.${ext}`, "");
            }

            if (!fs.existsSync(ctrlDir)) {
                let dir = `${tplDir}/${ext}/controllers`;
                fs.copySync(dir, ctrlDir);
            }

            if (!fs.existsSync(localeDir))
                fs.copySync(`${tplDir}/locales`, localeDir);

            if (!fs.existsSync(viewDir))
                fs.copySync(`${tplDir}/views`, viewDir);

            if (!fs.existsSync(modelDir))
                fs.ensureDirSync(modelDir);

            if (!fs.existsSync(scheduleDir))
                fs.ensureDirSync(scheduleDir);

            if (!fs.existsSync(serviceDir))
                fs.ensureDirSync(serviceDir);

            if (!fs.existsSync(configFile))
                fs.copySync(`${tplDir}/${ext}/config.${ext}`, configFile);

            if (!fs.existsSync(indexFile))
                fs.copySync(`${tplDir}/${ext}/index.${ext}`, indexFile);

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
                            program: "${workspaceFolder}/" + (isTypeScript ? "dist" : "src") + "/index"
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