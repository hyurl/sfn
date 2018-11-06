import { Model, field, primary } from "modelar";

export class __Model__ extends Model {
    table = "__table__";

    @field
    @primary
    id: number;
}