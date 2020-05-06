const canvasWidth = 5000;
const canvasHeight = 3000;

export function createWhiteboardActions({ send, player, playerAvatar }) {
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

	// =========================================================================
	// kudos https://ben.akrin.com/?p=4981
	// =========================================================================

	// the final image (comitted paths)
	let permCanvas;
	let permCanvasCtx;

	// paths currently drawn by participants
	let collabCanvas;
	let collabCanvasCtx;

	// current path of the player
	let tempCanvas;
	let tempCanvasCtx;

	// the cursors of all participants
	let cursorCanvas;
	let cursorCanvasCtx;

	const root = document.getElementById("whiteboard-root");
	root.style.transition = "background 1s ease-out";
	root.style.backgroundColor = "rgba(0,0,0,0)";

	const rootInner = document.getElementById("chat-root-inner");

	const canvasParent = document.getElementById("whiteboard-canvas");
	canvasParent.classList.add("relative", "overflow-hidden");

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
			canvas.quadraticCurveTo(
				dots[i].x,
				dots[i].y,
				dots[i + 1].x,
				dots[i + 1].y,
			);
			canvas.stroke();
		}
	}

	function initWhiteboard() {
		const {
			width: rootWidth,
			height: rootHeight,
		} = root.getBoundingClientRect();

		root.style.backgroundColor = "rgba(0,0,0,0.25)";
		root.classList.add("z-50");
		root.classList.remove("hidden");

		rootInner.style.transition = "height 0.3s ease-out, width 0.3s ease-out";
		rootInner.classList.add("w-full", "h-full");

		setTimeout(function () {
			rootInner.classList.add("w-full");
			rootInner.style.height = "100%";
		}, 0);

		const canvasPos = {
			top: rootHeight / 2 - canvasHeight / 2,
			left: rootWidth / 2 - canvasWidth / 2,
		};

		collabCanvas = initCanvas({
			width: canvasWidth,
			height: canvasHeight,
			left: canvasPos.left,
			top: canvasPos.top,
		});
		collabCanvasCtx = collabCanvas.getContext("2d");

		permCanvas = initCanvas({
			width: canvasWidth,
			height: canvasHeight,
			left: canvasPos.left,
			top: canvasPos.top,
		});
		permCanvasCtx = permCanvas.getContext("2d");
		permCanvasCtx.fillStyle = "#ffffff";
		permCanvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);

		// temp canvas is used while user is drawing something
		// on mouseup the art is committed to the permCanvas
		tempCanvas = initCanvas({
			width: canvasWidth,
			height: canvasHeight,
			left: canvasPos.left,
			top: canvasPos.top,
		});
		tempCanvasCtx = tempCanvas.getContext("2d");

		cursorCanvas = initCanvas({
			width: canvasWidth,
			height: canvasHeight,
			left: canvasPos.left,
			top: canvasPos.top,
		});
		cursorCanvasCtx = cursorCanvas.getContext("2d");

		cursorCanvas.style.cursor = "url('/pencil_black.cur'), auto";
		cursorCanvasCtx.globalAlpha = 0.33;

		canvasParent.appendChild(permCanvas);
		canvasParent.appendChild(collabCanvas);
		canvasParent.appendChild(tempCanvas);
		// cursors should be above everything else
		// therefore it has to be the last added one
		canvasParent.appendChild(cursorCanvas);

		function exportCanvasImage() {
			const link = document.createElement("a");
			link.style.display = "none";
			link.href = "/whiteboard/canvas-export";
			link.setAttribute("download", "");

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}

		const exportButton = document.getElementById("whiteboard-image-export");
		exportButton.addEventListener("click", exportCanvasImage);

		const closeButton = document.getElementById("close-whiteboard-button");
		closeButton.addEventListener("click", function () {
			closeButton.blur();
			onCloseWhiteboard();
		});

		window.addEventListener("beforeunload", onCloseWhiteboard);

		function onCloseWhiteboard() {
			root.style.backgroundColor = "rgba(0,0,0,0)";
			root.classList.remove("z-50", "w-full");
			root.classList.add("hidden");

			rootInner.style.transition = "";
			rootInner.style.height = "";

			rootInner.classList.remove("w-full", "h-full");

			closeButton.removeEventListener("click", onCloseWhiteboard);
			exportButton.removeEventListener("click", exportCanvasImage);

			send({
				type: "whiteboard-user-left",
				content: { userName: player.name },
			});
		}

		let color = document.querySelector("button[id^=pencil-]").dataset.color;
		let thickness = document.querySelector(
			"[name='whiteboard-stroke-width']:checked",
		).value;

		send({
			type: "whiteboard-user-joined",
			content: { userName: player.name },
		});

		const pencilButtons = [...document.querySelectorAll("button[id^=pencil-]")];
		for (let button of pencilButtons) {
			button.addEventListener("click", (event) => {
				color = event.target.dataset.color;
				pencilButtons.forEach(
					(b) => ((b.style.transform = ""), (b.style.borderWidth = "")),
				);
				event.target.style.transform = "translate(0, 2px)";
				event.target.style.borderWidth = "4px";
			});
		}

		document.addEventListener("change", (event) => {
			if (event.target.matches("[name='whiteboard-stroke-width']")) {
				thickness = event.target.value;
			}
		});

		let spaceKeyPressed = false;
		let spaceKeyUpHandled = true;
		let mousedown = false;
		let dots = [];

		window.addEventListener("beforeunload", function () {
			send({
				type: "whiteboard-user-left",
				content: { userName: player.name },
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
					userName: player.name,
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
				content: { dots, color, thickness, userName: player.name },
			});
		}

		function onMouseUp() {
			mousedown = false;

			if (spaceKeyPressed) {
				cursorCanvas.style.cursor = "grab";
			} else {
				cursorCanvas.style.cursor = "url('/pencil_black.cur'), auto";
			}

			send({
				type: "whiteboard-dots-committed",
				content: { dots, color, thickness, userName: player.name },
			});

			// and cleanup temp canvas
			tempCanvasCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
			// commit dots to permanent canvas
			drawQuadraticCurve(dots, color, thickness, permCanvasCtx);

			// last but not least reset dots
			dots = [];
		}
	}

	return {
		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content) {
			switch (type) {
				case "whiteboard-pointer-moved": {
					const { cursors } = content;
					cursorCanvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
					for (let cursorData of cursors) {
						const { userName: remoteUserName, x, y } = cursorData;
						if (remoteUserName === player.name) {
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
							if (nextRemoteCursorIndex >= remoteCursorFiles.length) {
								nextRemoteCursorIndex = 0;
							}
							participants.set(remoteUserName, function ({ x, y }) {
								whenImageLoaded.then(function (image) {
									cursorCanvasCtx.drawImage(image, x, y);
									cursorCanvasCtx.font = "monospace";
									cursorCanvasCtx.fillText(remoteUserName, x + 30, y + 10);
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
					const { dots, color, thickness, userName: remoteUserName } = content;
					if (remoteUserName !== player.name) {
						const { width, height } = collabCanvas;
						collabCanvasCtx.clearRect(0, 0, width, height);
						drawQuadraticCurve(dots, color, thickness, collabCanvasCtx);
					}
					break;
				}
				case "whiteboard-dots-committed": {
					const { dots, color, thickness, userName: remoteUserName } = content;
					if (remoteUserName !== player.name) {
						const { width, height } = collabCanvas;
						// TODO cleaning collab Canvas should not be neccessary
						// when chunks are implemented.
						collabCanvasCtx.clearRect(0, 0, width, height);
						drawQuadraticCurve(dots, color, thickness, permCanvasCtx);
					}
					break;
				}
			}
		},

		actions: [
			{
				label: "malen",
				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_kreativ",
				attrs() {
					return [];
				},
				handleSelect({ currentRoom, attrs }) {
					initWhiteboard();
				},
			},
		],
	};
}
