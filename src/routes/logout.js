const route = require("koa-route");

module.exports = function (app) {
	app.use(
		route.post("/logout", async function (ctx) {
			await ctx.logout();
			ctx.rdirect("/");
		}),
	);
};
