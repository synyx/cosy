const path = require("path");
const send = require("koa-send");

const route = "/t-rex";
const root = path.resolve(__dirname, "../../../static/t-rex");

module.exports = function (app) {
	app.use(async function (context, next) {
		if (context.method === "GET" && context.req.url.startsWith(route)) {
			let done = false;

			try {
				done = await send(context, context.path, {
					root,
				});
			} catch (err) {
				if (err.status !== 404) {
					throw err;
				}
			}

			if (!done) {
				return next();
			}
		}

		return next();
	});
};
