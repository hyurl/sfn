import { HttpController } from "sfn";
import { EjsLoader } from "sfn-ejs-loader";

HttpController.viewExtname = ".ejs";

app.views.register(new EjsLoader());