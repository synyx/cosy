// ================================================================
// jitsi prototype
// ================================================================

(function () {
	const jitsiButton = document.getElementById("jitsi-button");

	const root = document.getElementById("chat-root");
	root.style.transition = "background 1s ease-out";
	root.style.backgroundColor = "rgba(0,0,0,0)";

	const rootInner = document.getElementById("chat-root-inner");

	jitsiButton.addEventListener("click", (event) => {
		jitsiButton.blur();

		root.style.backgroundColor = "rgba(0,0,0,0.25)";
		root.classList.add("z-50");

		rootInner.style.transition = "height 0.3s ease-out, width 0.3s ease-out";
		rootInner.classList.add("w-full", "h-full");

		setTimeout(function () {
			rootInner.classList.add("w-full");
			rootInner.style.height = "100%";
		}, 0);
	});

	const closeChatButton = document.getElementById("close-chat-button");
	closeChatButton.addEventListener("click", function (event) {
		closeChatButton.blur();

		root.style.backgroundColor = "rgba(0,0,0,0)";
		root.classList.remove("z-50", "w-full");

		rootInner.style.transition = "";
		rootInner.style.height = "";

		rootInner.classList.remove("w-full", "h-full");
	});
})();

// ================================================================
// GAME
// ================================================================

// Create WebSocket connection.
// TODO use 'wss' protocol to enable SSL over websocket
const socket = new WebSocket("ws://localhost:3000");

let playerAvatarMap = new Map();

// Connection opened
socket.addEventListener("open", function (event) {
	socket.send(
		JSON.stringify({
			type: "join",
			message: {},
		}),
	);
});

// Listen for messages
socket.addEventListener("message", function (event) {
	console.log("ws message", event.data);

	const data = JSON.parse(event.data);

	switch (data.type) {
		case "user-joined": {
			const newPlayer = data.content;
			if (newPlayer.name === window.synyxoffice.player.name) {
				return;
			}
			console.log("new player joined", newPlayer);

			// avatar image
			const newPlayerAvatarImagePattern = playerAvatarImagePattern.cloneNode(
				true,
			);
			newPlayerAvatarImagePattern.setAttributeNS(
				null,
				"id",
				`${newPlayer.nickname}-image-pattern`,
			);
			newPlayerAvatarImagePattern
				.querySelector("image")
				.setAttributeNS(null, "href", newPlayer.avatarUrl);
			playerAvatarImagePattern.parentNode.appendChild(
				newPlayerAvatarImagePattern,
			);

			// avatar element
			const newPlayerAvatar = playerAvatar.cloneNode();
			newPlayerAvatar.setAttributeNS(null, "id", "");
			newPlayerAvatar.setAttributeNS(
				null,
				"fill",
				newPlayerAvatar
					.getAttributeNS(null, "fill")
					.replace(
						"#player-avatar-image-pattern",
						`#${newPlayer.nickname}-image-pattern`,
					),
			);
			if (newPlayer.position) {
				newPlayerAvatar.cx.baseVal.value = newPlayer.position.x;
				newPlayerAvatar.cy.baseVal.value = newPlayer.position.y;
			}
			playerAvatar.parentNode.appendChild(newPlayerAvatar);
			playerAvatarMap.set(newPlayer.name, newPlayerAvatar);
			break;
		}

		case "user-moved": {
			const player = data.content;
			if (player.name === window.synyxoffice.player.name) {
				return;
			}
			console.log("player moved", player);
			const playerAvatar = playerAvatarMap.get(player.name);
			playerAvatar.cx.baseVal.value = player.position.x;
			playerAvatar.cy.baseVal.value = player.position.y;
			break;
		}

		case "user-left": {
			const player = data.content;
			console.log("player left", player);
			const avatar = playerAvatarMap.get(player.name);
			avatar.remove();
			playerAvatarMap.delete(player.name);
			break;
		}
	}
});

function send(data) {
	socket.send(JSON.stringify(data));
}

let moveSteps = 2;
let moveStepsFactor = 1;
const playerAvatar = document.getElementById("player");
const playerAvatarImagePattern = document.getElementById(
	"player-avatar-image-pattern",
);
const floors = [...document.querySelectorAll("path[id^=floor-]")].map((floor) =>
	pathToPolyglot(floor),
);
const doors = [...document.querySelectorAll("path[id^=door-]")].map((floor) =>
	pathToPolyglot(floor, { precision: 0.3, color: "black" }),
);

let currentRoom = floors.find((floor) => {
	let yep = pointInPolygon(
		[
			playerAvatar.cx.baseVal.value,
			playerAvatar.cy.baseVal.value,
			playerAvatar.r.baseVal.value,
		],
		floor.polygon.points,
	);
	return yep;
});

document.addEventListener("keydown", function (event) {
	if (event.key === "Shift") {
		moveStepsFactor = 2;
	} else if (event.key === "ArrowUp") {
		moveUp();
	} else if (event.key === "ArrowDown") {
		moveDown();
	} else if (event.key === "ArrowLeft") {
		moveLeft();
	} else if (event.key === "ArrowRight") {
		moveRight();
	}

	if (event.key.startsWith("Arrow")) {
		send({
			type: "moved",
			content: {
				x: playerAvatar.cx.baseVal.value,
				y: playerAvatar.cy.baseVal.value,
			},
		});
	}
});

document.addEventListener("keyup", function (event) {
	if (event.key === "Shift") {
		moveStepsFactor = 1;
	}
});

