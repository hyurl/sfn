import { Service } from "sfn";

declare global {
    namespace app {
        namespace services {
            const __mod__: ModuleProxy<__Service__>;
        }
    }
}

export default class __Service__ extends Service {
    // ...
}