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

		const scriptNonce = nonce(getNonceValuesForType("script"));
		const styleNonce = nonce(getNonceValuesForType("style"));

		const directives = [
			`default-src 'self'`,
			`connect-src 'self' ws:`,
			`script-src 'self' https://xxxxxx ${scriptNonce}`,
			`style-src 'self' ${styleNonce}`,
			`font-src 'self'`,
			`img-src 'self' https://gravatar.com/`,
			`object-src 'none'`,
			`frame-src https://xxxxxx`,
			`sandbox allow-forms allow-scripts allow-same-origin allow-modals`,
		].join("; ");

		// context.res.setHeader("Content-Security-Policy", directives);
	}

	middleware._name = "helmet-csp";

	return middleware;
}

cspMiddleware.generateScriptValue = generateNonceValueForType("script");
cspMiddleware.generateStyleValue = generateNonceValueForType("style");

module.exports = cspMiddleware;
