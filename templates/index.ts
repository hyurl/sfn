import { tryLogError } from "sfn";

if (require.main.filename === __filename) {
    (async () => {
        let appId: string = app.argv["app-id"] || app.argv._[2];

        if (appId) {
            await app.serve(appId);
        } else {
            await app.serve();
        }
    })().catch(err => {
        return tryLogError(err);
    });
}