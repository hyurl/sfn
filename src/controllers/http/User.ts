import { HttpController, Request, HttpError, route } from "sfn";
import { User } from "modelar";

export default class extends HttpController {

    @route("POST", "/user/create")
    async create(req: Request) {
        try {
            return await User.use(req.db).insert(req.body);
        } catch (error) {
            throw new HttpError(500, error.message);
        }
    }

    /**
     * @example GET /user/1
     */
    @route("GET", "/user/:id")
    async get(req: Request, id: number) {
        if (!id || isNaN(id)) {
            throw new HttpError(400);
        }

        try {
            return await User.use(req.db).get(id);
        } catch (error) {
            throw new HttpError(404, error.message);
        }
    }

    /**
     * @example PATCH /user/1/update
     */
    @route("PATCH", "/user/:id/update")
    async update(req: Request, id: number) {
        try {
            var user = <User>await this.get(req, id);
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
     * @example DELETE /user/1
     */
    @route("DELETE", "/user/:id")
    delete(req: Request, id: number) {
        return this.get(req, id).then(user => {
            return user.delete();
        });
    }

    @route("POST", "/user/login")
    login(req: Request) {
        let options = {
            user: req.body.username,
            password: req.body.password
        };
        return (<User>User.use(req.db)).login(options).then(user => {
            req.session.uid = user.id;
            return user;
        });
    }

    @route("POST", "/user/logout")
    logout(req) {
        delete req.session.uid;
        return req.user;
    }
}