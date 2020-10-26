import { Service } from "sfn";
import { ModuleProxy } from "microse";

declare global {
    namespace app {
        namespace services {
            const __mod__: ModuleProxy<__Service__>;
        }
    }
}

export default class __Service__ extends Service {
    async gc() {
        await super.gc();

        // TODO
    }

    async init() {
        await super.init();

        // TODO
    }

    async destroy() {
        await super.destroy();

        // TODO
    }

    // ...
}
