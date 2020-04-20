const route = require("koa-route");
const websockify = require("koa-websocket");
const gravatarUrl = require("gravatar-url");

let users = [];
let chatRooms = new Map();
let chatParticipants = new Map();

// whiteboard participants an it's cursor position
let whiteboardParticipants = new Map();
// committed points; the final canvas
let whiteboardPoints = [];
// not comitted points (mousedown and still moving it)
let whiteboardOngoingPoints = new Map();

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

			switch (messageJson.type) {
				case "join": {
					// inform the new user about all current users
					for (let user of users) {
						send({ type: "user-joined", content: user });
					}
					// inform the new user about all current chats
					for (let room of chatRooms.values()) {
						send({ type: "chat-started", content: room });
						for (let participant of chatParticipants.get(room.roomName)) {
							send({
								type: "chat-user-joined",
								content: {
									roomName: room.roomName,
									userName: participant,
								},
							});
						}
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
						const position = messageJson.content;
						user.position = { x: position.x, y: position.y };
						broadcast({ type: "user-moved", content: user });
					}
					break;
				}
				case "chat-started": {
					const room = {
						roomName: messageJson.content.roomName,
						userName: messageJson.content.userName,
						point: {
							x: messageJson.content.point.x,
							y: messageJson.content.point.y,
						},
					};
					chatRooms.set(room.roomName, room);
					chatParticipants.set(room.roomName, [room.userName]);
					broadcast({ type: "chat-started", content: room });
					broadcast({
						type: "chat-user-joined",
						content: {
							roomName: room.roomName,
							userName: room.userName,
						},
					});
					break;
				}
				case "chat-user-joined": {
					const room = {
						roomName: messageJson.content.roomName,
						userName: messageJson.content.userName,
					};
					const participants = chatParticipants.get(room.roomName);
					participants.push(room.userName);
					chatParticipants.set(room.roomName, participants);
					broadcast({
						type: "chat-user-joined",
						content: {
							roomName: room.roomName,
							userName: room.userName,
						},
					});
					break;
				}
				case "chat-user-left": {
					const room = {
						roomName: messageJson.content.roomName,
						userName: messageJson.content.userName,
					};
					const currentParticipants = chatParticipants.get(room.roomName);
					const nextParticipants = currentParticipants.filter(
						(username) => username !== room.userName,
					);
					if (nextParticipants.length === 0) {
						chatRooms.delete(room.roomName);
						chatParticipants.delete(room.roomName);
						broadcast({ type: "chat-closed", content: room });
					} else {
						chatParticipants.set(room.roomName, nextParticipants);
						broadcast({
							type: "chat-user-left",
							content: {
								roomName: room.roomName,
								userName: room.userName,
							},
						});
					}
					break;
				}
				case "whiteboard-user-joined": {
					const { userName } = messageJson.content;
					for (let { dots, color, thickness } of whiteboardPoints) {
						send({
							type: "whiteboard-dots-committed",
							content: { dots, color, thickness },
						});
					}
					broadcast({
						type: "whiteboard-pointer-moved",
						content: {
							// prettier-ignore
							cursors: [...whiteboardParticipants.entries()].map((e) => ({ userName: e[0], ...e[1] }))
						},
					});
					whiteboardParticipants.set(userName, { x: 0, y: 0 });
					break;
				}
				case "whiteboard-pointer-moved": {
					const { x, y, userName } = messageJson.content;
					whiteboardParticipants.set(userName, { x, y });
					broadcast({
						type: "whiteboard-pointer-moved",
						content: {
							// prettier-ignore
							cursors: [...whiteboardParticipants.entries()].map((e) => ({ userName: e[0], ...e[1] }))
						},
					});
					break;
				}
				case "whiteboard-dots-added": {
					const { dots, color, thickness, userName } = messageJson.content;
					whiteboardOngoingPoints.set(userName, { dots, color, thickness });
					broadcast({
						type: "whiteboard-dots-added",
						content: { dots, color, thickness, userName },
					});
					break;
				}
				case "whiteboard-dots-committed": {
					const { dots, color, thickness, userName } = messageJson.content;
					whiteboardOngoingPoints.delete(userName);
					whiteboardPoints.push({ dots, color, thickness });
					broadcast({
						type: "whiteboard-dots-committed",
						content: {
							dots,
							color,
							thickness,
							userName,
						},
					});
					break;
				}
			}
		});
	});
};
