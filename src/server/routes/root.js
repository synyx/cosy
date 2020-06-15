const debug = require("debug")("cosy:route-root");
const route = require("koa-route");
const websockify = require("koa-websocket");
const { getAvatarUrl } = require("../avatar");

const board = require("../websocket/board");
const { conference, handleUserRemoved } = require("../websocket/conference");

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

		function handleSessionExpired({ username }) {
			debug(`closing websocket connection for username=${username}`);
			context.websocket.close();

			debug(`closing any remaining chats for username=${username}`);
			handleUserRemoved(username, send);
		}

		app.once(`session-expired-${context.state.user.username}`, handleSessionExpired);

		const boardActions = board({ send, broadcast, context });
		const conferenceActions = conference({ send, broadcast });

		context.websocket.on("message", function (message) {
			if (!context.state) {
				debug(`got websocket message for an expired session.`);
				return;
			}

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
