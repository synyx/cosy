const debug = require("debug")("cosy:route-root");
const route = require("koa-route");
const websockify = require("koa-websocket");
const { getAvatarUrl } = require("../avatar");

const board = require("../websocket/board");
const conference = require("../websocket/conference");

const { version } = require("../../../package.json");

module.exports = function (app) {
	app = websockify(app);

	app.use(
		route.get("/", async function (context) {
			await context.render("index", {
				csrf: context.csrf,
				email: context.state.user.email,
				name: context.state.user.username,
				nickname: context.state.user.nickname,
				jitsiDomain: "xxxxxx",
				version,
				player: {
					name: context.state.user.username,
					email: context.state.user.email,
					avatarUrl: getAvatarUrl(context.state.user.email, { size: 64 }),
				},
			});
		}),
	);

	// map session state to websocket context
	// TODO find a better way to access the session.
	// I don't want to know the passport detail here (context.state does not work here whyever)
	app.ws.use((context, next) => {
		context.state = context.session.passport;
		return next(context);
	});

	app.ws.use((context) => {
		function broadcast(data) {
			const stringified = JSON.stringify(data);
			app.ws.server.clients.forEach(function each(client) {
				client.send(stringified);
			});
		}

		function send(data) {
			const stringified = JSON.stringify(data);
			context.websocket.send(stringified);
		}

		function closeWebsocket({ username }) {
			debug(`closing websocket connection for username=${username}`);
			context.websocket.close();
		}

		app.on("session-expired", closeWebsocket);

		const boardActions = board({ send, broadcast, context });
		const conferenceActions = conference({ send, broadcast });

		context.websocket.on("message", function (message) {
			context.app.emit("user-heartbeat", {
				username: context.state.user.username,
			});

			let messageJson;
			try {
				messageJson = JSON.parse(message);
			} catch (error) {
				console.log("FAILED to parse message:", message);
			}

			if (!messageJson) {
				return;
			}

			const { type, content } = messageJson;

			boardActions(type, content);
			conferenceActions(type, content);
		});
	});
};
