const { jitsiDomain, player } = window.synyxoffice;

let jitsiApi;
const jitsiParentElement = document.getElementById("jitsi");
const jitsiCamStatus = document.getElementById("jitsi-camera-status");
const jitsiMicStatus = document.getElementById("jitsi-microphone-status");

const root = document.getElementById("chat-root");
root.style.transition = "background 1s ease-out";
root.style.backgroundColor = "rgba(0,0,0,0)";

const rootInner = document.getElementById("chat-root-inner");

let closeChat;

export function startChat({ roomName }) {
	const externalListeners = new Map();

	// jitsi connection
	const options = {
		roomName,
		width: "100%",
		height: "100%",
		parentNode: jitsiParentElement,
		userInfo: {
			email: player.email,
			displayName: player.name,
		},
	};
	jitsiApi = new JitsiMeetExternalAPI(jitsiDomain, options);

	jitsiApi.addEventListener("audioMuteStatusChanged", ({ muted }) => {
		jitsiMicStatus.innerText = muted ? "AUS" : "AN";
	});

	jitsiApi.addEventListener("videoMuteStatusChanged", ({ muted }) => {
		jitsiCamStatus.innerText = muted ? "AUS" : "AN";
	});

	closeChat = function () {
		jitsiApi.dispose();

		root.style.backgroundColor = "rgba(0,0,0,0)";
		root.classList.remove("z-50", "w-full");
		root.classList.add("hidden");

		rootInner.style.transition = "";
		rootInner.style.height = "";

		rootInner.classList.remove("w-full", "h-full");
		setTimeout(() => {
			jitsiParentElement.innerHTML = "";
			if (externalListeners.has("close")) {
				for (let listener of externalListeners.get("close")) {
					listener({ roomName });
				}
			}
		});
	};

	jitsiApi.addEventListener("readyToClose", () => {
		closeChat();
	});

	jitsiApi.executeCommand("avatarUrl", player.avatarUrl);
	// audio is on by default, disable it for the pleasure of all other participants
	jitsiApi.executeCommand("toggleAudio");
	// video is on by default, disable it so other participants see the awesome avatar first :o)
	jitsiApi.executeCommand("toggleVideo");

	// chat window
	root.style.backgroundColor = "rgba(0,0,0,0.25)";
	root.classList.add("z-50");
	root.classList.remove("hidden");

	rootInner.style.transition = "height 0.3s ease-out, width 0.3s ease-out";
	rootInner.classList.add("w-full", "h-full");

	setTimeout(function () {
		rootInner.classList.add("w-full");
		rootInner.style.height = "100%";
	}, 0);

	return {
		get roomName() {
			return roomName;
		},
		on(event, listener) {
			if (!externalListeners.has(event)) {
				externalListeners.set(event, []);
			}
			externalListeners.get(event).push(listener);
		},
	};
}

const closeChatButton = document.getElementById("close-chat-button");
closeChatButton.addEventListener("click", function (event) {
	closeChatButton.blur();

	if (jitsiApi) {
		jitsiApi.executeCommand("hangup");
	}

	if (isMobile()) {
		closeChat();
	}
});

window.addEventListener("beforeunload", function () {
	if (jitsiApi) {
		jitsiApi.executeCommand("hangup");
	}
});

function isMobile() {
	// Jitsis way of detecting whether we are on mobile or not
	// https://github.com/jitsi/jitsi-meet/blob/master/react/features/base/react/Platform.web.js

	const { userAgent } = navigator;
	let OS;

	if (userAgent.match(/Android/i)) {
		OS = "android";
	} else if (userAgent.match(/iP(ad|hone|od)/i)) {
		OS = "ios";
	} else if (userAgent.match(/Mac(intosh| OS X)/i)) {
		OS = "macos";
	} else if (userAgent.match(/Windows/i)) {
		OS = "windows";
	}

	return OS === "android" || OS === "ios";
}
