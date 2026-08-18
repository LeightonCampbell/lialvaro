const CART_KEY = "lialvaro_cart";

function getCart() {
	try {
		return JSON.parse(localStorage.getItem(CART_KEY) || "{}");
	} catch {
		return {};
	}
}

function saveCart(cart) {
	localStorage.setItem(CART_KEY, JSON.stringify(cart));
	updateCartBadge();
}

function addToCart(productId) {
	if (!productId) return;
	const cart = getCart();
	cart[productId] = (cart[productId] || 0) + 1;
	saveCart(cart);
}

function updateCartBadge() {
	const cart = getCart();
	const count = String(Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0));
	document.querySelectorAll("[data-cart-count]").forEach((el) => {
		el.textContent = count;
	});
}

async function checkout(button) {
	const cart = getCart();
	const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }));

	if (!items.length) {
		window.alert("Your cart is empty.");
		return;
	}

	const originalHtml = button?.innerHTML;
	if (button) {
		button.disabled = true;
		button.setAttribute("aria-busy", "true");
		button.textContent = "Starting checkout…";
	}

	try {
		const res = await fetch("/api/create-checkout-session", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items }),
		});
		const data = await res.json();
		if (data.url) {
			localStorage.removeItem(CART_KEY);
			window.location.href = data.url;
			return;
		}
		throw new Error(data.error || "unknown");
	} catch (error) {
		if (button) {
			button.disabled = false;
			button.removeAttribute("aria-busy");
			button.innerHTML = originalHtml;
			updateCartBadge();
		}
		window.alert("Checkout error: " + (error instanceof Error ? error.message : "unknown"));
	}
}

function initCart() {
	if (window.location.pathname.replace(/\/$/, "") === "/order-confirmed") {
		localStorage.removeItem(CART_KEY);
	}

	updateCartBadge();

	document.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const addBtn = target.closest("[data-product-id]");
		if (addBtn instanceof HTMLElement) {
			event.preventDefault();
			addToCart(addBtn.dataset.productId);
			addBtn.textContent = "Added ✓";
			window.setTimeout(() => {
				addBtn.textContent = "Add";
			}, 1200);
			return;
		}

		const checkoutBtn = target.closest("[data-checkout]");
		if (checkoutBtn instanceof HTMLElement) {
			event.preventDefault();
			checkout(checkoutBtn);
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initCart);
} else {
	initCart();
}
