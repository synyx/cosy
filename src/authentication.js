const session = require("koa-session");
const passport = require("koa-passport");
const LdapStrategy = require("passport-ldapauth");

passport.serializeUser((user, next) => {
	next(null, user);
});

passport.deserializeUser((obj, next) => {
	next(null, obj);
});

passport.use(
	new LdapStrategy({
		server: {
			url: "ldap://---------------",
			searchBase: "----------------",
			searchFilter: "(uid={{username}})",
		},
		// form post requestBody field names
		usernameField: "username",
		passwordField: "password",
	}),
);

module.exports = function (app) {
	app.use(session({}, app));
	app.use(passport.initialize());
	app.use(passport.session());

	// ensure authenticated access
	app.use(async function (ctx, next) {
		if (
			ctx.isAuthenticated() ||
			ctx.originalUrl.startsWith("/login") ||
			ctx.originalUrl.startsWith("/css/")
		) {
			await next();
		} else {
			console.log("not authenticated. redirecting to /login");
			ctx.redirect("/login");
		}
	});
};
