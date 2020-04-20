const route = require("koa-route");
const websockify = require("koa-websocket");
const gravatarUrl = require("gravatar-url");

const conference = require("../websocket/conference");
const whiteboard = require("../websocket/whiteboard");

let users = [];

function user(internalAppUser) {
	return {
		name: internalAppUser.username,
		nickname: internalAppUser.nickname,
		avatarUrl: internalAppUser.email
			? gravatarUrl(internalAppUser.email, { size: 64 })
			: "",
	};
}

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
				player: {
					name: context.state.user.username,
					email: context.state.user.email,
					avatarUrl: gravatarUrl(context.state.user.email, { size: 64 }),
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

	// attach broadcast helper to websocket
	// to send a message to all connected clients
	app.ws.use((context, next) => {
		context.websocket.broadcast = function (data) {
			app.ws.server.clients.forEach(function each(client) {
				client.send(data);
			});
		};
		return next(context);
	});

	app.ws.use((context) => {
		function broadcast(data) {
			const stringified = JSON.stringify(data);
			// console.log("websocket BROADCAST", stringified);
			context.websocket.broadcast(stringified);
		}

		function send(data) {
			const stringified = JSON.stringify(data);
			// console.log("websocket SEND", stringified);
			context.websocket.send(stringified);
		}

		const conferenceActions = conference({ send, broadcast });
		const whiteboardActions = whiteboard({ send, broadcast });

		context.websocket.on("close", function () {
			const currentUser = user(context.state.user);
			users = users.filter((u) => u.name !== currentUser.name);
			broadcast({
				type: "user-left",
				content: currentUser,
			});
		});

		context.websocket.on("message", function (message) {
			// do something with the message from client
			// console.log("websocket RECEIVED", message);

			let messageJson;
			try {
				messageJson = JSON.parse(message);
			} catch (error) {
				console.log("FAILED to parse message:", message);
			}

			if (!messageJson) {
				return;
			}

			const loggedInUser = context.state.user;
			const { type, content } = messageJson;

			conferenceActions(type, content);
			whiteboardActions(type, content);

			switch (type) {
				case "join": {
					// inform the new user about all current users
					for (let user of users) {
						send({ type: "user-joined", content: user });
					}
					// add new user and broadcast it to every client
					let newUser = user(loggedInUser);
					users.push(newUser);
					broadcast({ type: "user-joined", content: newUser });
					break;
				}
				case "moved": {
					const user = users.find(
						(user) => user.name === loggedInUser.username,
					);
					if (user) {
						const position = content;
						user.position = { x: position.x, y: position.y };
						broadcast({ type: "user-moved", content: user });
					}
					break;
				}
			}
		});
	});
};
