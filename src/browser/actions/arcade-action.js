export function createArcadeActions({ send, player, playerAvatar }) {
	let isRunning = false;

	return {
		get isRunning() {
			return isRunning;
		},

		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Arcade spielen",

				shouldBeVisible: ({ currentRoom }) => currentRoom.id === "floor_arcade",

				attrs() {
					return [];
				},

				handleSelect({ currentRoom, attrs }) {
					const script = document.createElement("script");
					script.src = "/asteroids.js";
					document.body.appendChild(script);

					const root = document.querySelector("#arcade-root");
					const inner = document.querySelector("#arcade-root-inner");
					const closeButton = document.querySelector("#close-arcade-button");

					closeButton.addEventListener("click", (event) => {
						isRunning = false;
						document.dispatchEvent(new Event("arcade-closed"));
						inner.classList.remove("w-full", "h-full");
						root.classList.add("hidden");
						root.classList.remove("z-50");
					});

					root.classList.remove("hidden");
					root.classList.add("z-50");
					inner.classList.add("w-full", "h-full");
					isRunning = true;
				},
			},
		],
	};
}
