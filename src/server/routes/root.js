const route = require("koa-route");
const websockify = require("koa-websocket");

let users = [];

function user(internalAppUser) {
	return {
		username: internalAppUser.username,
		nickname: internalAppUser.nickname,
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
			context.websocket.broadcast(JSON.stringify(data));
		}

		function send(data) {
			context.websocket.send(JSON.stringify(data));
		}

		context.websocket.on("message", function (message) {
			// do something with the message from client
			console.log("websocket message:", message);

			let messageJson;
			try {
				messageJson = JSON.parse(message);
			} catch (error) {
				console.log("FAILED to parse message:", message);
			}

			if (!messageJson) {
				return;
			}

			switch (messageJson.type) {
				case "join": {
					// inform the new user about all current users
					for (let user of users) {
						send({ type: "user-joined", content: user });
					}

					// add new user and broadcast it to every client
					let newUser = user(context.state.user);
					users.push(newUser);
					broadcast({ type: "user-joined", content: newUser });
					break;
				}
			}
		});
	});
};
