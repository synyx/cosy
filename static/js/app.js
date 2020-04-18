import * as chat from "./jitsi.js";

const { player } = window.synyxoffice;
const playerAvatar = document.getElementById("player");
const actionMenu = document.getElementById("action-menu");

const nameTooltip = document.createElement("div");
nameTooltip.classList.add(
	"fixed",
	"z-40",
	"px-1",
	"text-black",
	"text-xs",
	"shadow-outline",
	"font-bold",
	"font-mono",
	"bg-white",
	"opacity-75",
	"border",
	"border-black",
	"rounded",
);
document.body.appendChild(nameTooltip);
document.body.style.overflow = "hidden";

document.addEventListener(
	"wheel",
	function (event) {
		if (!event.altKey) {
			return;
		}
		const currentScaleValue = /\((.+)\)/.exec(officeSvg.style.transform)[1];
		if (event.deltaY < 0) {
			// zoom in
			const nextScaleValue = Number(currentScaleValue) + 0.1;
			if (nextScaleValue <= 3.5) {
				officeSvg.style.transform = `scale(${nextScaleValue})`;
			}
		} else {
			// zoom out
			const nextScaleValue = Number(currentScaleValue) - 0.1;
			if (nextScaleValue >= 1) {
				officeSvg.style.transform = `scale(${nextScaleValue})`;
			}
		}
	},
	{ passive: true },
);

const officeSvg = document.getElementById("office");
officeSvg.style.transform = "scale(1)";

officeSvg.addEventListener("mousemove", function (event) {
	if (event.target.dataset.tooltip && actionMenu.classList.contains("hidden")) {
		const { pageX: x, pageY: y } = event;
		nameTooltip.innerText = event.target.dataset.tooltip;
		const { width, height } = nameTooltip.getBoundingClientRect();
		nameTooltip.style.top = `${y - height * 1.5}px`;
		nameTooltip.style.left = `${x - width / 2}px`;
	} else {
		nameTooltip.innerText = "";
		nameTooltip.style.top = "-10px";
		nameTooltip.style.left = "-10px";
	}
});

document.body.addEventListener("click", (event) => {
	if (actionMenu.contains(event.target)) {
		//
	} else if (event.target === playerAvatar) {
		stopPlayerAvatarAnimate();
		actionMenu.classList.remove("hidden");

		const { pageX: x, pageY: y } = event;
		const { width, height } = actionMenu.getBoundingClientRect();
		actionMenu.style.top = `${y + 20}px`;
		actionMenu.style.left = `${x - width / 2}px`;
	} else {
		actionMenu.classList.add("hidden");
	}
});

document.getElementById("start-chat").addEventListener("click", (event) => {
	const random = () => Math.random().toString(36).substr(2, 5);
	const roomName = `${currentRoom.id}-${random()}-${random()}-${random()}`;
	// TODO enable real jitsi chat
	// chat.startChat({ roomName });
	send({
		type: "chat-started",
		content: {
			moderator: player.name,
			roomName,
			point: {
				x: playerAvatar.cx.baseVal.value,
				y: playerAvatar.cy.baseVal.value,
			},
		},
	});
});

document
	.getElementById("logout-form")
	.addEventListener("submit", function (event) {
		if (!window.confirm("Schon gebucht?!")) {
			event.preventDefault();
			document.activeElement.blur();
		}
	});

// Create WebSocket connection.
// TODO use 'wss' protocol to enable SSL over websocket
const socket = new WebSocket(`ws://${window.location.host}`);

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
			newPlayerAvatar.dataset.tooltip = newPlayer.name;
			newPlayerAvatar.setAttributeNS(null, "id", "");
			newPlayerAvatar.setAttributeNS(null, "cx", startPointMainEntrance.x);
			newPlayerAvatar.setAttributeNS(null, "cy", startPointMainEntrance.y);
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

		case "chat-started": {
			const { moderator, roomName, point } = data.content;
			console.log("chatStarted", data.content);

			const circle = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"circle",
			);
			circle.setAttributeNS(null, "cx", point.x);
			circle.setAttributeNS(null, "cy", point.y);
			circle.setAttributeNS(null, "r", "50");
			circle.setAttributeNS(null, "fill", "lime");
			circle.setAttributeNS(null, "fill-opacity", "0.25");

			circle.dataset.chatRoomName = roomName;

			circle.innerHTML = `
				<animate attributeType="SVG" attributeName="r" begin="0s" dur="3.5s" repeatCount="indefinite" from="0" to="66"/>
				<animate attributeType="CSS" attributeName="stroke-width" begin="0s"  dur="3.5s" repeatCount="indefinite" from="10" to="0" />
				<animate attributeType="CSS" attributeName="opacity" begin="0s"  dur="3.5s" repeatCount="indefinite" from="1" to="0"/>
			`;

			playerAvatar.parentNode.insertBefore(circle, playerAvatar);
			break;
		}
	}
});

function send(data) {
	socket.send(JSON.stringify(data));
}

let moveSteps = 1;
let moveStepsFactor = 1;
const startPointMainEntrance = { x: 799, y: 692 };
const playerAvatarImagePattern = document.getElementById(
	"player-avatar-image-pattern",
);
const floors = [...document.querySelectorAll("path[id^=floor-]")].map((floor) =>
	pathToPolyglot(floor),
);
const pillars = [
	...document.querySelectorAll("path[id^=pillar-]"),
].map((pillar) => pathToPolyglot(pillar));
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

animatePlayerAvatar();

