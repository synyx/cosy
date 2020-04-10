const path = require("path");
const Koa = require("koa");
const serve = require("koa-static");
const websockify = require("koa-websocket");

const app = websockify(new Koa());

const assetsRootDir = path.resolve(__dirname, "../static");
app.use(serve(assetsRootDir));

let users = [];

function user(username) {
	return {
		name: username,
	};
}

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
			console.log("FAILED to parse message");
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

app.listen(3000, () => {
	console.log("server is listening in http://localhost:3000");
});
