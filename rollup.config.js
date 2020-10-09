require("dotenv").config();

import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

// NODE_ENV is set in the `<root>/.env` file intialized by `dotenv` above
// a configured environment variable will override the default one
const { NODE_ENV } = process.env;
console.log(`build app with NODE_ENV="${NODE_ENV}"`);

const paths = {
	src: "src/browser",
	dist: "out",
};

module.exports = {
	input: `${paths.src}/app.js`,
	output: {
		file: `${paths.dist}/js/app.js`,
		format: "esm",
	},
	plugins: [
		replace({
			"process.env.NODE_ENV": JSON.stringify(NODE_ENV),
		}),
		nodeResolve(),
		commonjs(),
	],
};
