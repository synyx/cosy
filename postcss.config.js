const isProduction = process.env.NODE_ENV === "production";

module.exports = {
	plugins: [
		require("tailwindcss"),
		// remove unused css classes
		isProduction &&
			require("@fullhuman/postcss-purgecss")({
				content: ["./src/server/templates/**/*.hbs"],
				defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
			}),
		// minify css
		isProduction &&
			require("cssnano")({
				preset: "default",
			}),
	].filter(Boolean),
};
