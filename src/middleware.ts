import { defineMiddleware } from 'astro:middleware';

const CANONICAL_HOST = 'www.lialvaro.com';

function hasFileExtension(pathname: string): boolean {
	const last = pathname.split('/').pop() ?? '';
	return last.includes('.');
}

export const onRequest = defineMiddleware(async (context, next) => {
	const { url } = context;
	const { pathname } = url;

	// Astro ignores `src/pages/_*/` routes; expose BUILD_PLAN `/_styleguide/` via rewrite.
	if (pathname === '/_styleguide' || pathname === '/_styleguide/') {
		return context.rewrite('/styleguide/');
	}

	// Stage 0/4 owner-approved cutover: legacy design URL → `/design/`.
	if (pathname === '/design-your-apparel' || pathname === '/design-your-apparel/') {
		const redirectUrl = new URL('/design/', url);
		if (url.hostname === 'lialvaro.com') {
			redirectUrl.hostname = CANONICAL_HOST;
		}
		return Response.redirect(redirectUrl.toString(), 301);
	}

	// Owner lock (docs/OWNER_LOCKS.md): kill `/custom-printing/` → home + open quote modal.
	if (pathname === '/custom-printing' || pathname === '/custom-printing/') {
		const redirectUrl = new URL('/', url);
		redirectUrl.searchParams.set('quote', '1');
		if (url.hostname === 'lialvaro.com') {
			redirectUrl.hostname = CANONICAL_HOST;
		}
		return Response.redirect(redirectUrl.toString(), 301);
	}

	const shouldRedirectHost = url.hostname === 'lialvaro.com';
	// Never trailing-slash-redirect API routes: POST bodies (checkout/webhooks) break on 301.
	const isApiRoute = pathname === '/api' || pathname.startsWith('/api/');
	const shouldRedirectSlash =
		!isApiRoute &&
		pathname !== '/' &&
		!pathname.endsWith('/') &&
		!hasFileExtension(pathname);

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

