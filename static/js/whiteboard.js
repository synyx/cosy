// =========================================================================
// kudos https://ben.akrin.com/?p=4981
// =========================================================================

const root = document.getElementById("whiteboard-canvas");
root.classList.add("relative");

function initCanvas({ width, height }) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.classList.add("absolute", "top-0", "left-0");
	return canvas;
}

function drawQuadraticCurve(dots, color, thickness, canvas) {
	canvas.strokeStyle = color;
	canvas.fillStyle = color;
	canvas.lineWidth = thickness;
	canvas.lineJoin = "round";
	canvas.lineCap = "round";

	if (dots.length > 0) {
		// just in case
		if (dots.length < 3) {
			var b = dots[0];
			canvas.beginPath();
			canvas.arc(b.x, b.y, canvas.lineWidth / 2, 0, Math.PI * 2, !0);
			canvas.fill();
			canvas.closePath();

			return;
		}

		canvas.beginPath();
		canvas.moveTo(dots[0].x, dots[0].y);

		for (var i = 1; i < dots.length - 2; i++) {
			var c = (dots[i].x + dots[i + 1].x) / 2;
			var d = (dots[i].y + dots[i + 1].y) / 2;

			canvas.quadraticCurveTo(dots[i].x, dots[i].y, c, d);
		}

		// the last 2 points are special
		canvas.quadraticCurveTo(dots[i].x, dots[i].y, dots[i + 1].x, dots[i + 1].y);
		canvas.stroke();
	}
}

export function initWhiteboard({ socket, userName }) {
	const { width, height } = root.getBoundingClientRect();

	const permCanvas = initCanvas({ width, height });
	const permCanvasCtx = permCanvas.getContext("2d");
	root.appendChild(permCanvas);

	const collabCanvas = initCanvas({ width, height });
	const collabCanvasCtx = collabCanvas.getContext("2d");
	root.appendChild(collabCanvas);

	// temp canvas is used while user is drawing something
	// on mouseup the art is committed to the permCanvas
	const tempCanvas = initCanvas({ width, height });
	const tempCanvasCtx = tempCanvas.getContext("2d");
	root.appendChild(tempCanvas);

	let color = "#000000";
	let thickness = 3;

	send({ type: "whiteboard-user-joined", content: { userName } });

	socket.addEventListener("message", function (event) {
		const data = JSON.parse(event.data);

		switch (data.type) {
			case "whiteboard-pointer-moved": {
				const { x, y, userName: remoteUserName } = data.content;
				if (remoteUserName === userName) {
					return;
				}
				break;
			}
			case "whiteboard-dots-chunk-added": {
				const {
					dots,
					color,
					thickness,
					userName: remoteUserName,
				} = data.content;
				if (remoteUserName === userName) return;
				drawQuadraticCurve(dots, color, thickness, collabCanvasCtx);
				break;
			}
			case "whiteboard-dots-committed": {
				// console.log("remote dots committed", data.content);
				for (let { dots, color, thickness } of data.content) {
					drawQuadraticCurve(dots, color, thickness, collabCanvasCtx);
				}
				break;
			}
		}
	});

	document
		.getElementById("whiteboard-color")
		.addEventListener("change", (event) => {
			color = event.target.value;
		});

	document
		.getElementById("whiteboard-stroke-width")
		.addEventListener("change", (event) => {
			thickness = event.target.value;
		});

	let mousedown = false;
	let dots = [];

	tempCanvas.addEventListener("mousedown", onPointerDown);
	tempCanvas.addEventListener("mouseup", onPointerUp);
	tempCanvas.addEventListener("mouseleave", onPointerUp);
	tempCanvas.addEventListener("mousemove", onPointerMove);

	function updateMousePosition(event) {
		const { top, left } = permCanvas.getBoundingClientRect();
		const coordinates = {
			x: event.clientX - left,
			y: event.clientY - top,
		};

		// scaling is not implemented yet
		// coordinates.x /= this.scale_x;
		// coordinates.y /= this.scale_y;

		if (
			dots.length < 1 ||
			dots[dots.length - 1].x != coordinates.x ||
			dots[dots.length - 1].y != coordinates.y
		) {
			dots.push(coordinates);
		}
		// shitty iPad palm detection
		if (
			dots.length > 1 &&
			Math.sqrt(
				Math.pow(dots[dots.length - 1].x - dots[dots.length - 2].x, 2) +
					Math.pow(dots[dots.length - 1].y - dots[dots.length - 2].y, 2),
			) >
				((width + height) * 15) / 100
		) {
			var shift_x_times = dots.length - 1;
			while (shift_x_times > 0) {
				dots.shift();
				shift_x_times--;
			}
		}
	}

	function onPointerDown(event) {
		mousedown = true;

		updateMousePosition(event);

		tempCanvasCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		drawQuadraticCurve(dots, color, thickness, tempCanvasCtx);
	}

	function onPointerMove(event) {
		// why preventDefault? don't know yet
		// event.preventDefault();

		// publish 'mouse move'
		const { top, left } = permCanvas.getBoundingClientRect();
		send({
			type: "whiteboard-pointer-moved",
			content: {
				x: event.clientX - left,
				y: event.clientY - top,
				userName,
			},
		});

		if (!mousedown) {
			return;
		}

		updateMousePosition(event);
		tempCanvasCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		drawQuadraticCurve(dots, color, thickness, tempCanvasCtx);

		// publish dots
		send({
			type: "whiteboard-dots-added",
			content: { dots, color, thickness, userName },
		});
	}

	function onPointerUp(event) {
		mousedown = false;

		send({
			type: "whiteboard-dots-committed",
			content: { dots, color, thickness, userName },
		});

		// commit dots to permanent canvas
		drawQuadraticCurve(dots, color, thickness, permCanvasCtx);
		// and cleanup temp canvas
		tempCanvasCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

		// last but not least reset dots
		dots = [];
	}

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
}
