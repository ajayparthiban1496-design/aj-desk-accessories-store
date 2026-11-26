import type { Category, Product } from "@/types";
import { unsplash } from "@/lib/utils";

/** Verified Unsplash photo IDs used across the store. */
export const IMG = {
  heroDesk: "1593062096033-9a26b09da705",
  warmLamp: "1616400619175-5beda3a17896",
  brightDesk: "1499951360447-b19be8fe80f5",
  whiteDesk: "1518455027359-f3f8164ba6bd",
  laptopStand: "1593642632559-0c6d3fc62b89",
  laptopSilver: "1611186871348-b1ce696e52c9",
  laptopWood: "1484788984921-03950022c9ef",
  blackMouse: "1615663245857-ac93bb7c39e7",
  greyMouse: "1527864550417-7fd91fc51a46",
  backlitMonitor: "1614624532983-4ce03382d63d",
  floorLamp: "1507473885765-e6ed057f782c",
  headphones: "1546435770-a3e426bf472b",
  headphonesCord: "1572536147248-ac59a8abfa4b",
  phone: "1586953208448-b95a79798f07",
  monitorDesk: "1586210579191-33b45e38fa2c",
  flatlay: "1611532736597-de2d4265fba3",
  tableFlatlay: "1587614382346-4ec70e388b28",
  keyboardMarble: "1618384887929-16ec33fab9ef",
  keyboardWhite: "1587829741301-dc798b83add3",
} as const;

export const categories: Category[] = [
  { id: "stands", slug: "stands", name: "Stands & Risers", description: "Lift your screens to eye level.", image: unsplash(IMG.laptopStand, 800) },
  { id: "mats", slug: "mats", name: "Desk Mats & Pads", description: "Felt, cork and vegan leather surfaces.", image: unsplash(IMG.brightDesk, 800) },
  { id: "lighting", slug: "lighting", name: "Lighting", description: "Glare-free light for late sessions.", image: unsplash(IMG.warmLamp, 800) },
  { id: "organisation", slug: "organisation", name: "Organisation", description: "Trays, docks and cable control.", image: unsplash(IMG.tableFlatlay, 800) },
  { id: "audio", slug: "audio", name: "Audio Stands", description: "A proper home for your headphones.", image: unsplash(IMG.headphones, 800) },
];

const WALNUT = { name: "Walnut", swatch: "#6b4429" };
const OAK = { name: "Oak", swatch: "#c9a272" };
const BLACK = { name: "Midnight", swatch: "#1f1f1f" };
const SILVER = { name: "Silver", swatch: "#c9cbcd" };
const SPACE = { name: "Space Grey", swatch: "#55585c" };
const CHARCOAL = { name: "Charcoal Felt", swatch: "#3a3a3a" };
const SAND = { name: "Sand Felt", swatch: "#cbbba2" };
const TAN = { name: "Tan Leather", swatch: "#a8703f" };

function v(productId: string, list: { name: string; swatch: string }[], stock = 40) {
  return list.map((x, i) => ({
    id: `${productId}-${x.name.toLowerCase().replace(/\s+/g, "-")}`,
    ...x,
    stock: i === list.length - 1 && stock < 40 ? stock : 40 - i * 7,
    sku: null,
  }));
}

const base = { isFeatured: false, compareAtPrice: null, badge: null } as const;

/**
 * The catalogue as launched. Two jobs:
 * 1. Source for the Medusa seed (`npm run catalog:export` writes it to the backend).
 * 2. Offline backup: shown when the shop backend can't be reached; ordering is paused then.
 * Live prices, stock and products always come from Medusa.
 */
