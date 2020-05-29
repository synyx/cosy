module.exports.getAvatarUrl = function getAvatarUrl(email, options) {
	const randomNumber = Math.round(Math.random() * 10);
	return `/avatars/avataaars-${randomNumber}.png`;
};
