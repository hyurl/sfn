import "sfn";

if (require.main.filename === __filename) {
    let appId: string = app.argv["app-id"] || app.argv._[2];

    if (appId) {
        app.serve(appId);
    } else {
        app.serve();
    }
}