export const seedProducts: Product[] = [
  {
    ...base,
    id: "p-arc-stand",
    slug: "arc-aluminium-laptop-stand",
    name: "Arc Aluminium Laptop Stand",
    tagline: "One-piece aluminium, lifts your screen 15 cm.",
    description:
      "Machined from a single sheet of 5 mm aerospace-grade aluminium, the Arc raises your laptop to a healthier eye line and opens up the space underneath for a keyboard. Silicone pads grip without scratching, and the open back pulls heat away from your machine.",
    category: "stands",
    price: 349900,
    compareAtPrice: 429900,
    images: [unsplash(IMG.laptopStand), unsplash(IMG.laptopSilver), unsplash(IMG.whiteDesk)],
    variants: v("p-arc-stand", [SILVER, SPACE, BLACK]),
    features: ["Raises screen by 15 cm", "Fits 11–17\" laptops", "Passive cooling channel", "Non-slip silicone pads"],
    specs: { Material: "6061 anodised aluminium", Dimensions: "26 × 24 × 15 cm", Weight: "1.1 kg", "Max load": "8 kg", Warranty: "5 years" },
    badge: "Bestseller",
    isFeatured: true,
    createdAt: "2026-03-02T10:00:00Z",
  },
  {
    ...base,
    id: "p-walnut-riser",
    slug: "walnut-laptop-riser",
    name: "Walnut Laptop Riser",
    tagline: "Solid hardwood with a hand-oiled finish.",
    description:
      "Cut from FSC-certified American walnut and finished by hand with a natural hardwax oil. A gentle 12° tilt makes typing on the laptop keyboard comfortable when you are not using an external one, and the grain gets richer with age.",
    category: "stands",
    price: 459900,
    images: [unsplash(IMG.laptopWood), unsplash(IMG.heroDesk), unsplash(IMG.warmLamp)],
    variants: v("p-walnut-riser", [WALNUT, OAK], 6),
    features: ["Solid FSC walnut or oak", "12° ergonomic tilt", "Hand-oiled finish", "Felt-lined base"],
    specs: { Material: "Solid American walnut", Dimensions: "30 × 25 × 9 cm", Weight: "1.4 kg", Finish: "Natural hardwax oil", Warranty: "5 years" },
    badge: "Limited",
    isFeatured: true,
    createdAt: "2026-06-10T10:00:00Z",
  },
  {
    ...base,
    id: "p-plinth-riser",
    slug: "plinth-monitor-riser-shelf",
    name: "Plinth Monitor Riser Shelf",
    tagline: "A desk shelf that hides the clutter.",
    description:
      "A wide shelf that lifts your monitor and creates a dedicated home for keyboards, notebooks and chargers underneath. Steel legs, a hardwood top, and an integrated cable slot at the back.",
    category: "stands",
    price: 799900,
    compareAtPrice: 899900,
    images: [unsplash(IMG.monitorDesk), unsplash(IMG.backlitMonitor), unsplash(IMG.whiteDesk)],
    variants: v("p-plinth-riser", [WALNUT, OAK, BLACK]),
    features: ["90 cm wide top", "Keyboard fits underneath", "Rear cable slot", "Holds up to 30 kg"],
    specs: { Material: "Walnut veneer, powder-coated steel", Dimensions: "90 × 24 × 11 cm", Weight: "4.2 kg", "Max load": "30 kg", Warranty: "5 years" },
    isFeatured: true,
    createdAt: "2026-02-14T10:00:00Z",
  },
  {
    ...base,
    id: "p-felt-mat",
    slug: "merino-felt-desk-mat",
    name: "Merino Felt Desk Mat",
    tagline: "Soft, quiet, and kind to your wrists.",
    description:
      "Pressed from 100% merino wool felt with a natural cork underside that stays put. It dampens keyboard noise, gives your mouse a smooth glide, and turns a hard desk into a warm, calm surface.",
    category: "mats",
    price: 249900,
    images: [unsplash(IMG.brightDesk), unsplash(IMG.whiteDesk), unsplash(IMG.flatlay)],
    variants: v("p-felt-mat", [CHARCOAL, SAND]),
    features: ["100% merino wool felt", "Natural cork base", "Dampens typing noise", "Two sizes available"],
    specs: { Material: "Merino felt, natural cork", Dimensions: "90 × 40 cm", Thickness: "4 mm", Care: "Spot clean, lint roller", Warranty: "2 years" },
    badge: "Bestseller",
    isFeatured: true,
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    ...base,
    id: "p-leather-mat",
    slug: "vegan-leather-desk-pad",
    name: "Vegan Leather Desk Pad",
    tagline: "Water-resistant, reversible, refined.",
    description:
      "A double-sided desk pad in plant-based vegan leather — smooth on one side, micro-suede on the other. Spill-resistant, wipes clean, and its stitched edges will not fray.",
    category: "mats",
    price: 189900,
    compareAtPrice: 229900,
    images: [unsplash(IMG.whiteDesk), unsplash(IMG.brightDesk), unsplash(IMG.keyboardWhite)],
    variants: v("p-leather-mat", [TAN, BLACK, SAND]),
    features: ["Reversible two-tone", "Water-resistant surface", "Stitched edges", "Rolls flat for travel"],
    specs: { Material: "Plant-based PU leather", Dimensions: "80 × 40 cm", Thickness: "3 mm", Care: "Wipe with damp cloth", Warranty: "1 year" },
    createdAt: "2026-04-05T10:00:00Z",
  },
  {
    ...base,
    id: "p-glide-pad",
    slug: "glide-precision-mouse-pad",
    name: "Glide Precision Mouse Pad",
    tagline: "Micro-weave cloth tuned for control.",
    description:
      "A compact mouse pad with a tightly woven micro-texture surface for precise tracking on any sensor. The anti-fray edge and dense rubber base keep it flat and in place for years.",
    category: "mats",
    price: 79900,
    images: [unsplash(IMG.blackMouse), unsplash(IMG.greyMouse), unsplash(IMG.keyboardMarble)],
    variants: v("p-glide-pad", [BLACK, CHARCOAL, SAND]),
    features: ["Micro-weave control surface", "Anti-fray stitched edge", "4 mm rubber base", "Machine washable"],
    specs: { Material: "Micro-weave cloth, natural rubber", Dimensions: "36 × 30 cm", Thickness: "4 mm", Warranty: "1 year" },
    createdAt: "2026-05-11T10:00:00Z",
  },
  {
    ...base,
    id: "p-halo-bar",
    slug: "halo-monitor-light-bar",
    name: "Halo Monitor Light Bar",
    tagline: "Asymmetric light, zero screen glare.",
    description:
      "Halo clips onto your monitor and casts light only onto your desk — never onto your screen or into your eyes. Adjust brightness and colour temperature from warm 2700K to daylight 6500K with the wireless dial, and let the ambient sensor do the rest.",
    category: "lighting",
    price: 549900,
    compareAtPrice: 649900,
    images: [unsplash(IMG.backlitMonitor), unsplash(IMG.monitorDesk), unsplash(IMG.heroDesk)],
    variants: v("p-halo-bar", [BLACK, SILVER]),
    features: ["Asymmetric anti-glare optics", "2700K–6500K colour range", "Wireless control dial", "Auto-dimming sensor", "USB-C powered"],
    specs: { Power: "USB-C, 5V/1A", Length: "45 cm", CRI: "Ra ≥ 95", "Colour temp.": "2700K–6500K", Warranty: "2 years" },
    badge: "Bestseller",
    isFeatured: true,
    createdAt: "2026-07-01T10:00:00Z",
  },
  {
    ...base,
    id: "p-lumen-lamp",
    slug: "lumen-architect-desk-lamp",
    name: "Lumen Architect Desk Lamp",
    tagline: "A classic silhouette with modern LED.",
    description:
      "An architect-style lamp with a weighted steel base, friction hinges that hold their position, and a flicker-free LED module rated for 50,000 hours. Touch-dim through five levels.",
    category: "lighting",
    price: 399900,
    images: [unsplash(IMG.floorLamp), unsplash(IMG.warmLamp), unsplash(IMG.brightDesk)],
    variants: v("p-lumen-lamp", [BLACK, { name: "Bone", swatch: "#e8e2d6" }]),
    features: ["Flicker-free LED", "5-level touch dimming", "Friction hinges", "Weighted steel base"],
    specs: { Power: "8W LED, 220–240V", Height: "Up to 62 cm", "Colour temp.": "3000K", Lifespan: "50,000 hours", Warranty: "2 years" },
    createdAt: "2026-03-28T10:00:00Z",
  },
  {
    ...base,
    id: "p-ember-lamp",
    slug: "ember-ambient-glow-lamp",
    name: "Ember Ambient Glow Lamp",
    tagline: "Sunset tones for evening focus.",
    description:
      "A small rechargeable lamp that bathes the wall behind your desk in warm amber light. Built to reduce eye strain during late sessions and to make your workspace feel like somewhere you want to be.",
    category: "lighting",
    price: 299900,
    images: [unsplash(IMG.warmLamp), unsplash(IMG.heroDesk), unsplash(IMG.laptopWood)],
    variants: v("p-ember-lamp", [{ name: "Amber", swatch: "#d08a3b" }, { name: "Rose", swatch: "#c97a72" }]),
    features: ["Rechargeable, 8-hour battery", "Stepless dimming", "Warm 2200K glow", "Aluminium body"],
    specs: { Battery: "4000 mAh, USB-C", Height: "24 cm", "Colour temp.": "2200K", Warranty: "1 year" },
    badge: "New",
    createdAt: "2026-10-18T10:00:00Z",
  },
  {
    ...base,
    id: "p-dock-tray",
    slug: "dock-walnut-desk-tray",
    name: "Dock Walnut Desk Tray",
    tagline: "A place for pens, keys and everything small.",
    description:
      "A carved walnut catch-all with three compartments and a magnetic phone rest. It keeps the small things together so your desk stays clear for the work that matters.",
    category: "organisation",
    price: 219900,
    images: [unsplash(IMG.tableFlatlay), unsplash(IMG.flatlay), unsplash(IMG.laptopWood)],
    variants: v("p-dock-tray", [WALNUT, OAK]),
    features: ["Solid walnut", "Three compartments", "Magnetic phone rest", "Felt-lined base"],
    specs: { Material: "Solid walnut, wool felt", Dimensions: "28 × 12 × 3 cm", Weight: "540 g", Warranty: "5 years" },
    createdAt: "2026-02-02T10:00:00Z",
  },
  {
    ...base,
    id: "p-cable-kit",
    slug: "tidy-cable-management-kit",
    name: "Tidy Cable Management Kit",
    tagline: "Magnetic clips, sleeves and an under-desk tray.",
    description:
      "Everything you need to make cables disappear: an under-desk steel tray, braided sleeves, six weighted magnetic clips and reusable velcro ties. Installs in fifteen minutes with no drilling.",
    category: "organisation",
    price: 149900,
    images: [unsplash(IMG.flatlay), unsplash(IMG.whiteDesk), unsplash(IMG.monitorDesk)],
    variants: v("p-cable-kit", [BLACK, { name: "White", swatch: "#f1f1ef" }]),
    features: ["Under-desk steel tray", "6 magnetic cable clips", "2 m braided sleeve", "No-drill adhesive mounts"],
    specs: { Contents: "Tray, 6 clips, sleeve, 10 ties", "Tray size": "40 × 12 × 10 cm", Warranty: "1 year" },
    createdAt: "2026-08-08T10:00:00Z",
  },
  {
    ...base,
    id: "p-stand-phone",
    slug: "perch-phone-stand",
    name: "Perch Phone Stand",
    tagline: "Weighted aluminium, perfect viewing angle.",
    description:
      "A heavy little stand that holds your phone at a readable angle for video calls and two-factor codes. Works in portrait or landscape, with a pass-through for the charging cable.",
    category: "organisation",
    price: 99900,
    images: [unsplash(IMG.phone), unsplash(IMG.tableFlatlay), unsplash(IMG.brightDesk)],
    variants: v("p-stand-phone", [SILVER, SPACE]),
    features: ["Weighted aluminium base", "Portrait or landscape", "Cable pass-through", "Fits all phone sizes"],
    specs: { Material: "Aluminium", Dimensions: "8 × 9 × 11 cm", Weight: "320 g", Warranty: "2 years" },
    badge: "New",
    createdAt: "2026-09-21T10:00:00Z",
  },
  {
    ...base,
    id: "p-hp-stand",
    slug: "cradle-headphone-stand",
    name: "Cradle Headphone Stand",
    tagline: "Walnut and steel, shaped to protect the headband.",
    description:
      "A wide, padded cradle preserves the shape of your headband, while the solid walnut base anchors it to the desk. Includes a tuck-away hook for your cable.",
    category: "audio",
    price: 279900,
    images: [unsplash(IMG.headphones), unsplash(IMG.headphonesCord), unsplash(IMG.whiteDesk)],
    variants: v("p-hp-stand", [WALNUT, OAK, BLACK]),
    features: ["Solid walnut base", "Leather-padded cradle", "Integrated cable hook", "Fits all over-ear headphones"],
    specs: { Material: "Walnut, steel, leather", Height: "27 cm", Weight: "780 g", Warranty: "5 years" },
    createdAt: "2026-05-30T10:00:00Z",
  },
];
