import { defineMiddleware } from 'astro:middleware';

const CANONICAL_HOST = 'www.lialvaro.com';

export const onRequest = defineMiddleware(async (context, next) => {
	const { url } = context;

	// Astro ignores `src/pages/_*/` routes; expose BUILD_PLAN `/_styleguide/` via rewrite.
	if (url.pathname === '/_styleguide' || url.pathname === '/_styleguide/') {
		return context.rewrite('/styleguide/');
	}

	const shouldRedirectHost = url.hostname === 'lialvaro.com';
	const shouldRedirectSlash = url.pathname !== '/' && !url.pathname.endsWith('/');

	if (shouldRedirectHost || shouldRedirectSlash) {
		const redirectUrl = new URL(url);
		if (shouldRedirectHost) {
			redirectUrl.hostname = CANONICAL_HOST;
		}
		if (shouldRedirectSlash) {
			redirectUrl.pathname = `${redirectUrl.pathname}/`;
		}

		return Response.redirect(redirectUrl.toString(), 301);
	}

	return next();
});
