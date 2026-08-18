export const CATALOG = {
	"tee-dtg": {
		name: "Single Tee — DTG Print",
		meta: "Your design · 1 piece",
		amount: 2400,
		photo: "/images/dtg.jpg",
		photoAlt: "Direct-to-garment printed t-shirt",
		service: "Direct to Garment",
		category: "apparel",
	},
	"cap-embroid": {
		name: "Embroidered Cap",
		meta: "Up to 5,000 stitches",
		amount: 2800,
		photo: "/images/Embroidery.jpg",
		photoAlt: "Custom embroidered cap",
		service: "Embroidery",
		category: "headwear",
	},
	"tee-5pack": {
		name: "5-Pack Tees — Screen Print",
		meta: "1 design, 1 color",
		amount: 9500,
		photo: "/images/screenprinting.jpg",
		photoAlt: "Screen printed t-shirt stack",
		service: "Screen Printing",
		category: "apparel",
	},
	"hoodie-dtf": {
		name: "Hoodie — DTF Print",
		meta: "Your design · 1 piece",
		amount: 4200,
		photo: "/images/DTF.jpg",
		photoAlt: "DTF printed hoodie",
		service: "Direct to Film",
		category: "apparel",
	},
	"polo-embroid": {
		name: "Polo — Embroidery",
		meta: "Left chest logo",
		amount: 3500,
		photo: "/images/silkscreen.jpg",
		photoAlt: "Embroidered polo shirt",
		service: "Embroidery",
		category: "apparel",
	},
	"tote-dtg": {
		name: "Tote Bag — DTG Print",
		meta: "Your design · 1 piece",
		amount: 1800,
		photo: "/images/wolf.jpg",
		photoAlt: "DTG printed tote bag",
		service: "Direct to Garment",
		category: "headwear",
	},
} as const;

export type ProductId = keyof typeof CATALOG;

export function formatUsd(cents: number) {
	return `$${Math.round(cents / 100)}`;
}

export function isProductId(value: string): value is ProductId {
	return value in CATALOG;
}
