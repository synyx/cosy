export function createShowerActions({ send, player, playerAvatar }) {
	let soundPlayingCurrently = false;
	return {
		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Duschen",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_shower_2",

				attrs() {
					return [];
				},

				handleSelect({ playerAvatar, currentRoom, attrs }) {
					if (soundPlayingCurrently) {
						return;
					}

					soundPlayingCurrently = true;

					const audio = new Audio("/sounds/353195_inspectorj_shower-a.mp3");
					audio.addEventListener("ended", (event) => {
						soundPlayingCurrently = false;
					});

					audio.load();
					audio.play();
				},
			},
		],
	};
}
