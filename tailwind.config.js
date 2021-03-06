module.exports = {
	future: {
		removeDeprecatedGapUtilities: true,
		purgeLayersByDefault: true,
	},
	purge: {
		content: ["./src/server/templates/**/*.hbs", "./src/browser/**/*.js"],
	},
	theme: {
		extend: {
			colors: {
				white: "#FCFCFC",
				grey: "#D8D8D8",
				black: "#313131"
			},
		},
	},
	variants: {},
	plugins: [],
};
