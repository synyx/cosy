const route = require("koa-route");
const authentication = require("../security/authentication");

module.exports = function (app) {
	app.use(
		route.post("/logout", async function (ctx) {
			authentication.removeUser(ctx.state.user.username);

			await ctx.logout();
			ctx.redirect("/");
		}),
	);
};