const keyCodes = Object.freeze({
	w: 87,
	a: 65,
	s: 83,
	d: 68,
	arrowUp: 38,
	arrowDown: 40,
	arrowLeft: 37,
	arrowRight: 39,
	byCode: (code) => Object.keys(keyCodes).find((key) => keyCodes[key] === code),
});

let movementInterval;
const keyPressedMap = new Map();

document.addEventListener("keyup", function (event) {
	if (!event.shiftKey) {
		keyPressedMap.delete("shift");
	}
	keyPressedMap.delete(keyCodes.byCode(event.keyCode));
	if (keyPressedMap.size === 0) {
		stopMovementLoop();
	}
});

function stopMovementLoop() {
	window.clearInterval(movementInterval);
	keyPressedMap.clear();
}

document.addEventListener("keydown", function (event) {
	if (event.shiftKey) {
		keyPressedMap.set("shift", true);
	}
	const key = keyCodes.byCode(event.keyCode);
	if (key) {
		if (keyPressedMap.size === 0) {
			stopPlayerAvatarAnimate();
			movementInterval = window.setInterval(move, 20);
		}
		keyPressedMap.set(key, true);
	}
});

function animatePlayerAvatar(times = 0) {
	const playerHint = document.getElementById("player-hint");
	for (let animate of playerHint.querySelectorAll("animate")) {
		animate.setAttributeNS(null, "repeatCount", times ? times : "indefinite");
	}
}

function stopPlayerAvatarAnimate() {
	const playerHint = document.getElementById("player-hint");
	const promises = [...playerHint.querySelectorAll("animate")].map(
		(animate) =>
			new Promise((resolve) => {
				animate.addEventListener(
					"repeatEvent",
					() => {
						event.preventDefault();
						event.stopImmediatePropagation();
						animate.setAttributeNS(null, "repeatCount", "0");
						resolve();
					},
					{ once: true },
				);
			}),
	);
	Promise.all(promises).then(() => {
		playerHint.classList.add("hidden");
	});
}

function move() {
	moveStepsFactor = keyPressedMap.has("shift") ? 2 : 1;

	if (keyPressedMap.has("arrowDown") || keyPressedMap.has("s")) {
		moveDown();
	}
	if (keyPressedMap.has("arrowUp") || keyPressedMap.has("w")) {
		moveUp();
	}
	if (keyPressedMap.has("arrowLeft") || keyPressedMap.has("a")) {
		moveLeft();
	}
	if (keyPressedMap.has("arrowRight") || keyPressedMap.has("d")) {
		moveRight();
	}

	send({
		type: "moved",
		content: {
			x: playerAvatar.cx.baseVal.value,
			y: playerAvatar.cy.baseVal.value,
		},
	});
}

function moveDown() {
	const nextX = playerAvatar.cx.baseVal.value;
	const nextY = playerAvatar.cy.baseVal.value + moveSteps * moveStepsFactor;
	doMovement({ nextX, nextY });
}

function moveUp() {
	const nextX = playerAvatar.cx.baseVal.value;
	const nextY = playerAvatar.cy.baseVal.value - moveSteps * moveStepsFactor;
	doMovement({ nextX, nextY });
}

function moveLeft() {
	const nextX = playerAvatar.cx.baseVal.value - moveSteps * moveStepsFactor;
	const nextY = playerAvatar.cy.baseVal.value;
	doMovement({ nextX, nextY });
}

function moveRight() {
	const nextX = playerAvatar.cx.baseVal.value + moveSteps * moveStepsFactor;
	const nextY = playerAvatar.cy.baseVal.value;
	doMovement({ nextX, nextY });
}

function doMovement({ nextX, nextY }) {
	const pillar = getIntersectingPillar([
		nextX,
		nextY,
		playerAvatar.r.baseVal.value,
	]);
	if (pillar) {
		return;
	}

	let isStillInRoom = circleFullyInsidePolygon(
		[nextX, nextY, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	const updateCoordinates = () => {
		// player pulse circle
		const playerHint = document.getElementById("player-hint");
		playerHint.cx.baseVal.value = nextX;
		playerHint.cy.baseVal.value = nextY;
		// player avatar circle
		playerAvatar.cx.baseVal.value = nextX;
		playerAvatar.cy.baseVal.value = nextY;
	};

	if (isStillInRoom) {
		updateCoordinates();
	} else {
		const rooms = getIntersectingFloors([
			nextX,
			nextY,
			playerAvatar.r.baseVal.value,
		]);
		if (rooms.length > 1) {
			updateCoordinates();
			return;
		}
		const door = getIntersectingDoor([
			nextX,
			nextY,
			playerAvatar.r.baseVal.value,
		]);
		if (door) {
			const { allowedUsers = "" } = door.polygon.element.dataset;
			if (
				!allowedUsers ||
				allowedUsers.includes(window.synyxoffice.player.email)
			) {
				updateCoordinates();
			} else if (allowedUsers) {
				window.alert(`Hey! hier kommt nur ${allowedUsers} durch!`);
				stopMovementLoop();
			}
		}
	}

	updateCurrentRoom();
}

function getIntersectingPillar(nextPlayer) {
	return pillars.find((pillar) => {
		return circleTouchesPolygonEdges(nextPlayer, pillar.polygon.points);
	});
}

function getIntersectingDoor(nextPlayer) {
	return doors.find((door) => {
		return circleTouchesPolygonEdges(nextPlayer, door.polygon.points);
	});
}

function getIntersectingFloors(nextPlayer) {
	return floors.filter((floor) => {
		return circleTouchesPolygonEdges(nextPlayer, floor.polygon.points);
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

	for (let [key, value] of Object.entries(path.dataset)) {
		polygon.dataset[key] = value;
	}

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
