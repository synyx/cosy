const gravatarUrl = require("gravatar-url");

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

module.exports = function ({ send, broadcast, context }) {
	context.websocket.on("close", function () {
		const currentUser = user(context.state.user);
		users = users.filter((u) => u.name !== currentUser.name);
		broadcast({
			type: "user-left",
			content: currentUser,
		});
	});

	return function (type, data) {
		const loggedInUser = context.state.user;

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
				const user = users.find((user) => user.name === loggedInUser.username);
				if (user) {
					user.position = { x: data.x, y: data.y };
					broadcast({ type: "user-moved", content: user });
				}
				break;
			}
		}
	};
};
