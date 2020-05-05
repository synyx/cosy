export function createKudoActions({ send, player, playerAvatar }) {
	return {
		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Kudoboard anschauen",
				shouldBeVisible: ({ currentRoom }) => currentRoom.id === "floor_kudo",
				attrs() {
					return [];
				},
				handleSelect({ currentRoom, attrs }) {
					const kudoBoardWindow = window.open();
					kudoBoardWindow.opener = null;
					kudoBoardWindow.location =
						"https://meet.synyx.de/apps/deck/#!/board/2/";
				},
			},
		],
	};
}
