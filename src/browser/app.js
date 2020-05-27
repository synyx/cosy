import { createChatActions } from "./actions/chat-action.js";
import { createCoffeeActions } from "./actions/coffee-action.js";
import { createRadioActions } from "./actions/radio-action";
import { createShowerActions } from "./actions/shower-action";
import { createArcadeActions } from "./actions/arcade-action";

const { player } = window.synyxoffice;
const playerAvatar = document.getElementById("player-avatar");
const playerAvatarImagePattern = document.getElementById(
	"player-avatar-image-pattern",
);
const playerAvatarCoordinates = {
	x: playerAvatar.cx.baseVal.value,
	y: playerAvatar.cy.baseVal.value,
};
const actionMenu = document.getElementById("action-menu");
const officeSvg = document.getElementById("office");

let currentlyChatting = false;

const chat = createChatActions({ send, player, officeSvg, playerAvatar });
const coffee = createCoffeeActions({ send, player, officeSvg, playerAvatar });
const radio = createRadioActions({ send, player, officeSvg, playerAvatar });
const shower = createShowerActions({ send, player, officeSvg, playerAvatar });
const arcade = createArcadeActions({ send, player, officeSvg, playerAvatar });

chat.onChatStart(function () {
	currentlyChatting = true;
});
chat.onChatEnd(function () {
	currentlyChatting = false;
});

// Create WebSocket connection.
// eslint-disable-next-line no-undef
const socketProtocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
const socket = new WebSocket(`${socketProtocol}://${window.location.host}`);

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

const actionButtons = new Map();

document.addEventListener("change", (event) => {
	switch (event.target.id) {
		case "show-desks-office": {
			document.getElementById("office_desks").classList.toggle("hidden");
			break;
		}
		case "show-plants": {
			document.getElementById("pflanzen").classList.toggle("hidden");
			break;
		}
		case "show-bins": {
			document.getElementById("office_bin").classList.toggle("hidden");
			break;
		}
		case "show-desks-10vorne": {
			document.getElementById("_10vorne").classList.toggle("hidden");
			document.getElementById("office_table").classList.toggle("hidden");
			break;
		}
		case "show-kueche": {
			document.getElementById("kueche").classList.toggle("hidden");
			break;
		}
		case "show-balkon": {
			document.getElementById("balkon").classList.toggle("hidden");
			break;
		}
		case "show-wohnzimmer": {
			document.getElementById("wohnzimmer").classList.toggle("hidden");
			break;
		}
		case "show-kreativ": {
			document.getElementById("kreativ").classList.toggle("hidden");
			break;
		}
		case "show-office-maedels": {
			document.getElementById("office-maedels").classList.toggle("hidden");
			break;
		}
		case "show-memory": {
			document.getElementById("memory").classList.toggle("hidden");
			break;
		}
		case "show-billard": {
			document.getElementById("billard").classList.toggle("hidden");
			break;
		}
		case "show-nullpointer": {
			document.getElementById("desks-nullpointer").classList.toggle("hidden");
			break;
		}
		case "show-wasser": {
			document.getElementById("desks-wasser").classList.toggle("hidden");
			break;
		}
		case "show-cupboards": {
			document.getElementById("office_cupboard-27").classList.toggle("hidden");
			break;
		}
		case "show-boards": {
			document.getElementById("office_board").classList.toggle("hidden");
			break;
		}
	}
});

