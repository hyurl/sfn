import "sfn";
import { Model, field, primary } from "modelar";

declare global {
    namespace app {
        namespace models {
            const __mod__: ModuleProxy<__Model__, { [field: string]: any }>
        }
    }
}

export default class __Model__ extends Model {
    table = "__table__";

    @field
    @primary
    id: number;
}