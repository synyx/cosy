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
const nullpointer = pathToPolyglot(
	document.getElementById("floor_nullpointer"),
);
const coffee = pathToPolyglot(document.getElementById("floor_coffee"));
const vorne = pathToPolyglot(document.getElementById("floor_10vorne"));
const polygonPoints = { nullpointer, coffee, vorne };

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
	polygon.setAttributeNS(null, "fill", "tomato");
	polygon.setAttributeNS(null, "points", pointCommandsToSVGPoints(points));
	path.parentNode.replaceChild(polygon, path);

	return points;
}
/// ---------------------------------------

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

	let isStillInRoom = pointInPolygon(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		polygonPoints.nullpointer,
	);
	console.log({ isStillInRoom });

	const collision = intersects(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		walls,
	);
	if (!collision) {
		playerAvatar.cy.baseVal.value = nextCy;
	}
}

function moveUp() {
	const nextCy = playerAvatar.cy.baseVal.value - moveSteps;
	const collision = intersects(
		[playerAvatar.cx.baseVal.value, nextCy, playerAvatar.r.baseVal.value],
		walls,
	);
	if (!collision) {
		playerAvatar.cy.baseVal.value = nextCy;
	}
}

function moveLeft() {
	const nextCx = playerAvatar.cx.baseVal.value - moveSteps;
	const collision = intersects(
		[nextCx, playerAvatar.cy.baseVal.value, playerAvatar.r.baseVal.value],
		walls,
	);
	if (!collision) {
		playerAvatar.cx.baseVal.value = nextCx;
	}
}

function moveRight() {
	const nextCx = playerAvatar.cx.baseVal.value + moveSteps;
	const collision = intersects(
		[nextCx, playerAvatar.cy.baseVal.value, playerAvatar.r.baseVal.value],
		walls,
	);
	if (!collision) {
		playerAvatar.cx.baseVal.value = nextCx;
	}
}

function pointInPolygon(point, polygon) {
	for (let n = polygon.length, i = 0, j = n - 1; i < n; j = i++) {
		let touchesBorder = intersects(point, [[polygon[i], polygon[j]]]);
		if (touchesBorder) {
			return false;
		}
	}
	return true;
}

function intersects(circle, lines) {
	return lines.some(function (line) {
		return pointLineSegmentDistance(circle, line) < circle[2];
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
