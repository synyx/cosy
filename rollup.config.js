import { terser } from "rollup-plugin-terser";
import cleaner from "rollup-plugin-cleaner";
import replace from "@rollup/plugin-replace";

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
		replace({
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		}),
	],
};
