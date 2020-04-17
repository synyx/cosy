const { jitsiDomain, player } = window.synyxoffice;

let jitsiApi;
const jitsiParentElement = document.getElementById("jitsi");
const jitsiCamStatus = document.getElementById("jitsi-camera-status");
const jitsiMicStatus = document.getElementById("jitsi-microphone-status");

const root = document.getElementById("chat-root");
root.style.transition = "background 1s ease-out";
root.style.backgroundColor = "rgba(0,0,0,0)";

const rootInner = document.getElementById("chat-root-inner");

export function startChat({ roomName }) {
	// jitsi connection
	const options = {
		roomName: roomName || "JitsiMeetAPIExample",
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

	jitsiApi.executeCommand("avatarUrl", player.avatarUrl);
	// audio is on by default, disable it for the pleasure of all other participants
	jitsiApi.executeCommand("toggleAudio");
	// video is on by default, disable it so other participants see the awesome avatar first :o)
	jitsiApi.executeCommand("toggleVideo");

	// chat window
	root.style.backgroundColor = "rgba(0,0,0,0.25)";
	root.classList.add("z-50");

	rootInner.style.transition = "height 0.3s ease-out, width 0.3s ease-out";
	rootInner.classList.add("w-full", "h-full");

	setTimeout(function () {
		rootInner.classList.add("w-full");
		rootInner.style.height = "100%";
	}, 0);
}

const closeChatButton = document.getElementById("close-chat-button");
closeChatButton.addEventListener("click", function (event) {
	closeChatButton.blur();

	jitsiApi.executeCommand("hangup");
	jitsiApi.dispose();

	root.style.backgroundColor = "rgba(0,0,0,0)";
	root.classList.remove("z-50", "w-full");

	rootInner.style.transition = "";
	rootInner.style.height = "";

	rootInner.classList.remove("w-full", "h-full");
	setTimeout(() => (jitsiParentElement.innerHTML = ""));
});
