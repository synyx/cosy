// this is a convenience entry point to load all files within this directory instead of requiring each file.
// if you're looking for the "index" view please refer to `root.js`

const path = require("path");
const glob = require("glob");

module.exports = function (app) {
	const routeFiles = glob.sync(path.join(__dirname, "./!(index).js"));
	for (let file of routeFiles) {
		require(file)(app);
	}
};
