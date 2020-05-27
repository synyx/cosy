require("dotenv").config();

// NODE_ENV is set in the `<root>/.env` file intialized by `dotenv` above
// a configured environment variable will override the default one
const { NODE_ENV } = process.env;
console.log(`running with NODE_ENV="${NODE_ENV}"`);

const path = require("path");
const Koa = require("koa");
const views = require("koa-views");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const CSRF = require("koa-csrf");
const helmet = require("koa-helmet");
const cspMiddleware = require("./security/csp-middleware");
const compress = require("koa-compress");

const { PORT = 3000, APP_SECRET = "super-awesome-app-secret" } = process.env;

const app = new Koa();
app.keys = [APP_SECRET];
app.use(bodyParser());

// enable gzip compression
app.use(compress());

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
			partials: {
				"application-version-info-script":
					"./partials/application-version-info-script",
				chat: "./partials/chat",
				office: "./partials/office",
				arcade: "./partials/arcade",
			},
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

require("./security/authentication")(app);
require("./routes")(app);

// public assets
app.use(serve(path.resolve(__dirname, "../../static")));
app.use(serve(path.resolve(__dirname, "../../static/t-rex")));
app.use(serve(path.resolve(__dirname, "../../out")));

app.listen(PORT, () => {
	console.log(`server is listening on http://localhost:${PORT}`);
});