function moveDown() {
	const nextCy = playerAvatar.cy.baseVal.value + moveSteps * moveStepsFactor;

	let isStillInRoom = circleFullyInsidePolygon(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cy.baseVal.value = nextCy;
	} else {
		const door = getIntersectingDoor([
			playerAvatar.cx.baseVal.value,
			nextCy,
			playerAvatar.r.baseVal.value,
		]);
		if (door) {
			playerAvatar.cy.baseVal.value = nextCy;
		}
	}

	updateCurrentRoom();
}

function moveUp() {
	const nextCy = playerAvatar.cy.baseVal.value - moveSteps * moveStepsFactor;

	let isStillInRoom = circleFullyInsidePolygon(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cy.baseVal.value = nextCy;
	} else {
		const door = getIntersectingDoor([
			playerAvatar.cx.baseVal.value,
			nextCy,
			playerAvatar.r.baseVal.value,
		]);
		if (door) {
			playerAvatar.cy.baseVal.value = nextCy;
		}
	}

	updateCurrentRoom();
}

function moveLeft() {
	const nextCx = playerAvatar.cx.baseVal.value - moveSteps * moveStepsFactor;

	let isStillInRoom = circleFullyInsidePolygon(
		[nextCx, playerAvatar.cy.baseVal.value, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cx.baseVal.value = nextCx;
	} else {
		const door = getIntersectingDoor([
			nextCx,
			playerAvatar.cy.baseVal.value,
			playerAvatar.r.baseVal.value,
		]);
		if (door) {
			playerAvatar.cx.baseVal.value = nextCx;
		}
	}

	updateCurrentRoom();
}

function moveRight() {
	const nextCx = playerAvatar.cx.baseVal.value + moveSteps * moveStepsFactor;

	let isStillInRoom = circleFullyInsidePolygon(
		[nextCx, playerAvatar.cy.baseVal.value, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cx.baseVal.value = nextCx;
	} else {
		const door = getIntersectingDoor([
			nextCx,
			playerAvatar.cy.baseVal.value,
			playerAvatar.r.baseVal.value,
		]);
		if (door) {
			playerAvatar.cx.baseVal.value = nextCx;
		}
	}

	updateCurrentRoom();
}

function getIntersectingDoor(nextPlayer) {
	return doors.find((door) => {
		return circleTouchesPolygonEdges(nextPlayer, door.polygon.points);
	});
}

function updateCurrentRoom() {
	const nextCurrentRoom = floors.find((floor) => {
		return pointInPolygon(
			[
				playerAvatar.cx.baseVal.value,
				playerAvatar.cy.baseVal.value,
				playerAvatar.r.baseVal.value,
			],
			floor.polygon.points,
		);
	});

	// no room found -> we're crossing a door right now

	if (nextCurrentRoom) {
		currentRoom = nextCurrentRoom;
	}
}

/// ---------------------------------------
// https://stackoverflow.com/questions/53393966/convert-svg-path-to-polygon-coordinates
//
function pathToPolyglot(path, { precision = 0.2, color = "tomato" } = {}) {
	var len = path.getTotalLength();
	var points = [];

	var NUM_POINTS = Math.round(len * precision);

	for (var i = 0; i < NUM_POINTS; i++) {
		var pt = path.getPointAtLength((i * len) / (NUM_POINTS - 1));
		points.push([pt.x, pt.y]);
	}

	let polygon = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"polygon",
	);
	polygon.setAttributeNS(null, "id", path.id);
	polygon.setAttributeNS(null, "fill", color);
	polygon.setAttributeNS(null, "points", pointCommandsToSVGPoints(points));
	// path.parentNode.replaceChild(polygon, path);

	return {
		id: path.id,
		polygon: {
			element: polygon,
			points,
		},
	};
}
/// ---------------------------------------

function pointInPolygon(point, polygon) {
	for (
		var n = polygon.length,
			i = 0,
			j = n - 1,
			x = point[0],
			y = point[1],
			inside = false;
		i < n;
		j = i++
	) {
		var xi = polygon[i][0],
			yi = polygon[i][1],
			xj = polygon[j][0],
			yj = polygon[j][1];
		if ((yi > y) ^ (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
			inside = !inside;
	}
	return inside;
}

function circleFullyInsidePolygon(circle, polygon) {
	const touchesEdges = circleTouchesPolygonEdges(circle, polygon);
	if (touchesEdges) {
		return false;
	}

	const withinPolygon = pointInPolygon(circle, polygon);
	return withinPolygon;
}

function circleTouchesPolygonEdges(circle, polygon) {
	const edges = polygonEdges(polygon);
	const touchesEdges = edges.some(function (line) {
		const radius = circle[2];
		const distance = pointLineSegmentDistance(circle, line);
		return distance < radius;
	});

	return touchesEdges;
}

function polygonEdges(polygon) {
	return polygon.map(function (p, i) {
		return i ? [polygon[i - 1], p] : [polygon[polygon.length - 1], p];
	});
}

function pointLineSegmentDistance(point, line) {
	var v = line[0],
		w = line[1],
		d,
		t;
	return Math.sqrt(
		pointPointSquaredDistance(
			point,
			// eslint-disable-next-line no-cond-assign
			(d = pointPointSquaredDistance(v, w))
				? (t =
						((point[0] - v[0]) * (w[0] - v[0]) +
							(point[1] - v[1]) * (w[1] - v[1])) /
						d) < 0
					? v
					: t > 1
					? w
					: [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]
				: v,
		),
	);
}

function pointPointSquaredDistance(v, w) {
	var dx = v[0] - w[0],
		dy = v[1] - w[1];
	return dx * dx + dy * dy;
}

function pointCommandsToSVGPoints(pointCommands) {
	return pointCommands
		.map((value, index) => (index % 2 === 1 ? "," : " ") + value)
		.join("");
}
