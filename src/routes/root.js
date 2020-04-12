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
			console.log(":: root", ctx.state.user);
			await ctx.render("index", {
				csrf: ctx.csrf,
				email: ctx.state.user.email,
				name: ctx.state.user.username,
				nickname: ctx.state.user.nickname,
			});
		}),
	);

	app.ws.use((ctx) => {
		// `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
		// the websocket is added to the context on `ctx.websocket`.
		ctx.websocket.send("Hello World");
		ctx.websocket.on("message", function (message) {
			// do something with the message from client
			console.log(message);

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
