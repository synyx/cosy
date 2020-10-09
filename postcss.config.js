const isProduction = process.env.NODE_ENV === "production";

module.exports = {
	plugins: [
		require("tailwindcss"),
		// minify css
		isProduction &&
			require("cssnano")({
				preset: "default",
			}),
	].filter(Boolean),
};
