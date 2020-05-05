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
					const coffeeAnimation = playerAvatar.cloneNode(true);

					const audio = new Audio(
						"/sounds/511553__flamowsky__coffee-machine.mp3",
					);
					audio.addEventListener("ended", (event) => {
						audio.remove();
						soundPlayingCurrently = false;
						coffeeAnimation.remove();
					});

					audio.load();
					audio.play().then(function () {
						coffeeAnimation.classList.add("coffee");
						coffeeAnimation.setAttributeNS(null, "fill", "none");
						coffeeAnimation.r.baseVal.value += 2.5;
						playerAvatar.insertAdjacentElement("afterend", coffeeAnimation);
					});
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
