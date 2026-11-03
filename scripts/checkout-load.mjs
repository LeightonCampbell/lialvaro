const origin = process.env.LOAD_ORIGIN ?? 'http://localhost:4321';
const count = Number(process.env.LOAD_COUNT ?? 8);
const body = JSON.stringify({
  items: [{ variantId: 'var_sunrise_s_white', qty: 1, storeSlug: 'studio-north' }],
});

const results = await Promise.all(
  Array.from({ length: count }, () =>
    fetch(`${origin}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body,
    }).then(async (res) => ({ status: res.status, ok: res.ok })),
  ),
);

const bad = results.filter((result) => result.status >= 500 && result.status !== 503);
console.log(JSON.stringify({ count, statuses: results.map((result) => result.status) }));
if (bad.length) {
  console.error('Checkout load test returned unexpected server errors.');
  process.exit(1);
}
