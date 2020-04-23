require("dotenv").config();

const path = require("path");
const Koa = require("koa");
const views = require("koa-views");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const CSRF = require("koa-csrf");
const helmet = require("koa-helmet");
const cspMiddleware = require("./security/csp-middleware");

const { PORT = 3000, APP_SECRET = "super-awesome-app-secret" } = process.env;

const app = new Koa();
app.keys = [APP_SECRET];
app.use(bodyParser());

// csrf tokens for html forms
app.use(new CSRF());
// common security headers
app.use(helmet());
// content-security-policy headers
app.use(cspMiddleware());

// install view resolver
// Must be used before any router is used
app.use(function viewResolver(context, next) {
	return views(path.resolve(__dirname, "templates"), {
		extension: "hbs",
		map: { hbs: "handlebars" },
		options: {
			helpers: {
				cspNonceValue: (type) => {
					switch (type) {
						case "script":
							return cspMiddleware.generateScriptValue(context);
						case "style":
							return cspMiddleware.generateStyleValue(context);
						default:
							console.log(
								`cannot handle type=${type} to generate a nonce value. must be of type [script|style]`,
							);
							return "";
					}
				},
			},
		},
	})(context, next);
});

require("./authentication")(app);
require("./routes")(app);

// public assets
app.use(serve(path.resolve(__dirname, "../../static")));
app.use(serve(path.resolve(__dirname, "../../out")));

app.listen(PORT, () => {
	console.log(`server is listening on http://localhost:${PORT}`);
	console.log(`running with NODE_ENV=${process.env.NODE_ENV}`);
});
