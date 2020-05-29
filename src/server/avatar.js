const avatarMap = new Map();

module.exports.getAvatarUrl = function getAvatarUrl(email, options) {
	if (avatarMap.has(email)) {
		return avatarMap.get(email);
	}
	const randomNumber = Math.round(Math.random() * 10);
	const url = `/avatars/avataaars-${randomNumber}.png`;
	avatarMap.set(email, url);
	return url;
};
