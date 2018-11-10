const { HttpController } = require("sfn");
const { User } = require("modelar");

exports.default = class extends HttpController {

    /**
     * @route POST /user/create
     * @returns {Promise<User>}
     */
    async create() {
        let { req } = this;
        try {
            return await User.use(req.db).insert(req.body);
        } catch (error) {
            throw new HttpError(500, error.message);
        }
    }

    /**
     * @route GET /user/:id
     * @example GET /user/1
     * @returns {Promise<User>}
     */
    async get() {
        let { req } = this;
        if (!req.params.id) {
            throw new HttpError(400);
        }
        try {
            let id = parseInt(req.params.id);
            return await User.use(req.db).get(id);
        } catch (error) {
            throw new HttpError(404, error.message);
        }
    }

    /**
     * @route PATCH /user/:id/update
     * @example PATCH /user/1/update
     */
    async update() {
        let { req } = this;
        try {
            var user = await this.get();
            return await user.update(req.body);
        } catch (error) {
            if (!(error instanceof HttpError)) {
                throw new HttpError(500, error.message);
            } else {
                throw error;
            }
        }
    }

    /** 
     * @route DELETE /user/:id
     * @example DELETE /user/1
     */
    delete() {
        return this.get().then(user => {
            return user.delete();
        });
    }

    /**
     * @route POST /user/login
     * @returns {Promise<User>}
     */
    login() {
        let { req } = this;
        let options = {
            user: req.body.username,
            password: req.body.password
        };
        return User.use(req.db).login(options).then(user => {
            req.session.uid = user.id;
            return user;
        });
    }

    /** @route POST /user/logout */
    logout() {
        delete this.session.uid;
        return req.user;
    }
}