import { terser } from "rollup-plugin-terser";
import cleaner from "rollup-plugin-cleaner";

const paths = {
	src: "src/browser",
	dist: "out",
};

const isProd = process.env.NODE_ENV === "production";

export default {
	input: `${paths.src}/app.js`,
	output: {
		file: `${paths.dist}/js/app.js`,
		format: "esm",
		plugins: [isProd && terser()].filter(Boolean),
	},
	plugins: [
		cleaner({
			targets: [paths.dist],
		}),
	],
};
