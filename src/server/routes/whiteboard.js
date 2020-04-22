const route = require("koa-route");
const { createCanvas } = require("canvas");
const whiteboard = require("../websocket/whiteboard");

const canvasWidth = 5000;
const canvasHeight = 3000;

module.exports = function (app) {
	app.use(
		route.get("/whiteboard/canvas-export", async function (context) {
			const canvas = createCanvas(canvasWidth, canvasHeight, "png");
			const canvasContext = canvas.getContext("2d");

			canvasContext.fillStyle = "#ffffff";
			canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);

			for (let point of whiteboard.points) {
				const { dots, color, thickness } = point;
				drawQuadraticCurve(dots, color, thickness, canvasContext);
			}

			context.res.setHeader("content-type", "image/png");
			context.res.setHeader("content-disposition", "filename=kreativ-raum.png");
			context.body = canvas.toBuffer();
		}),
	);
};

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
