let chatRooms = new Map();
let chatParticipants = new Map();

const removeUserFromChat = (currentParticipants, room, broadcast) => {
	const nextParticipants = currentParticipants.filter(
		(username) => username !== room.userName,
	);
	if (nextParticipants.length === 0) {
		console.log(
			`chat-user-left :: chat is now empty. closing ${room.roomName}`,
		);
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
};

module.exports.handleUserRemoved = function handleUserRemoved(
	username,
	broadcast,
) {
	for (let room of chatRooms.values()) {
		const currentParticipants = chatParticipants.get(room.roomName);
		for (let participant of currentParticipants) {
			if (participant === username) {
				const data = {
					roomName: room.roomName,
					userName: username,
				};
				removeUserFromChat(currentParticipants, data, broadcast);
			}
		}
	}
};

module.exports.conference = function conference({ send, broadcast }) {
	return function (type, data) {
		switch (type) {
			case "join": {
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
				break;
			}
			case "chat-started": {
				const room = {
					roomName: data.roomName,
					userName: data.userName,
					point: {
						x: data.point.x,
						y: data.point.y,
					},
				};
				console.log(
					`chat-started :: user=${room.userName} room=${room.roomName}`,
				);
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
					roomName: data.roomName,
					userName: data.userName,
				};
				console.log(
					`chat-user-joined :: chat user=${room.userName} room=${room.roomName}`,
				);
				const participants = chatParticipants.get(room.roomName);

				if (!participants) {
					console.log(
						`chat-user-joined :: warning: room=${room.roomName} does not exist!`,
					);
					break;
				}

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
					roomName: data.roomName,
					userName: data.userName,
				};
				console.log(
					`chat-user-left :: chat user=${room.userName} room=${room.roomName}`,
				);
				const currentParticipants = chatParticipants.get(room.roomName);

				if (!currentParticipants) {
					console.log(
						`chat-user-left :: warning: room=${room.roomName} does not exist!`,
					);
					break;
				}

				removeUserFromChat(currentParticipants, room, broadcast);
				break;
			}
		}
	};
};
