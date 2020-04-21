// whiteboard participants an it's cursor position
let whiteboardParticipants = new Map();
// committed points; the final canvas
let whiteboardPoints = [];
// not comitted points (mousedown and still moving it)
let whiteboardOngoingPoints = new Map();

module.exports = function whiteboard({ send, broadcast }) {
	return function (type, data) {
		switch (type) {
			case "whiteboard-user-joined": {
				const { userName } = data;
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
			case "whiteboard-user-left": {
				const { userName } = data;
				whiteboardParticipants.delete(userName);
				broadcast({
					type: "whiteboard-pointer-moved",
					content: {
						// prettier-ignore
						cursors: [...whiteboardParticipants.entries()].map((e) => ({ userName: e[0], ...e[1] }))
					},
				});
				break;
			}
			case "whiteboard-pointer-moved": {
				const { x, y, userName } = data;
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
				const { dots, color, thickness, userName } = data;
				whiteboardOngoingPoints.set(userName, { dots, color, thickness });
				broadcast({
					type: "whiteboard-dots-added",
					content: { dots, color, thickness, userName },
				});
				break;
			}
			case "whiteboard-dots-committed": {
				const { dots, color, thickness, userName } = data;
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
	};
};
