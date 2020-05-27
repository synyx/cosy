export function createCoffeeActions({ send, player, playerAvatar }) {
	let soundPlayingCurrently = false;
	let billardCoffeeCounter = 0;
	return {
		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Kaffee machen",

				shouldBeVisible: ({ currentRoom }) => currentRoom.id === "floor_coffee",

				attrs() {
					return [];
				},

				handleSelect({ playerAvatar, currentRoom, attrs }) {
					if (soundPlayingCurrently) {
						return;
					}

					soundPlayingCurrently = true;

					const audio = new Audio(
						"/sounds/511553__flamowsky__coffee-machine.mp3",
					);
					audio.addEventListener("ended", (event) => {
						audio.remove();
						soundPlayingCurrently = false;
					});

					audio.load();
					audio.play();
				},
			},
			{
				label: "Kaffee machen",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_billard_coffee",

				attrs() {
					return [];
				},

				handleSelect({ playerAvatar, currentRoom, attrs }) {
					billardCoffeeCounter++;
					if (billardCoffeeCounter === 3) {
						window.alert("Alter! Die Kaffeemaschine geht nicht!");
						billardCoffeeCounter = 0;
					}
				},
			},
		],
	};
}
