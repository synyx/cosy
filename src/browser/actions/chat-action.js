import * as chat from "../jitsi.js";

export function createChatActions({ send, player, officeSvg, playerAvatar }) {
	let chatStartListeners = [];
	let chatEndListeners = [];

	function beginChat(roomName) {
		const room = chat.startChat({ roomName });

		function sendChatLeft() {
			send({
				type: "chat-user-left",
				content: {
					roomName: room.roomName,
					userName: player.name,
				},
			});
			for (let listener of chatEndListeners) {
				listener();
			}
		}

		window.addEventListener("beforeunload", sendChatLeft);

		room.on("close", function () {
			sendChatLeft();
			window.removeEventListener("beforeunload", sendChatLeft);
		});

		for (let listener of chatStartListeners) {
			listener();
		}

		return room;
	}

	function getIntersectingChatElement() {
		const runningChats = [...document.querySelectorAll("circle[id^=chat-]")];
		return runningChats.find((chat) => {
			// kudos https://stackoverflow.com/questions/33490334/check-if-a-circle-is-contained-in-another-circle
			const x1 = chat.cx.baseVal.value;
			const y1 = chat.cy.baseVal.value;
			const c1 = chat.r.baseVal.value;
			const x2 = playerAvatar.cx.baseVal.value;
			const y2 = playerAvatar.cy.baseVal.value;
			const c2 = playerAvatar.r.baseVal.value;
			const d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
			const playerInArea = c1 > d + c2;
			return playerInArea;
		});
	}

	function isPlayerInRangeOfARunningChat() {
		const joinableChat = getIntersectingChatElement();
		return Boolean(joinableChat);
	}

	return {
		onChatStart(listener) {
			chatStartListeners.push(listener);
			return () => {
				chatStartListeners = chatStartListeners.filter((l) => l !== listener);
			};
		},

		onChatEnd(listener) {
			chatEndListeners.push(listener);
			return () => {
				chatEndListeners = chatEndListeners.filter((l) => l !== listener);
			};
		},

		handleRoomChange({ previousRoom, nextRoom }) {},

		handleWebsocket(type, content) {
			switch (type) {
				case "chat-started": {
					const { roomName, point } = content;

					const circle = document.createElementNS(
						"http://www.w3.org/2000/svg",
						"circle",
					);
					circle.setAttributeNS(null, "id", `chat-${roomName}`);
					circle.setAttributeNS(null, "cx", point.x);
					circle.setAttributeNS(null, "cy", point.y);
					circle.setAttributeNS(null, "r", "50");
					circle.setAttributeNS(null, "fill", "lime");
					circle.setAttributeNS(null, "fill-opacity", "0.25");

					circle.dataset.chatRoomName = roomName;

					circle.innerHTML = `
						<animate attributeType="SVG" attributeName="r" begin="0s" dur="3.5s" repeatCount="indefinite" from="0" to="66"/>
						<animate attributeType="CSS" attributeName="stroke-width" begin="0s"  dur="3.5s" repeatCount="indefinite" from="10" to="0" />
						<animate attributeType="CSS" attributeName="opacity" begin="0s"  dur="3.5s" repeatCount="indefinite" from="1" to="0"/>
					`;

					const parent = document.getElementById("office-remote-actions");
					parent.append(circle);
					break;
				}

				case "chat-user-joined": {
					const { roomName, userName } = content;
					console.log("user joined a chat", { roomName, userName });
					break;
				}

				case "chat-user-left": {
					const { roomName, userName } = content;
					console.log("user left a chat", { roomName, userName });
					break;
				}

				case "chat-closed": {
					const circle = document.getElementById(`chat-${content.roomName}`);
					circle.remove();
					break;
				}
			}
		},

		actions: [
			// ===========================================================================
			// start a new chat
			// ===========================================================================
			{
				label: "hier ein Gespräch starten",
				shouldBeVisible: () => !isPlayerInRangeOfARunningChat(),
				attrs() {
					return [];
				},
				handleSelect({ currentRoom, attrs }) {
					const rnd = () => Math.random().toString(36).substr(2, 8);
					const roomName = `${currentRoom.id}-${rnd()}`;
					const room = beginChat(roomName);
					send({
						type: "chat-started",
						content: {
							roomName: room.roomName,
							userName: player.name,
							point: {
								x: playerAvatar.cx.baseVal.value,
								y: playerAvatar.cy.baseVal.value,
							},
						},
					});
				},
			},
			// ===========================================================================
			// join a chat
			// ===========================================================================
			{
				label: "dem Gespräch beitreten",
				shouldBeVisible: () => isPlayerInRangeOfARunningChat(),
				attrs() {
					const joinableChat = getIntersectingChatElement();
					if (joinableChat) {
						return [["chatRoomName", joinableChat.dataset.chatRoomName]];
					}
					return [];
				},
				handleSelect({ currentRoom, attrs }) {
					const { chatRoomName } = event.target.dataset;
					beginChat(chatRoomName);
					send({
						type: "chat-user-joined",
						content: {
							roomName: chatRoomName,
							userName: player.name,
						},
					});
				},
			},
		],
	};
}
