const path = require("path");
const Koa = require("koa");
const views = require("koa-views");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const CSRF = require("koa-csrf");
const helmet = require("koa-helmet");

const { PORT = 3000, APP_SECRET = "super-awesome-app-secret" } = process.env;

const app = new Koa();
app.keys = [APP_SECRET];
app.use(bodyParser());

app.use(new CSRF());
app.use(helmet());

// install view resolver
// Must be used before any router is used
app.use(
	views(path.resolve(__dirname, "views"), {
		extension: "hbs",
		map: { hbs: "handlebars" },
	}),
);

// public assets
app.use(serve(path.resolve(__dirname, "../static")));

require("./authentication")(app);
require("./routes")(app);

app.listen(PORT, () => {
	console.log(`server is listening on http://localhost:${PORT}`);
	console.log(`running with NODE_ENV=${process.env.NODE_ENV}`);
});
