module.exports = function conference({ send, broadcast }) {
	return function (type, data) {
		switch (type) {
			case "toilet-flush": {
				broadcast({
					type: "toilet-flush",
					content: {
						roomName: data.roomName,
						userName: data.userName,
					},
				});
				break;
			}
			case "toilet-fart": {
				broadcast({
					type: "toilet-fart",
					content: {
						sound: data.sound,
						roomName: data.roomName,
						userName: data.userName,
					},
				});
			}
		}
	};
};
