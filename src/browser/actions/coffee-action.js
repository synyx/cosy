export function createCoffeeActions({ send, player, playerAvatar }) {
	let soundPlayingCurrently = false;
	return {
		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Kaffee machen",

				shouldBeVisible: ({ currentRoom }) => currentRoom.id === "floor_coffee",

				attrs() {
					return [];
				},

				handleSelect({ currentRoom, attrs }) {
					if (soundPlayingCurrently) {
						return;
					}

					soundPlayingCurrently = true;

					const audio = document.createElement("audio");
					audio.classList.add("hidden");
					audio.setAttribute("autoplay", true);
					audio.src = "/sounds/511553__flamowsky__coffee-machine.mp3";

					audio.addEventListener("ended", (event) => {
						audio.remove();
						soundPlayingCurrently = false;
					});

					document.body.appendChild(audio);
				},
			},
		],
	};
}
