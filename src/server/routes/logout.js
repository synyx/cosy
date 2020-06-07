const route = require("koa-route");

module.exports = function (app) {
	app.use(
		route.post("/logout", async function (ctx) {
			ctx.app.emit("user-logged-out", { username: ctx.state.user.username });
			await ctx.logout();
			ctx.redirect("/");
		}),
	);
};
