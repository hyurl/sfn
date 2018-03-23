"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
const modelar_1 = require("modelar");
class default_1 extends sfn_1.HttpController {
    create(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield modelar_1.User.use(req.db).insert(req.body);
            }
            catch (error) {
                throw new sfn_1.HttpError(500, error.message);
            }
        });
    }
    get(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!req.params.id) {
                throw new sfn_1.HttpError(400);
            }
            try {
                let id = parseInt(req.params.id);
                return yield modelar_1.User.use(req.db).get(id);
            }
            catch (error) {
                throw new sfn_1.HttpError(404, error.message);
            }
        });
    }
    update(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                var user = yield this.get(req);
                return yield user.update(req.body);
            }
            catch (error) {
                if (!(error instanceof sfn_1.HttpError)) {
                    throw new sfn_1.HttpError(500, error.message);
                }
                else {
                    throw error;
                }
            }
        });
    }
    delete(req) {
        return this.get(req).then(user => {
            return user.delete();
        });
    }
    login(req) {
        let options = {
            user: req.body.username,
            password: req.body.password
        };
        return modelar_1.User.use(req.db).login(options).then(user => {
            req.session.uid = user.id;
            return user;
        });
    }
    logout(req) {
        delete req.session.uid;
        return req.user;
    }
}
tslib_1.__decorate([
    sfn_1.route("POST", "/user/create")
], default_1.prototype, "create", null);
tslib_1.__decorate([
    sfn_1.route("GET", "/user/:id")
], default_1.prototype, "get", null);
tslib_1.__decorate([
    sfn_1.route("PATCH", "/user/:id/update")
], default_1.prototype, "update", null);
tslib_1.__decorate([
    sfn_1.route("DELETE", "/user/:id")
], default_1.prototype, "delete", null);
tslib_1.__decorate([
    sfn_1.route("POST", "/user/login")
], default_1.prototype, "login", null);
tslib_1.__decorate([
    sfn_1.route("POST", "/user/logout")
], default_1.prototype, "logout", null);
exports.default = default_1;
//# sourceMappingURL=User.js.map