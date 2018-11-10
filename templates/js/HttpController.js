const { HttpController } = require("sfn");

exports.default = class extends HttpController {

    /** @route GET /{name}/ */
    index() {
        let { req, res } = this;
        // ...
    }

    /** @route POST /{name} */
    async create() {
        let { req, res } = this;
        // ...
    }

    /** @route GET /{name}/:id */
    async get() {
        let { req, res } = this;
        // ...
    }

    /** @route PATCH /{name}/:id */
    async update() {
        let { req, res } = this;
        // ...
    }

    /** @route DELETE /{name}/:id */
    async delete() {
        let { req, res } = this;
        // ...
    }
}