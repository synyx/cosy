export function createToiletActions({ send, player, playerAvatar }) {
	let flushingToiletCounter = 0;

	function playSound(src) {
		return new Promise((resolve) => {
			const audio = new Audio(src);
			audio.addEventListener("ended", resolve);
			audio.load();
			audio.play();
		});
	}

	return {
		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content, { currentRoomName }) {
			switch (type) {
				case "toilet-flush": {
					const { roomName, userName } = content;
					if (flushingToiletCounter < 2) {
						if (userName !== player.name && roomName === currentRoomName) {
							playSound("/sounds/46274__phreaksaccount__flush1.mp3");
						}
					}
					break;
				}
				case "toilet-fart": {
					const { roomName, userName, sound } = content;
					if (userName !== player.name && roomName === currentRoomName) {
						playSound(sound);
					}
					break;
				}
			}
		},

		actions: [
			{
				label: "Klospülung betätigen",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_toilets_m" ||
					currentRoom.id === "floor_toilets_f",

				attrs() {
					return [];
				},

				async handleSelect({ currentRoom, attrs }) {
					if (flushingToiletCounter >= 2) {
						return;
					}

					flushingToiletCounter++;

					send({
						type: "toilet-flush",
						content: {
							roomName: currentRoom.id,
							userName: player.name,
						},
					});

					await playSound("/sounds/46274__phreaksaccount__flush1.mp3");
					flushingToiletCounter--;
				},
			},
			{
				label: "Furzen",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_toilet_m_2" ||
					currentRoom.id === "floor_toilet_f_1" ||
					currentRoom.id === "floor_toilets_m" ||
					currentRoom.id === "floor_toilets_f",

				attrs() {
					return [];
				},

				async handleSelect({ currentRoom, attrs }) {
					if (flushingToiletCounter >= 2) {
						return;
					}

					flushingToiletCounter++;

					const fartSounds = [
						"64138__ifartinurgeneraldirection__toilet-fart-4.mp3",
						"64517__ifartinurgeneraldirection__best-toilet-fart.mp3",
						"65740__ifartinurgeneraldirection__toilet-fart-6.mp3",
						"75165__ifartinurgeneraldirection__funny-assed-toilet-fart-1.mp3",
					];
					const randomIndex = Math.floor(Math.random() * fartSounds.length);

					send({
						type: "toilet-fart",
						content: {
							roomName: currentRoom.id,
							sound: `/sounds/${fartSounds[randomIndex]}`,
							userName: player.name,
						},
					});

					await playSound(`/sounds/${fartSounds[randomIndex]}`);
					flushingToiletCounter--;
				},
			},
		],
	};
}
