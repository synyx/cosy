const route = require("koa-route");

module.exports = function (app) {
	app.use(
		route.get("/jitsi", async function (context) {
			await context.render("jitsi", {
				jitsiDomain: "xxxxxx",
				name: context.state.user.username,
				email: context.state.user.email,
			});
		}),
	);
};
