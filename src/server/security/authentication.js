const session = require("koa-session");
const passport = require("koa-passport");
const LocalStrategy = require("passport-local");

const SESSION_TIMEOUT = 3 * 60 * 60 * 1000;

let currentUsers = {};

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
	new LocalStrategy(
		{
			session: true,
			// form post requestBody field names
			usernameField: "username",
			passwordField: "password",
		},
		function (username, password, done) {
			if (!currentUsers.hasOwnProperty(username)) {
				currentUsers[username] = {
					mail: username,
					cn: username,
					synyxNickname: username,
				};
				setTimeout(() => removeUser(username), SESSION_TIMEOUT);
				console.log(`user ${username} joined, total users: ${Object.keys(currentUsers).length}`);
				done(null, currentUsers[username]);
			} else {
				done(null, false);
			}
		},
	),
);

const removeUser = function (username) {
	if (currentUsers.hasOwnProperty(username)) {
		console.log(`removing user ${username}, total users: ${Object.keys(currentUsers).length}`);
		delete currentUsers[username];
	}
};

module.exports = function (app) {
	app.use(
		session(
			{
				maxAge: SESSION_TIMEOUT,
			},
			app,
		),
	);
	app.use(passport.initialize());
	app.use(passport.session());

	// ensure authenticated access
	app.use(async function (context, next) {
		if (
			context.originalUrl.startsWith("/login") ||
			context.originalUrl.startsWith("/css/") ||
			context.originalUrl.startsWith("/logo_cosy.svg") ||
			context.originalUrl.startsWith("/mockup.png") ||
			context.originalUrl.startsWith("/icon_together.svg") ||
			context.originalUrl.startsWith("/icon_collaborate.svg") ||
			context.originalUrl.startsWith("/icon_fun.svg") ||
			context.isAuthenticated()
		) {
			await next();
		} else {
			console.log(
				`not authenticated for url=${context.request.originalUrl}. redirecting to /login`,
			);
			context.redirect("/login");
		}
	});
};

module.exports.removeUser = removeUser;
