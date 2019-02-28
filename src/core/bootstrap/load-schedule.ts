import * as alar from "alar";
import { Schedule, default as ScheduleService } from "../tools/Schedule";

declare global {
    namespace app {
        const schedule: Schedule;

        namespace services {
            const schedule: ModuleProxy<ScheduleService>;
        }
    }
}


global["app"].schedule = new Schedule("app.schedule");
global["app"].services.schedule = new alar.ModuleProxyBase(
    "app.services.schedule",
    __dirname + "/../tools/Schedule"
);