document.body.addEventListener("click", (event) => {
	if (actionMenu.contains(event.target)) {
		//
	} else if (event.target === playerAvatar) {
		nameTooltip.innerText = "";
		nameTooltip.style.top = "-10px";
		nameTooltip.style.left = "-10px";
		stopPlayerAvatarAnimate();
		actionMenu.classList.remove("hidden");

		[chat, coffee, radio, shower, arcade].forEach(function ({ actions }) {
			for (let action of actions) {
				if (action.shouldBeVisible({ currentRoom })) {
					if (actionButtons.has(action)) {
						actionButtons.get(action).classList.remove("hidden");
					} else {
						const button = document.createElement("button");
						button.type = "button";
						button.textContent = action.label;
						button.classList.add("p-1");
						button.addEventListener("click", function () {
							action.handleSelect({
								playerAvatar,
								currentRoom,
								attrs: button.dataset,
							});
							button.blur();
							actionMenu.classList.add("hidden");
						});
						for (let [attr, value] of action.attrs()) {
							button.dataset[attr] = value;
						}
						const li = document.createElement("li");
						li.appendChild(button);
						li.classList.add("hover:bg-blue-200");
						actionMenu.appendChild(li);
						actionButtons.set(action, li);
					}
				} else {
					if (actionButtons.has(action)) {
						actionButtons.get(action).classList.add("hidden");
					}
				}
			}
		});

		const { pageX: x, pageY: y } = event;
		const { width, height } = actionMenu.getBoundingClientRect();

		let menuTop = y + 20;
		let menuLeft = x - width / 2;

		if (menuTop + height > window.innerHeight) {
			menuTop = window.innerHeight - height;
		} else if (menuTop < 0) {
			menuTop = 0;
		}
		if (menuLeft + width > window.innerWidth) {
			menuLeft = window.innerHeight - width;
		} else if (menuLeft < 0) {
			menuLeft = 0;
		}

		actionMenu.style.top = `${menuTop}px`;
		actionMenu.style.left = `${menuLeft}px`;
	} else {
		actionMenu.classList.add("hidden");
	}
});

document
	.getElementById("logout-form")
	.addEventListener("submit", function (event) {
		if (!window.confirm("Schon gebucht?!")) {
			event.preventDefault();
			document.activeElement.blur();
		}
	});

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
	const data = JSON.parse(event.data);

	chat.handleWebsocket(data.type, data.content);

	switch (data.type) {
		case "user-joined": {
			const newPlayer = data.content;
			if (newPlayer.name === window.synyxoffice.player.name) {
				return;
			}

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
			newPlayerAvatar.setAttributeNS(null, "transform", "");
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
			playerAvatar.parentNode.insertBefore(newPlayerAvatar, playerAvatar);
			playerAvatarMap.set(newPlayer.name, newPlayerAvatar);
			break;
		}

		case "user-moved": {
			const player = data.content;
			if (player.name === window.synyxoffice.player.name) {
				return;
			}
			const playerAvatar = playerAvatarMap.get(player.name);
			playerAvatar.cx.baseVal.value = player.position.x;
			playerAvatar.cy.baseVal.value = player.position.y;
			break;
		}

		case "user-left": {
			const player = data.content;
			const avatar = playerAvatarMap.get(player.name);
			avatar.remove();
			break;
		}
	}
});

function send(data) {
	if (socket.readyState === 1) {
		// 1 == OPEN
		socket.send(JSON.stringify(data));
	} else {
		socket.addEventListener("open", function () {
			socket.send(JSON.stringify(data));
		});
	}
}

// firefox is much slower than chrome or safari on my machine oO
// therefore just increase size of one step ¯\_(ツ)_/¯
const moveSteps = 2;
let moveStepsFactor = 1;
const startPointMainEntrance = { x: 799, y: 692 };
const floors = [...document.querySelectorAll("path[id^=floor_]")].map((floor) =>
	pathToPolyglot(floor),
);
const doors = [
	...document.querySelectorAll("path[id^=building_door]"),
].map((floor) => pathToPolyglot(floor, { precision: 0.1, color: "black" }));

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

function coroutine(fn) {
	let f = fn();
	f.next();
	return function (data) {
		f.next(data);
	};
}

let movementAllowed = false;

function stopMovementLoop() {
	movementAllowed = false;
}

const moveRoutine = coroutine(function* () {
	// keyUp event stops other keyDown events
	// e.g. you press arrowRight, then arrowUp to move to the top right
	// then your release arrowUp -> keydown for arrowRight is not triggered anymore
	// therefore we have to start a loop here.
	// the loop is stopped as soon as there are no pressed keys anymore
	const keyPressedMap = new Map();

	function rememberPressedKey(event) {
		if (event.shiftKey) {
			keyPressedMap.set("shift", true);
		}
		const key = keyCodes.byCode(event.keyCode);
		if (key) {
			if (keyPressedMap.size === 0) {
				stopPlayerAvatarAnimate();
			}
			keyPressedMap.set(key, true);
		}
	}

	function forgetPressedKey(event) {
		if (!event.shiftKey) {
			keyPressedMap.delete("shift");
		}
		keyPressedMap.delete(keyCodes.byCode(event.keyCode));
	}

	function doMove() {
		if (!movementAllowed) {
			return;
		}
		requestAnimationFrame(function () {
			move(keyPressedMap);
			doMove();
		});
	}

	while (true) {
		// wait for first event
		let event = yield;
		if (!arcade.isRunning && event.type === "keydown") {
			rememberPressedKey(event);
			// start movement loop
			movementAllowed = true;
			doMove();
			while (true) {
				let event = yield;
				if (!arcade.isRunning) {
					if (event.type === "keydown") {
						rememberPressedKey(event);
					} else if (event.type === "keyup") {
						forgetPressedKey(event);
						// and stop movement loop when no key is pressed anymore
						movementAllowed = keyPressedMap.size > 0;
						if (!movementAllowed) {
							// break inner loop so we can start the
							// movement loop from the beginning
							break;
						}
					}
				}
			}
		}
	}
});

