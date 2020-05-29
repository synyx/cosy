const session = require("koa-session");
const passport = require("koa-passport");
const LdapStrategy = require("passport-ldapauth");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const SESSION_TIMEOUT = 3 * 60 * 60 * 1000;

const {
	LDAP_SERVER_URL: ldapServerUrl,
	LDAP_SERVER_SEARCHBASE: ldapServerSearchBase,
} = process.env;

let currentUsers = {};
const adminApprovedUsers = new Map();

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

if (ldapServerUrl && ldapServerSearchBase) {
	console.log(
		`configure ldap auth [url=${ldapServerUrl}] [searchBase=${ldapServerSearchBase}]`,
	);
	passport.use(
		new LdapStrategy({
			server: {
				url: ldapServerUrl,
				searchBase: ldapServerSearchBase,
				searchFilter: "(uid={{username}})",
			},
			// form post requestBody field names
			usernameField: "username",
			passwordField: "password",
		}),
	);
} else {
	console.log(
		`skip ldap config. no env configured (LDAP_SERVER_URL and LDAP_SERVER_SEARCHBASE are required).`,
	);
}

console.log(
	`configure adminApprovedUser auth. add users with the admin board.`,
);
passport.use(
	new LocalStrategy(
		{
			session: true,
			// form post requestBody field names
			usernameField: "username",
			passwordField: "password",
		},
		function (username, password, done) {
			const approvedUser = adminApprovedUsers.get(username);
			if (approvedUser && approvedUser.password === password) {
				done(null, approvedUser);
			} else if (process.env.NODE_ENV === "development") {
				if (!currentUsers.hasOwnProperty(username)) {
					currentUsers[username] = { mail: username, cn: username, synyxNickname: username };
					setTimeout(() => removeUser(username), SESSION_TIMEOUT);
					done (null, currentUsers[username]);
				} else {
					done(null, false);
				}
			} else {
				done(null, false);
			}
		},
	),
);

const removeUser = function (username) {
	if (currentUsers.hasOwnProperty(username)) {
		console.log(`removing user ${username}`)
		delete currentUsers[username];
	}
};

module.exports = function (app) {
	app.use(session({
		maxAge: SESSION_TIMEOUT
	}, app));
	app.use(passport.initialize());
	app.use(passport.session());

	// ensure authenticated access
	app.use(async function (context, next) {
		if (
			context.originalUrl.startsWith("/login") ||
			context.originalUrl.startsWith("/css/") ||
			context.originalUrl.startsWith("/computer.svg") ||
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

module.exports.addAdminApprovedUser = function addAdminApprovedUser({
	cn,
	email,
	synyxNickname,
}) {
	const password = crypto.randomBytes(20).toString("hex").substring(0, 16);
	adminApprovedUsers.set(synyxNickname, {
		cn,
		mail: email,
		synyxNickname,
		password,
	});
};

module.exports.getAdminApprovedUsers = function getAdminApprovedUsers() {
	return [...adminApprovedUsers.values()];
};

module.exports.removeUser = removeUser;
