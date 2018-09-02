"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sfn_1 = require("sfn");
const modelar_1 = require("modelar");
class default_1 extends sfn_1.WebSocketController {
    create(data, socket) {
        return modelar_1.User.use(socket.db).insert(data);
    }
    get(data, socket) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!data.id) {
                throw new sfn_1.SocketError(400);
            }
            try {
                return yield modelar_1.User.use(socket.db).get(data.id);
            }
            catch (e) {
                throw new sfn_1.SocketError(404, e.message);
            }
        });
    }
    update(data, socket) {
        return this.get(data, socket).then(user => {
            return user.update(data);
        });
    }
    delete(data, socket) {
        return this.get(data, socket).then(user => {
            return user.delete();
        });
    }
    login(data, socket) {
        let options = {
            user: data.username,
            password: data.password
        };
        return modelar_1.User.use(socket.db).login(options).then(user => {
            socket.session.uid = user.id;
            return user;
        });
    }
    logout(socket) {
        delete socket.session.uid;
        return socket.user;
    }
}
tslib_1.__decorate([
    sfn_1.event("/user/create"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "create", null);
tslib_1.__decorate([
    sfn_1.event("/user/get"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], default_1.prototype, "get", null);
tslib_1.__decorate([
    sfn_1.event("/user/update"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "update", null);
tslib_1.__decorate([
    sfn_1.event("/user/delate"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "delete", null);
tslib_1.__decorate([
    sfn_1.event("/user/login"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "login", null);
tslib_1.__decorate([
    sfn_1.event("/user/logout"),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], default_1.prototype, "logout", null);
exports.default = default_1;
//# sourceMappingURL=User.js.map