export type StudioService = {
  slug: string;
  /** Nav + page title label */
  label: string;
  /** Value stored on quote submissions (matches existing triggers) */
  serviceValue: string;
  shortLabel: string;
  eyebrow: string;
  headline: string;
  lede: string;
  heroImage: string;
  heroAlt: string;
  bestFor: string;
  benefits: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  formIntro: string;
  askColors: boolean;
  minPiecesHint: string;
};

export const services: StudioService[] = [
  {
    slug: 'screen-printing',
    label: 'Screen Printing',
    serviceValue: 'Screen Printing',
    shortLabel: 'Screen print',
    eyebrow: 'Bulk-ready color',
    headline: 'Screen printing that looks sharp at any quantity.',
    lede: 'Bold, durable prints for teams, merch drops, and events — priced to reward larger runs without slowing you down.',
    heroImage: '/images/screenprinting.jpg',
    heroAlt: 'Screen printed custom t-shirts',
    bestFor: 'Larger runs, simple-to-mid artwork, and brand colors that need to stay consistent across every shirt.',
    benefits: [
      { title: 'Built for volume', body: 'Unit cost drops as quantity climbs — ideal for 24+ pieces and team sets.' },
      { title: 'Ink that lasts', body: 'Cured screen prints hold up through washes and repeated wear.' },
      { title: 'Clean brand color', body: 'Spot colors stay consistent from the first shirt to the last.' },
    ],
    steps: [
      { title: 'Tell us the run', body: 'Share garment, quantity, and how many print colors you need.' },
      { title: 'Approve the art', body: 'Upload files or describe the design — we confirm placement and size.' },
      { title: 'We print & fulfill', body: 'Production in Los Angeles with pickup or delivery options.' },
    ],
    formIntro: 'Get a screen-printing quote. We’ll reply within one business hour.',
    askColors: true,
    minPiecesHint: 'Screen printing shines from about a dozen pieces up — tell us your real count.',
  },
  {
    slug: 'direct-to-garment',
    label: 'Direct To Garment',
    serviceValue: 'Direct to Garment',
    shortLabel: 'DTG',
    eyebrow: 'Photo-ready detail',
    headline: 'DTG printing for small runs and detailed art.',
    lede: 'Full-color designs, soft hand feel, and no screen setup — perfect when you need a few pieces or complex artwork now.',
    heroImage: '/images/dtg.jpg',
    heroAlt: 'Direct-to-garment printed t-shirt',
    bestFor: 'Small batches, photo-quality graphics, gradients, and one-off or sample orders.',
    benefits: [
      { title: 'No screen minimums', body: 'Order what you need today — including singles and samples.' },
      { title: 'Full-color artwork', body: 'Gradients, photos, and fine detail print without extra color fees.' },
      { title: 'Soft finish', body: 'Ink sits in the fibers for a wearable, low-bulk feel.' },
    ],
    steps: [
      { title: 'Upload your file', body: 'PNG or high-res art works best for DTG detail.' },
      { title: 'Pick the garment', body: 'We help match fabric and color to your design.' },
      { title: 'Print & ship', body: 'Fast Los Angeles production with clear timing on every quote.' },
    ],
    formIntro: 'Request a DTG quote — great for detailed designs and smaller quantities.',
    askColors: false,
    minPiecesHint: 'DTG works from 1 piece up. Share your quantity and we’ll price it.',
  },
  {
    slug: 'dtf-heat-transfers',
    label: 'DTF and Heat Transfers',
    serviceValue: 'Direct to Film',
    shortLabel: 'DTF',
    eyebrow: 'Flexible transfers',
    headline: 'DTF and heat transfers for tough fabrics and mixed blanks.',
    lede: 'Vibrant transfers that press cleanly onto cotton, poly, blends, and more — ideal when screen or DTG isn’t the right fit.',
    heroImage: '/images/direct-to-film.jpg',
    heroAlt: 'Direct-to-film heat transfer apparel',
    bestFor: 'Mixed garment types, nylon-adjacent fabrics, hats with transfer areas, and crisp multi-color logos.',
    benefits: [
      { title: 'Works across fabrics', body: 'Press onto more blanks than traditional DTG alone.' },
      { title: 'Bright, durable film', body: 'Sharp edges and solid coverage for logos and text.' },
      { title: 'Gang-sheet friendly', body: 'Efficient for multi-size logos and name stacks.' },
    ],
    steps: [
      { title: 'Send the art', body: 'Vector or high-res PNG keeps transfer edges clean.' },
      { title: 'Choose press areas', body: 'Chest, sleeve, back — tell us every placement.' },
      { title: 'We print & press', body: 'Film produced and applied in-house for consistent results.' },
    ],
    formIntro: 'Get a DTF / heat-transfer quote tailored to your garments and placements.',
    askColors: false,
    minPiecesHint: 'Transfers scale from samples to mid-size runs. Include every placement you need.',
  },
  {
    slug: 'embroidery',
    label: 'Embroidery',
    serviceValue: 'Embroidery',
    shortLabel: 'Embroidery',
    eyebrow: 'Premium stitch',
    headline: 'Embroidery that elevates hats, polos, and workwear.',
    lede: 'Structured logos with lasting texture — for uniforms, corporate gifts, and headwear that needs to look finished.',
    heroImage: '/images/embroidery-hat.jpg',
    heroAlt: 'Custom embroidered hat',
    bestFor: 'Hats, polos, jackets, bags, and left-chest logos that should feel premium.',
    benefits: [
      { title: 'Texture that lasts', body: 'Thread holds up where ink can fade or crack.' },
      { title: 'Uniform-ready', body: 'Consistent placement across staff and team kits.' },
      { title: 'Digitizing included in quote', body: 'We price stitch count and placement clearly before you approve.' },
    ],
    steps: [
      { title: 'Share the logo', body: 'Vector files digitize cleanest; we can advise on raster art too.' },
      { title: 'Confirm size & place', body: 'Left chest, sleeve, cap front — we lock the placement.' },
      { title: 'Stitch & fulfill', body: 'Los Angeles embroidery with pickup or delivery.' },
    ],
    formIntro: 'Request an embroidery quote — hats, polos, jackets, and more.',
    askColors: true,
    minPiecesHint: 'Embroidery is strong from small sets upward. Note stitch colors if you already know them.',
  },
];

export function getService(slug: string): StudioService | undefined {
  return services.find((item) => item.slug === slug);
}

export function serviceSlugs(): string[] {
  return services.map((item) => item.slug);
}
