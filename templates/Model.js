const { Model } = require("modelar");

exports.__Model__ = class __Model__ extends Model {
    /**
     * @param {{[field: string]: any}} data 
     */
    constructor(data) {
        super(data, {
            table: "__table__",
            fields: ["id"],
            primary: "id"
        });
    }
}