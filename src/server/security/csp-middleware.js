const contextMap = new WeakMap();

function generateNonceValueForType(type) {
	return function (context) {
		// prepare context maps
		// (╯°□°）╯︵ ┻━┻
		const typeMap = contextMap.get(context) || new Map();
		const values = typeMap.get(type) || [];
		typeMap.set(type, values);
		contextMap.set(context, typeMap);

		// finally generate a random csp nonce value
		const cspValue = require("crypto").randomBytes(16).toString("base64");
		values.push(cspValue);

		//  ┬──┬◡ﾉ(° -°ﾉ)
		return cspValue;
	};
}

function getNonceValuesForType(type) {
	return function getNonceValuesForType(context) {
		const map = contextMap.get(context) || new Map();
		return map.get(type) || [];
	};
}

function cspMiddleware() {
	async function middleware(context, next) {
		// at first render all views. this will fill the nonceGenerator with
		// optional values for our current context.
		await next(context);

		const nonce = (getter) =>
			getter(context)
				.map((v) => `'nonce-${v}'`)
				.join(" ");

		const directives = [
			`default-src 'self'`,
			`script-src 'self' ${nonce(getNonceValuesForType("script"))}`,
			`style-src 'self' ${nonce(getNonceValuesForType("style"))}`,
			`font-src 'self'`,
			`img-src 'self'`,
			`object-src 'none'`,
			`sandbox allow-forms allow-scripts allow-same-origin`,
		].join("; ");

		context.res.setHeader("Content-Security-Policy", directives);
	}

	middleware._name = "helmet-csp";

	return middleware;
}

cspMiddleware.generateScriptValue = generateNonceValueForType("script");
cspMiddleware.generateStyleValue = generateNonceValueForType("style");

module.exports = cspMiddleware;
