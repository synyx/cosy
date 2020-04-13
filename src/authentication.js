const session = require("koa-session");
const passport = require("koa-passport");
const LdapStrategy = require("passport-ldapauth");

passport.serializeUser((user, next) => {
	next(null, {
		email: user.mail,
		username: user.cn,
		nickname: user.synyxNickname,
	});
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

if (process.env.NODE_ENV === "development") {
	let localUsers = {};

	const LocalStrategy = require("passport-local");
	const path = require("path");
	const fs = require("fs");
	const localUsersFilePath = path.resolve(__dirname, "../local-users.json");

	try {
		const localUsersFile = fs.readFileSync(localUsersFilePath, "utf8");
		localUsers = JSON.parse(localUsersFile);
	} catch (error) {
		console.log(
			`[WARN] could not load local user file '${localUsersFilePath}'. Only Ldap is active now.`,
		);
	}

	passport.use(
		new LocalStrategy(
			{
				session: true,
				// form post requestBody field names
				usernameField: "username",
				passwordField: "password",
			},
			function (username, password, done) {
				const user = localUsers[username];
				if (user) {
					done(null, user);
				} else {
					done(null, false);
				}
			},
		),
	);
}
