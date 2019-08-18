import { Hook, Request } from 'sfn';

declare global {
    namespace app {
        namespace hooks {
            namespace web {
                const onView: Hook<Request>;
            }
        }
    }
}

app.hooks.web.onView.bind(async (req) => {
    app.services.logger.instance().log(`Client IP: ${req.ip}, URL: ${req.url}`);
});