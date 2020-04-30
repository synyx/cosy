export function createLivingRoomActions({ send, player, playerAvatar }) {
	return {
		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Jump and Run spielen",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_living_room",

				attrs() {
					return [];
				},

				handleSelect({ currentRoom, attrs }) {
					const root = document.querySelector("#living-room-tv-root");
					const inner = document.querySelector("#living-room-tv-root-inner");
					const closeButton = document.querySelector("#close-game-button");

					closeButton.addEventListener("click", (event) => {
						inner.classList.remove("w-full", "h-full");
						root.classList.add("hidden");
						root.classList.remove("z-50");
					});

					root.classList.remove("hidden");
					root.classList.add("z-50");
					inner.classList.add("w-full", "h-full");
				},
			},
		],
	};
}
