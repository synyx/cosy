console.log("hello from JavaScript");

// Create WebSocket connection.
const socket = new WebSocket("ws://localhost:3000");

// Connection opened
socket.addEventListener("open", function (event) {
	socket.send("Hello Server!");

	const message = JSON.stringify({
		type: "login",
		message: {
			user: "John " + new Date().getTime(),
		},
	});

	socket.send(message);
});

// Listen for messages
socket.addEventListener("message", function (event) {
	console.log("Message from server ", event.data);
});

function randomName() {
	const names = [];

	const number = Math.floor(Math.random() * 6) + 1;
}

document.addEventListener("keydown", function (event) {
	if (event.key === "ArrowUp") {
		moveUp();
	} else if (event.key === "ArrowDown") {
		moveDown();
	} else if (event.key === "ArrowLeft") {
		moveLeft();
	} else if (event.key === "ArrowRight") {
		moveRight();
	}
});

const moveSteps = 2;
const playerAvatar = document.getElementById("player");

/// ---------------------------------------
// https://stackoverflow.com/questions/53393966/convert-svg-path-to-polygon-coordinates
//
const floors = [...document.querySelectorAll("path[id^=floor_]")].map((floor) =>
	pathToPolyglot(floor),
);

function pathToPolyglot(path) {
	var len = path.getTotalLength();
	var points = [];

	// var NUM_POINTS = 6;
	var NUM_POINTS = Math.round(len / 10);

	for (var i = 0; i < NUM_POINTS; i++) {
		var pt = path.getPointAtLength((i * len) / (NUM_POINTS - 1));
		points.push([pt.x, pt.y]);
	}

	let polygon = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"polygon",
	);
	polygon.setAttributeNS(null, "id", path.id);
	polygon.setAttributeNS(null, "fill", "tomato");
	polygon.setAttributeNS(null, "points", pointCommandsToSVGPoints(points));
	path.parentNode.replaceChild(polygon, path);

	return {
		id: path.id,
		polygon: {
			element: polygon,
			points,
		},
	};
}
/// ---------------------------------------

let currentRoom = floors.find((floor) => {
	let yep = pointInPolygon(
		[
			playerAvatar.cx.baseVal.value,
			playerAvatar.cy.baseVal.value,
			playerAvatar.r.baseVal.value,
		],
		floor.polygon.points,
	);
	console.log({ yep, floor });
	return yep;
});

// let nullpointerPoints = pathToPoints(nullpointer.pathSegList);
// let polygonSVGPoints = pointCommandsToSVGPoints(nullpointerPoints);

// let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
// polygon.setAttributeNS(null, "fill", "lime");
// polygon.setAttributeNS(null, "points", polygonSVGPoints);
// nullpointer.parentNode.replaceChild(polygon, nullpointer);

let walls = [...document.querySelectorAll("#invisible-walls > line")].map(
	(line) => {
		let x1 = Number(line.getAttribute("x1"));
		let y1 = Number(line.getAttribute("y1"));
		let x2 = Number(line.getAttribute("x2"));
		let y2 = Number(line.getAttribute("y2"));
		return [
			[x1, y1],
			[x2, y2],
		];
	},
);

function moveDown() {
	const nextCy = playerAvatar.cy.baseVal.value + moveSteps;

	let isStillInRoom = circleFullyInsidePolygin(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cy.baseVal.value = nextCy;
	}
}

function moveUp() {
	const nextCy = playerAvatar.cy.baseVal.value - moveSteps;

	let isStillInRoom = circleFullyInsidePolygin(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cy.baseVal.value = nextCy;
	}
}

function moveLeft() {
	const nextCx = playerAvatar.cx.baseVal.value - moveSteps;

	let isStillInRoom = circleFullyInsidePolygin(
		[nextCx, playerAvatar.cy.baseVal.value, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cx.baseVal.value = nextCx;
	}
}

function moveRight() {
	const nextCx = playerAvatar.cx.baseVal.value + moveSteps;

	let isStillInRoom = circleFullyInsidePolygin(
		[nextCx, playerAvatar.cy.baseVal.value, playerAvatar.r.baseVal.value],
		currentRoom.polygon.points,
	);

	if (isStillInRoom) {
		playerAvatar.cx.baseVal.value = nextCx;
	}
}

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

// function pointInPolygon(point, polygon) {
// 	for (let n = polygon.length, i = 0, j = n - 1; i < n; j = i++) {
// 		let touchesBorder = intersects(point, [[polygon[i], polygon[j]]]);
// 		if (touchesBorder) {
// 			return false;
// 		}
// 	}
// 	return true;
// }

function circleFullyInsidePolygin(circle, polygon) {
	const edges = polygonEdges(polygon);
	const touchesEdges = edges.some(function (line) {
		const radius = circle[2];
		const distance = pointLineSegmentDistance(circle, line);
		console.log({ radius, distance, line });
		return distance < radius;
	});

	if (touchesEdges) {
		console.log("touches an edge");
		return false;
	}

	const withinPolygon = pointInPolygon(circle, polygon);
	return withinPolygon;
}

function polygonEdges(polygon) {
	return polygon.map(function (p, i) {
		return i ? [polygon[i - 1], p] : [polygon[polygon.length - 1], p];
	});
}

// function intersects(circle, lines) {
// 	return lines.some(function (line) {
// 		return pointLineSegmentDistance(circle, line) < circle[2];
// 	});
// }

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
