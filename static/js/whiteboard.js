// =========================================================================
// kudos https://ben.akrin.com/?p=4981
// =========================================================================

const root = document.getElementById("whiteboard-canvas");
root.classList.add("relative", "overflow-hidden");

// required for canvas movement calculations
// canvas should not be moved anymore when end is reached
const canvasBorderWidth = 50;

function initCanvas({ width, height, left, top }) {
	const canvas = document.createElement("canvas");
	canvas.width = width - canvasBorderWidth;
	canvas.height = height - canvasBorderWidth;
	canvas.style.position = "absolute";
	canvas.style.left = `${0}px`;
	canvas.style.top = `${0}px`;
	canvas.style.transform = `translate(${left}px, ${top}px)`;
	canvas.classList.add("border", "border-teal-700");
	canvas.style.borderWidth = `${canvasBorderWidth}px`;
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
	const { width: rootWidth, height: rootHeight } = root.getBoundingClientRect();

	const canvasWidth = 5000;
	const canvasHeight = 3000;
	const canvasPos = {
		top: rootHeight / 2 - canvasHeight / 2,
		left: rootWidth / 2 - canvasWidth / 2,
	};

	const collabCanvas = initCanvas({
		width: canvasWidth,
		height: canvasHeight,
		left: canvasPos.left,
		top: canvasPos.top,
	});
	const collabCanvasCtx = collabCanvas.getContext("2d");

	const permCanvas = initCanvas({
		width: canvasWidth,
		height: canvasHeight,
		left: canvasPos.left,
		top: canvasPos.top,
	});
	const permCanvasCtx = permCanvas.getContext("2d");

	// temp canvas is used while user is drawing something
	// on mouseup the art is committed to the permCanvas
	const tempCanvas = initCanvas({
		width: canvasWidth,
		height: canvasHeight,
		left: canvasPos.left,
		top: canvasPos.top,
	});
	const tempCanvasCtx = tempCanvas.getContext("2d");

	const cursorCanvas = initCanvas({
		width: canvasWidth,
		height: canvasHeight,
		left: canvasPos.left,
		top: canvasPos.top,
	});
	const cursorCanvasCtx = cursorCanvas.getContext("2d");

	cursorCanvas.style.cursor = "url('/pencil_black.cur'), auto";
	cursorCanvasCtx.globalAlpha = 0.33;

	root.appendChild(permCanvas);
	root.appendChild(collabCanvas);
	root.appendChild(tempCanvas);
	// cursors should be above everything else
	// therefore it has to be the last added one
	root.appendChild(cursorCanvas);

	let color = "#000000";
	let thickness = 3;

	send({ type: "whiteboard-user-joined", content: { userName } });

	const participants = new Map();
	let nextRemoteCursorIndex = 0;
	const remoteCursorFiles = [
		"pencil_blue.cur",
		"pencil_green.cur",
		"pencil_orange.cur",
		"pencil_pink.cur",
		"pencil_purple.cur",
		"pencil_red.cur",
		"pencil_yellow.cur",
	];

	socket.addEventListener("message", function (event) {
		const data = JSON.parse(event.data);

		switch (data.type) {
			case "whiteboard-pointer-moved": {
				const { cursors } = data.content;
				cursorCanvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
				for (let cursorData of cursors) {
					const { userName: remoteUserName, x, y } = cursorData;
					if (remoteUserName === userName) {
						continue;
					}
					if (!participants.has(remoteUserName)) {
						const remoteCursorImg = new Image();
						const whenImageLoaded = new Promise((resolve) => {
							remoteCursorImg.onload = function () {
								resolve(remoteCursorImg);
							};
						});
						remoteCursorImg.src = remoteCursorFiles[nextRemoteCursorIndex];
						nextRemoteCursorIndex++;
						participants.set(remoteUserName, function ({ x, y }) {
							whenImageLoaded.then(function (image) {
								// TODO also add username label next to the cursor
								cursorCanvasCtx.drawImage(image, x, y);
							});
						});
					}
					const renderCursor = participants.get(remoteUserName);
					// render cursor at position or out of canvas scope when not defined
					renderCursor({ x: x != null ? x : -100, y: y != null ? y : -100 });
				}
				break;
			}
			case "whiteboard-dots-added": {
				const {
					dots,
					color,
					thickness,
					userName: remoteUserName,
				} = data.content;
				if (remoteUserName !== userName) {
					const { width, height } = collabCanvas;
					collabCanvasCtx.clearRect(0, 0, width, height);
					drawQuadraticCurve(dots, color, thickness, collabCanvasCtx);
				}
				break;
			}
			case "whiteboard-dots-committed": {
				const {
					dots,
					color,
					thickness,
					userName: remoteUserName,
				} = data.content;
				if (remoteUserName !== userName) {
					const { width, height } = collabCanvas;
					// TODO cleaning collab Canvas should not be neccessary
					// when chunks are implemented.
					collabCanvasCtx.clearRect(0, 0, width, height);
					drawQuadraticCurve(dots, color, thickness, permCanvasCtx);
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

	let spaceKeyPressed = false;
	let spaceKeyUpHandled = true;
	let mousedown = false;
	let dots = [];

	window.addEventListener("beforeunload", function () {
		send({
			type: "whiteboard-user-left",
			content: { userName },
		});
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === " ") {
			spaceKeyPressed = true;
			// keydown fires multiple times as long as the space key
			// is pressed. therefore we have to use this lock
			if (spaceKeyUpHandled) {
				spaceKeyUpHandled = false;
				cursorCanvas.style.cursor = "grab";
			}
		}
	});
	document.addEventListener("keyup", function (event) {
		if (event.key === " ") {
			spaceKeyUpHandled = true;
			spaceKeyPressed = false;
			cursorCanvas.style.cursor = "url('/pencil_black.cur'), auto";
			mousedown = false;
		}
	});

	cursorCanvas.addEventListener("mousedown", onMouseDown);
	cursorCanvas.addEventListener("mouseup", onMouseUp);
	cursorCanvas.addEventListener("mouseleave", onMouseUp);
	cursorCanvas.addEventListener("mousemove", onMouseMove);

	function updateDrawingDotsPath(event) {
		const coordinates = getCursorPosition(event);

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
				((canvasWidth + canvasHeight) * 15) / 100
		) {
			var shift_x_times = dots.length - 1;
			while (shift_x_times > 0) {
				dots.shift();
				shift_x_times--;
			}
		}
	}

	function getCursorPosition(event) {
		const rect = tempCanvas.getBoundingClientRect();
		const x = event.clientX - rect.left - canvasBorderWidth;
		const y = event.clientY - rect.top - canvasBorderWidth;
		return { x, y };
	}

	function onMouseDown(event) {
		if (event.which !== 1) {
			// not the left mouse button
			return;
		}

		mousedown = getCursorPosition(event);

		if (spaceKeyPressed) {
			cursorCanvas.style.cursor = "grabbing";
		}

		if (!spaceKeyPressed) {
			updateDrawingDotsPath(event);
			tempCanvasCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
			drawQuadraticCurve(dots, color, thickness, tempCanvasCtx);
			return;
		}
	}

	function onMouseMove(event) {
		// why preventDefault? don't know yet
		// event.preventDefault();

		if (spaceKeyPressed && mousedown) {
			// mouse doesn't move in relation to the canvas actually
			// therefore do not send mouse position updates to the server
			let nextLeft = canvasPos.left;
			let nextTop = canvasPos.top;

			const currentCursor = getCursorPosition(event);
			nextLeft -= mousedown.x - currentCursor.x;
			nextTop -= mousedown.y - currentCursor.y;

			if (
				nextTop > 0 ||
				Math.abs(nextTop) > canvasHeight + canvasBorderWidth - rootHeight
			) {
				nextTop = canvasPos.top;
			}
			if (
				nextLeft > 0 ||
				Math.abs(nextLeft) > canvasWidth + canvasBorderWidth - rootWidth
			) {
				nextLeft = canvasPos.left;
			}

			collabCanvas.style.transform = `translate(${nextLeft}px, ${nextTop}px)`;
			permCanvas.style.transform = `translate(${nextLeft}px, ${nextTop}px)`;
			tempCanvas.style.transform = `translate(${nextLeft}px, ${nextTop}px)`;
			cursorCanvas.style.transform = `translate(${nextLeft}px, ${nextTop}px)`;

			canvasPos.left = nextLeft;
			canvasPos.top = nextTop;

			return;
		}

		// publish 'mouse move'
		const coordinates = getCursorPosition(event);
		send({
			type: "whiteboard-pointer-moved",
			content: {
				x: coordinates.x,
				y: coordinates.y,
				userName,
			},
		});

		if (!mousedown) {
			return;
		}

		updateDrawingDotsPath(event);
		drawQuadraticCurve(dots, color, thickness, tempCanvasCtx);

		// publish dots
		send({
			type: "whiteboard-dots-added",
			content: { dots, color, thickness, userName },
		});
	}

	function onMouseUp(event) {
		mousedown = false;

		if (spaceKeyPressed) {
			cursorCanvas.style.cursor = "grab";
		} else {
			cursorCanvas.style.cursor = "url('/pencil_black.cur'), auto";
		}

		send({
			type: "whiteboard-dots-committed",
			content: { dots, color, thickness, userName },
		});

		// and cleanup temp canvas
		tempCanvasCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
		// commit dots to permanent canvas
		drawQuadraticCurve(dots, color, thickness, permCanvasCtx);

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