document.addEventListener("keydown", moveRoutine);
document.addEventListener("keyup", moveRoutine);

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
				function stop() {
					animate.setAttributeNS(null, "repeatCount", "0");
					resolve();
				}
				// safari doesn't fire the "repeatEvent"
				// therefore just add a 1s fallback ¯\_(ツ)_/¯
				setTimeout(stop, 1000);
				animate.addEventListener(
					"repeatEvent",
					function (event) {
						event.preventDefault();
						event.stopImmediatePropagation();
						stop();
					},
					{ once: true },
				);
			}),
	);
	Promise.all(promises).then(() => {
		playerHint.classList.add("hidden");
	});
}

function move(keyPressedMap) {
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
			x: playerAvatarCoordinates.x,
			y: playerAvatarCoordinates.y,
		},
	});
}

function moveDown() {
	const nextX = playerAvatarCoordinates.x;
	const nextY = playerAvatarCoordinates.y + moveSteps * moveStepsFactor;
	doMovement({ nextX, nextY });
}

function moveUp() {
	const nextX = playerAvatarCoordinates.x;
	const nextY = playerAvatarCoordinates.y - moveSteps * moveStepsFactor;
	doMovement({ nextX, nextY });
}

function moveLeft() {
	const nextX = playerAvatarCoordinates.x - moveSteps * moveStepsFactor;
	const nextY = playerAvatarCoordinates.y;
	doMovement({ nextX, nextY });
}

function moveRight() {
	const nextX = playerAvatarCoordinates.x + moveSteps * moveStepsFactor;
	const nextY = playerAvatarCoordinates.y;
	doMovement({ nextX, nextY });
}

function doMovement({ nextX, nextY }) {
	if (currentlyChatting) {
		return;
	}

	actionMenu.classList.add("hidden");

	let isStillInCurrentRoom = circleFullyInsidePolygon(
		[nextX, nextY, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	const updateCoordinates = () => {
		// player pulse circle
		const playerHint = document.getElementById("player-hint");
		playerHint.cx.baseVal.value = nextX;
		playerHint.cy.baseVal.value = nextY;
		// player avatar circle
		playerAvatarCoordinates.x = nextX;
		playerAvatarCoordinates.y = nextY;
		playerAvatar.cx.baseVal.value = nextX;
		playerAvatar.cy.baseVal.value = nextY;
	};

	if (isStillInCurrentRoom) {
		updateCoordinates();
	} else {
		// get possible next rooom
		const rooms = getIntersectingFloors([
			nextX,
			nextY,
			playerAvatar.r.baseVal.value,
		]);
		if (rooms.length > 1) {
			updateCoordinates();
			return;
		}
		// there is no next room
		// check if we're crossing a door
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
				playerAvatarCoordinates.x,
				playerAvatarCoordinates.y,
				playerAvatar.r.baseVal.value,
			],
			floor.polygon.points,
		);
	});

	// no room found -> we're crossing a door right now

	if (nextCurrentRoom && nextCurrentRoom !== currentRoom) {
		[chat, coffee, radio, shower].forEach(function ({ handleRoomChange }) {
			handleRoomChange({
				previousRoom: currentRoom,
				nextRoom: nextCurrentRoom,
			});
		});
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

	// if (polygon.id === "floor_main") {
	// 	playerAvatar.parentNode.insertBefore(polygon, playerAvatar);
	// }

	// if (polygon.id === "floor_corona") {
	// 	playerAvatar.parentNode.insertBefore(polygon, playerAvatar);
	// }

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
