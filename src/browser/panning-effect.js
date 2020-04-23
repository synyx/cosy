// onlye allow svg panning while space is pressed
let spacekeyPressed = false;
let spaceKeyUpHandled = true;

document.addEventListener("keydown", (event) => {
	if (event.key === " ") {
		spacekeyPressed = true;
		// keydown fires multiple times as long as the space key
		// is pressed. therefore we have to use this lock
		if (spaceKeyUpHandled) {
			spaceKeyUpHandled = false;
			document.body.style.cursor = "grab";
		}
	}
});

document.addEventListener("keyup", (event) => {
	if (event.key === " ") {
		spacekeyPressed = false;
		spaceKeyUpHandled = true;
		document.body.style.cursor = "default";
	}
});

// ===============================
// kudos https://css-tricks.com/creating-a-panning-effect-for-svg/

const officeSvg = document.getElementById("office");

officeSvg.addEventListener("mousedown", onPointerDown); // Pressing the mouse
officeSvg.addEventListener("mouseup", onPointerUp); // Releasing the mouse
officeSvg.addEventListener("mouseleave", onPointerUp); // Mouse gets out of the SVG area
officeSvg.addEventListener("mousemove", onPointerMove); // Mouse is moving

// Create an SVG point that contains x & y values
var point = officeSvg.createSVGPoint();
// This function returns an object with X & Y values from the pointer event
function getPointFromEvent(event) {
	// If even is triggered by a touch event, we get the position of the first finger
	if (event.targetTouches) {
		point.x = event.targetTouches[0].clientX;
		point.y = event.targetTouches[0].clientY;
	} else {
		point.x = event.clientX;
		point.y = event.clientY;
	}

	// We get the current transformation matrix of the SVG and we inverse it
	var invertedSVGMatrix = officeSvg.getScreenCTM().inverse();

	return point.matrixTransform(invertedSVGMatrix);
}

// This variable will be used later for move events to check if pointer is down or not
var isPointerDown = false;

// This variable will contain the original coordinates when the user start pressing the mouse or touching the screen
var pointerOrigin;

// Function called by the event listeners when user start pressing/touching
function onPointerDown(event) {
	if (!spacekeyPressed) {
		return;
	}
	document.body.style.cursor = "grabbing";
	isPointerDown = true; // We set the pointer as down
	// We get the pointer position on click/touchdown so we can get the value once the user starts to drag
	pointerOrigin = getPointFromEvent(event);
}

// We save the original values from the viewBox
var viewBox = officeSvg.viewBox.baseVal;

// Function called by the event listeners when user start moving/dragging
function onPointerMove(event) {
	// Only run this function if the pointer is down
	if (!isPointerDown || !spacekeyPressed) {
		return;
	}
	// This prevent user to do a selection on the page
	event.preventDefault();

	// Get the pointer position as an SVG Point
	var pointerPosition = getPointFromEvent(event);

	// Update the viewBox variable with the distance from origin and current position
	// We don't need to take care of a ratio because this is handled in the getPointFromEvent function
	viewBox.x -= pointerPosition.x - pointerOrigin.x;
	viewBox.y -= pointerPosition.y - pointerOrigin.y;
}

function onPointerUp() {
	// The pointer is no longer considered as down
	isPointerDown = false;
	if (spacekeyPressed) {
		document.body.style.cursor = "grab";
	} else {
		document.body.style.cursor = "default";
	}
}
