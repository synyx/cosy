require("dotenv").config();

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
// Must be used
// - before any router is used
// - before CSP middleware
//   (as we're generating nonce value here which are used by the CSP middleware)
app.use(function viewResolver(context, next) {
	// cache generated nonce values in the context state
	// these are handled by helmet-csp middleware later
	context.res.state = context.res.state || {};
	context.res.state.csp = context.res.state.csp || {};
	context.res.state.csp.nonce = context.res.state.csp.nonce || {};
	context.res.state.csp.nonce.script = context.res.state.csp.nonce.script || [];
	context.res.state.csp.nonce.style = context.res.state.csp.nonce.style || [];

	return views(path.resolve(__dirname, "templates"), {
		extension: "hbs",
		map: { hbs: "handlebars" },
		options: {
			helpers: {
				cspNonceValue: (type) => {
					const value = require("crypto").randomBytes(16).toString("base64");
					switch (type) {
						case "script": {
							context.res.state.csp.nonce.script.push(value);
							return value;
						}
						case "style": {
							context.res.state.csp.nonce.style.push(value);
							return value;
						}
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

// install CSP middleware
// must be after the view resolver. as the view resolver writes nonce values
// into the response state
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: [
				"'self'",
				(request, response) => {
					return response.state.csp.nonce.script.map((v) => `'nonce-${v}'`);
				},
			],
			styleSrc: [
				"'self'",
				(request, response) => {
					return response.state.csp.nonce.style.map((v) => `'nonce-${v}'`);
				},
			],
			fontSrc: ["'self'"],
			imgSrc: ["'self'"],
			objectSrc: ["'none'"],
			sandbox: ["allow-scripts", "allow-forms", "allow-same-origin"],
		},
	}),
);

// public assets
app.use(serve(path.resolve(__dirname, "../../static")));

require("./authentication")(app);
require("./routes")(app);

app.listen(PORT, () => {
	console.log(`server is listening on http://localhost:${PORT}`);
	console.log(`running with NODE_ENV=${process.env.NODE_ENV}`);
});
