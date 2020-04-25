const route = require("koa-route");
const {
	addAdminApprovedUser,
	getAdminApprovedUsers,
} = require("../security/authentication");

module.exports = function (app) {
	function auth(callback) {
		return function (context) {
			if (context.state.user.email !== "seber@synyx.de") {
				context.response.status = 403;
				return context.render("403");
			}
			return callback(context);
		};
	}

	app.use(
		route.get(
			"/admin",
			auth(function (context) {
				const players = getAdminApprovedUsers();
				return context.render("admin", {
					csrf: context.csrf,
					players,
				});
			}),
		),
	);

	app.use(
		route.get(
			"/admin/users",
			auth(function (context) {
				const players = getAdminApprovedUsers();
				return context.render("admin", {
					csrf: context.csrf,
					players,
				});
			}),
		),
	);

	app.use(
		route.post(
			"/admin/users",
			auth(function (context) {
				const { cn, email, synyxNickname } = context.request.body;

				if (!cn || !email || !synyxNickname) {
					return context.render("admin", {
						csrf: context.csrf,
						players: getAdminApprovedUsers(),
						error: true,
						cn,
						email,
						synyxNickname,
					});
				}

				addAdminApprovedUser({ cn, email, synyxNickname });
				context.response.redirect("/admin");
			}),
		),
	);
};
