const route = require("koa-route");
const websockify = require("koa-websocket");

let users = [];

function user(username) {
	return {
		name: username,
	};
}

module.exports = function (app) {
	app = websockify(app);

	app.use(
		route.get("/", async function (ctx) {
			await ctx.render("index", {
				csrf: ctx.csrf,
				email: ctx.state.user.email,
				name: ctx.state.user.username,
				nickname: ctx.state.user.nickname,
			});
		}),
	);

	app.ws.use((ctx) => {
		ctx.websocket.on("message", function (message) {
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
				case "login":
					users.push(user(messageJson.user));
					break;
			}
		});
	});
};
