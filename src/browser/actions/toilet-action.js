export function createToiletActions({ send, player, playerAvatar }) {
	let soundPlayingCurrently = false;

	return {
		handleWebsocket(type, content) {},

		actions: [
			{
				label: "Klospülung betätigen",

				shouldBeVisible: ({ currentRoom }) =>
					currentRoom.id === "floor_toilets_m" ||
					currentRoom.id === "floor_toilets_f",

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
					audio.src = "/sounds/46274__phreaksaccount__flush1.mp3";

					audio.addEventListener("ended", (event) => {
						audio.remove();
						soundPlayingCurrently = false;
					});

					document.body.appendChild(audio);
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

				handleSelect({ currentRoom, attrs }) {
					if (soundPlayingCurrently) {
						return;
					}

					soundPlayingCurrently = true;

					const fartSounds = [
						"64138__ifartinurgeneraldirection__toilet-fart-4.mp3",
						"64517__ifartinurgeneraldirection__best-toilet-fart.mp3",
						"65740__ifartinurgeneraldirection__toilet-fart-6.mp3",
						"75165__ifartinurgeneraldirection__funny-assed-toilet-fart-1.mp3",
					];
					const randomIndex = Math.floor(Math.random() * fartSounds.length);

					const audio = document.createElement("audio");
					audio.classList.add("hidden");
					audio.setAttribute("autoplay", true);
					audio.src = `/sounds/${fartSounds[randomIndex]}`;

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
