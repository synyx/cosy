const session = require("koa-session");
const passport = require("koa-passport");
const LdapStrategy = require("passport-ldapauth");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const {
	LDAP_SERVER_URL: ldapServerUrl,
	LDAP_SERVER_SEARCHBASE: ldapServerSearchBase,
} = process.env;

let localUsers = {};
const adminApprovedUsers = new Map();

const localUsersFilePath = path.resolve(__dirname, "../../../local-users.json");
try {
	const localUsersFile = fs.readFileSync(localUsersFilePath, "utf8");
	localUsers = JSON.parse(localUsersFile);
} catch (error) {
	console.log(
		`[WARN] could not load local user file '${localUsersFilePath}'. Only Ldap is active now.`,
	);
}

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
				console.log(`check local auth [usernames=${Object.keys(localUsers)}]`);
				const user = localUsers[username];
				if (user) {
					done(null, user);
				} else {
					done(null, false);
				}
			} else {
				done(null, false);
			}
		},
	),
);

module.exports = function (app) {
	app.use(session({}, app));
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
