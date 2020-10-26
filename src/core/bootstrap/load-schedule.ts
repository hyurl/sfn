import { ModuleProxy, createModuleProxy } from "microse";
import ScheduleService, { Schedule } from "../tools/Schedule";
import define from '@hyurl/utils/define';

declare global {
    namespace app {
        /** The portal to create and run schedules. */
        const schedule: Schedule;

        namespace services {
            const schedule: ModuleProxy<ScheduleService>;
        }
    }
}


define(app, "schedule", new Schedule("app.schedule"));

const proxy = createModuleProxy(
    "app.services.schedule",
    __dirname + "/../tools/Schedule",
    <any>app.services
);

define(app.services, "schedule", proxy);
