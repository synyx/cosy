export function createRadioActions({ send, player, playerAvatar }) {
	let soundPlayingCurrently = false;
	let radioAudio;

	return {
		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Radio an",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_radio" && !soundPlayingCurrently,

				attrs() {
					return [];
				},

				handleSelect({ playerAvatar, currentRoom, attrs }) {
					if (soundPlayingCurrently) {
						return;
					}

					soundPlayingCurrently = true;

					if (!radioAudio) {
						radioAudio = new Audio("/sounds/java-java-jing-jing.mp3");
						radioAudio.load();
					}

					// loop radio sound
					// player must disable the radio himself
					radioAudio.addEventListener("ended", (event) => {
						radioAudio.play();
					});

					radioAudio.play();
				},
			},
			{
				label: "Radio aus",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_radio" && soundPlayingCurrently,

				attrs() {
					return [];
				},

				handleSelect({ playerAvatar, currentRoom, attrs }) {
					if (!soundPlayingCurrently) {
						return;
					}

					radioAudio.pause();
					radioAudio.currentTime = 0;
					soundPlayingCurrently = false;
				},
			},
		],
	};
}
