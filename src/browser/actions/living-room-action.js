export function createLivingRoomActions({ send, player, playerAvatar }) {
	const root = document.querySelector("#living-room-tv-root");
	root.style.transition = "background 1s ease-out";
	root.style.backgroundColor = "rgba(0,0,0,0)";

	return {
		handleRoomChange({ previousRoom, nextRoom }) {},

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
					const inner = document.querySelector("#living-room-tv-root-inner");
					const closeButton = document.querySelector("#close-game-button");

					root.style.backgroundColor = "rgba(0,0,0,0.25)";
					root.classList.add("z-50");
					root.classList.remove("hidden");

					setTimeout(function () {
						inner.classList.add("w-full");
						inner.style.height = "100%";
					}, 0);

					closeButton.addEventListener("click", (event) => {
						root.style.backgroundColor = "rgba(0,0,0,0)";
						root.classList.remove("z-50", "w-full");
						root.classList.add("hidden");
						inner.style.transition = "";
						inner.style.height = "";
					});

					root.classList.remove("hidden");
					root.classList.add("z-50");
					inner.classList.add("w-full", "h-full");
				},
			},
		],
	};
}
