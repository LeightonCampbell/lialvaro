const STORAGE_KEY = "lialvaro-cart";

function getCart() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function setCart(cart) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
	updateCount();
}

function cartCount(cart = getCart()) {
	return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
}

function updateCount() {
	const count = String(cartCount());
	document.querySelectorAll("[data-cart-count]").forEach((el) => {
		el.textContent = count;
	});
}

function addProduct(id) {
	if (!id) return;
	const cart = getCart();
	cart[id] = (Number(cart[id]) || 0) + 1;
	setCart(cart);
}

async function startCheckout(button) {
	const cart = getCart();
	const items = Object.entries(cart).map(([id, quantity]) => ({ id, quantity }));
	if (items.length === 0) {
		window.location.hash = "store";
		return;
	}

	const originalHtml = button.innerHTML;
	button.disabled = true;
	button.setAttribute("aria-busy", "true");
	button.textContent = "Starting checkout…";

	try {
		const response = await fetch("/api/create-checkout-session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items }),
		});
		const data = await response.json();
		if (!response.ok || !data.url) {
			throw new Error(data.error || "Checkout failed.");
		}
		window.location.href = data.url;
	} catch (error) {
		button.disabled = false;
		button.removeAttribute("aria-busy");
		button.innerHTML = originalHtml;
		updateCount();
		window.alert(error instanceof Error ? error.message : "Checkout failed.");
	}
}

function initCart() {
	if (window.location.pathname.replace(/\/$/, "") === "/order-confirmed") {
		localStorage.removeItem(STORAGE_KEY);
	}

	updateCount();

	document.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const addBtn = target.closest("[data-product-id]");
		if (addBtn instanceof HTMLElement) {
			event.preventDefault();
			addProduct(addBtn.dataset.productId);
			const label = addBtn.textContent;
			addBtn.textContent = "Added";
			window.setTimeout(() => {
				addBtn.textContent = label;
			}, 900);
			return;
		}

		const checkoutBtn = target.closest("[data-checkout]");
		if (checkoutBtn instanceof HTMLElement) {
			event.preventDefault();
			startCheckout(checkoutBtn);
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initCart);
} else {
	initCart();
}
