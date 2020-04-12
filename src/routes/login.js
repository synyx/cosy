const passport = require("koa-passport");
const route = require("koa-route");

module.exports = function (app) {
	app.use(
		route.get("/login", async function (ctx) {
			console.log(":: /login");
			console.log(":: ", ctx);
			const { error, username } = ctx.request.query;
			await ctx.render("login", {
				error: error != undefined,
				username,
				csrf: ctx.csrf,
			});
		}),
	);

	app.use(
		route.post("/login", async function (ctx, next) {
			const { username } = ctx.request.body;
			await passport.authenticate("ldapauth", {
				session: true,
				successRedirect: "/",
				failureRedirect: `/login?error&username=${username}`,
			})(ctx, next);
		}),
	);
};
