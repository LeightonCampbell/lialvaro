import { Canvas, Control, FabricImage, IText, type FabricObject } from 'fabric';
import studio from '../data/design-studio.json';
import {
  designedSideKeys,
  isBigTeeSize,
  isStudioTee,
  printBoxPx,
  sideObjectCount,
  teeQtyMax,
  teeTier,
  teeUnitCents,
  type StudioPlacement,
  type StudioProduct,
} from '../lib/design-studio';
import { uploadRejection } from '../lib/uploads';
import { addToCart, cartCount, readCart } from './cart';
import { track } from './analytics';

type HistoryEntry = string;

const GUEST_KEY = 'lialvaro_design_guest';

function guestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = `gst_${crypto.randomUUID().replace(/-/g, '')}`;
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return `gst_${Date.now()}`;
  }
}

function $(id: string) {
  return document.getElementById(id);
}

function show(el: HTMLElement | null) {
  if (el) el.hidden = false;
}

function hide(el: HTMLElement | null) {
  if (el) el.hidden = true;
}

const SHAPE_PATHS: Record<string, string> = {
  tee: 'M40 42 L70 28 L85 48 L115 48 L130 28 L160 42 L175 70 L155 82 L148 70 L148 210 L52 210 L52 70 L45 82 L25 70 Z',
  hoodie:
    'M58 74 C78 42 122 42 142 74 L158 66 C134 48 66 48 42 66 L58 74 L34 100 L56 116 L64 100 L64 210 L136 210 L136 100 L144 116 L166 100 Z',
  cap: 'M36 126 Q100 72 164 126 L156 146 Q100 162 44 146 Z M22 136 Q100 154 178 136 L172 148 Q100 166 28 148 Z',
};

const photoCache = new Map<string, string>();

function shapeKey(item: { shape?: string }) {
  return item.shape && SHAPE_PATHS[item.shape] ? item.shape : 'tee';
}

function placeholderSvg(shape: string, hex: string) {
  const path = SHAPE_PATHS[shapeKey({ shape })] ?? SHAPE_PATHS.tee;
  return `<svg viewBox="0 0 200 240" aria-hidden="true"><path fill="${hex}" d="${path}"/></svg>`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function coloredGarment(url: string, hex: string): Promise<string> {
  const key = `${url}|${hex.toLowerCase()}`;
  const cached = photoCache.get(key);
  if (cached) return Promise.resolve(cached);
  if (hex.toLowerCase() === '#1b2233') {
    photoCache.set(key, url);
    return Promise.resolve(url);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(url);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = image.data;
      const [tr, tg, tb] = hexToRgb(hex);
      const targetLum = (tr + tg + tb) / 3 / 255;
      const floor = targetLum > 0.75 ? 0.8 : targetLum < 0.22 ? 0.32 : 0.52;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i] ?? 0;
        const g = px[i + 1] ?? 0;
        const b = px[i + 2] ?? 0;
        if (r > 242 && g > 242 && b > 242) continue;
        const lum = Math.max(r, g, b) / 255;
        const shade = floor + Math.min(1, lum / 0.45) * (1 - floor);
        px[i] = Math.min(255, Math.round(tr * shade));
        px[i + 1] = Math.min(255, Math.round(tg * shade));
        px[i + 2] = Math.min(255, Math.round(tb * shade));
      }
      ctx.putImageData(image, 0, 0);
      const out = canvas.toDataURL('image/jpeg', 0.86);
      photoCache.set(key, out);
      resolve(out);
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

const deleteControl = new Control({
  x: 0.5,
  y: -0.5,
  offsetX: 16,
  offsetY: -16,
  cursorStyle: 'pointer',
  mouseUpHandler: (_event, transform) => {
    const target = transform.target;
    const parent = target.canvas;
    if (!parent) return false;
    parent.remove(target);
    parent.requestRenderAll();
    return true;
  },
  render: (ctx, left, top) => {
    const radius = 11;
    ctx.save();
    ctx.translate(left, top);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b2b';
    ctx.fill();
    ctx.strokeStyle = '#fffdf9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, 4);
    ctx.moveTo(4, -4);
    ctx.lineTo(-4, 4);
    ctx.stroke();
    ctx.restore();
  },
});

function styleHandles(obj: FabricObject) {
  obj.set({
    borderColor: '#2563eb',
    cornerColor: '#ffffff',
    cornerStrokeColor: '#1b2233',
    cornerSize: 14,
    touchCornerSize: 32,
    transparentCorners: false,
    borderScaleFactor: 2,
    padding: 6,
    lockScalingFlip: true,
    centeredScaling: true,
  });
  obj.controls = {
    ...obj.controls,
    delete: deleteControl,
  };
}

function centerInPrintBox(canvas: Canvas, obj: FabricObject, fraction = 0.78) {
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  const baseW = obj.width || 1;
  const baseH = obj.height || 1;
  const scale = Math.min((cw * fraction) / baseW, (ch * fraction) / baseH);
  obj.set({
    originX: 'center',
    originY: 'center',
    left: cw / 2,
    top: ch / 2,
    scaleX: scale,
    scaleY: scale,
  });
  styleHandles(obj);
  obj.setCoords();
}

export function initDesignStudio() {
  const canvasEl = $('studioCanvas') as HTMLCanvasElement | null;
  const stage = $('studioStage');
  const mockup = $('studioMockup');
  const printFrame = $('printFrame');
  const statusEl = $('studioStatus');
  const priceEl = $('studioPrice');
  const warningEl = $('studioWarnings');
  const emptyCtas = $('emptyCtas');
  if (!canvasEl || !stage || !mockup || !printFrame || !statusEl || !priceEl || !warningEl) return;

  let product: StudioProduct = studio.products[0];
  let colorId = product.colors.find((c) => c.id === 'black')?.id ?? product.colors[0]?.id ?? 'white';
  let side: string = Object.keys(product.placements)[0] ?? 'front';
  let canvas: Canvas | null = null;
  let history: HistoryEntry[] = [];
  let historyIndex = -1;
  let applyingHistory = false;
  let zoom = 1;
  let colorToken = 0;
  let catalogCategory = 'T-shirts';
  const warnings: string[] = [];
  const sideCanvases: Record<string, string> = {};
  const sizeQty = new Map<string, number>();
  let restoringSide = false;

  function setStatus(msg: string) {
    statusEl.textContent = msg;
  }

  function setWarnings(list: string[]) {
    warningEl.hidden = list.length === 0;
    warningEl.innerHTML = list.map((w) => `<li>${w}</li>`).join('');
  }

  function currentPlacement() {
    return (product.placements as Record<string, (typeof product.placements)[keyof typeof product.placements]>)[side];
  }

  function garmentHex() {
    return product.colors.find((c) => c.id === colorId)?.hex ?? '#f5f5f5';
  }

  function money(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  function syncPrice() {
    const root = $('designStudioRoot');
    try {
      const map = JSON.parse(root?.dataset.priceMap || '{}') as Record<string, number>;
      if (map[product.id]) priceEl.dataset.cents = String(map[product.id]);
    } catch {
      /* ignore */
    }
    const priced = Number(priceEl.dataset.cents ?? '0');
    priceEl.textContent = priced > 0 ? money(priced) : '—';
    syncQtyTotals();
  }

  function placementImage(placement: { image?: string }): string | undefined {
    return placement.image;
  }

  function syncProductCard() {
    const name = $('productName');
    const blurb = $('productBlurb');
    const thumb = $('productThumb');
    const colorLabel = $('selectedColorLabel');
    const placement = currentPlacement();
    const photo = $('studioPhoto') as HTMLImageElement | null;
    const frame = $('mockupFrame');
    const note = $('previewNote');
    if (name) name.textContent = product.label;
    if (blurb) blurb.textContent = product.blurb;
    if (colorLabel) {
      colorLabel.textContent = product.colors.find((c) => c.id === colorId)?.label ?? colorId;
    }
    const image = placement ? placementImage(placement) : undefined;
    const shape = shapeKey(product as { shape?: string });
    const path = document.getElementById('garmentPath');
    if (path) path.setAttribute('d', SHAPE_PATHS[shape] ?? SHAPE_PATHS.tee);
    mockup.style.color = garmentHex();
    mockup.dataset.shape = shape;
    if (photo && frame && photo.dataset.bound !== '1') {
      photo.dataset.bound = '1';
      photo.addEventListener('load', () => {
        const frameEl = $('mockupFrame');
        if (!frameEl || !photo.naturalWidth || !photo.naturalHeight) return;
        const ratio = `${photo.naturalWidth} / ${photo.naturalHeight}`;
        if (frameEl.style.aspectRatio === ratio) return;
        frameEl.style.aspectRatio = ratio;
        layoutCanvas();
      });
    }
    if (photo && frame) {
      if (image) {
        const token = ++colorToken;
        const hex = garmentHex();
        photo.hidden = false;
        mockup.hidden = true;
        frame.classList.add('has-photo');
        void coloredGarment(image, hex).then((src) => {
          if (token !== colorToken) return;
          photo.src = src;
        });
      } else {
        colorToken += 1;
        photo.hidden = true;
        mockup.hidden = false;
        frame.classList.remove('has-photo');
      }
    }
    if (thumb) {
      thumb.style.background = garmentHex();
    }
    if (note) note.hidden = true;
  }

  function syncCartBadge() {
    const badge = $('studioCartBadge');
    if (!badge) return;
    const count = cartCount(readCart());
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }

  function syncEmptyCtas() {
    if (!emptyCtas || !canvas) return;
    emptyCtas.hidden = canvas.getObjects().length > 0;
    syncPricingGate();
    markDesignedThumbs();
  }

  function markDesignedThumbs() {
    const wrap = $('sideButtons');
    if (!wrap) return;
    const keys = Object.keys(placementMap());
    wrap.querySelectorAll('button').forEach((btn, index) => {
      const key = keys[index];
      if (!key) return;
      const designed = objectsInJson(sideCanvases[key]) > 0 || (key === side && (canvas?.getObjects().length ?? 0) > 0);
      btn.classList.toggle('is-designed', designed);
      const label = placementMap()[key]?.label ?? key;
      btn.setAttribute('aria-label', designed ? `${label}, design saved` : label);
    });
  }

  function objectsInJson(json?: string) {
    return sideObjectCount(json);
  }

  function placementMap() {
    return product.placements as Record<string, StudioPlacement>;
  }

  function designedKeys() {
    if (canvas && !restoringSide) saveCurrentSide();
    return designedSideKeys(sideCanvases);
  }

  function hasDesign() {
    if (canvas && canvas.getObjects().length > 0) return true;
    return Object.values(sideCanvases).some((json) => objectsInJson(json) > 0);
  }

  function syncPricingGate() {
    if (canvas) saveCurrentSide();
    const btn = $('btnSeePricing') as HTMLButtonElement | null;
    if (!btn) return;
    const ready = hasDesign();
    btn.disabled = !ready;
    btn.title = ready ? 'See pricing' : 'Add a design to see pricing';
  }

  function adultSizes() {
    const shape = (product as { shape?: string }).shape;
    if (shape === 'cap') return ['OS'];
    const guide = (product as { sizeGuide?: { sizes?: string[] } }).sizeGuide;
    return guide?.sizes?.length ? guide.sizes : ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  }

  function pieceCount() {
    return adultSizes().reduce((sum, size) => sum + (sizeQty.get(size) ?? 0), 0);
  }

  function unitCentsForSize(size: string, total = pieceCount()) {
    const positions = Math.max(1, designedKeys().length);
    if (isStudioTee(product)) return teeUnitCents({ totalPieces: total, size, printPositions: positions });
    return Number(priceEl.dataset.cents ?? '0');
  }

  function orderCents() {
    const total = pieceCount();
    return adultSizes().reduce((sum, size) => sum + unitCentsForSize(size, total) * (sizeQty.get(size) ?? 0), 0);
  }

  function syncQtyTotals() {
    const total = pieceCount();
    const tee = isStudioTee(product);
    const subtotal = orderCents();
    const units = adultSizes()
      .filter((size) => (sizeQty.get(size) ?? 0) > 0)
      .map((size) => unitCentsForSize(size, total));
    const each = units.length ? Math.min(...units) : tee ? teeTier(Math.max(1, total)).cents : Number(priceEl.dataset.cents ?? '0');
    const mixed = new Set(units).size > 1;
    const totalEl = $('qtyTotal');
    const subEl = $('qtySubtotal');
    const note = $('qtyDelivery');
    const priceNote = $('qtyPriceNote');
    const addBtn = $('btnExport') as HTMLButtonElement | null;
    if (totalEl) totalEl.textContent = String(total);
    if (each > 0) {
      priceEl.dataset.cents = String(each);
      priceEl.textContent = mixed ? `from ${money(each)}` : money(each);
    }
    if (subEl) subEl.textContent = subtotal > 0 ? money(subtotal) : '—';
    if (priceNote) {
      if (tee) {
        const tier = teeTier(Math.max(1, total));
        const positions = designedKeys().length;
        const big = adultSizes().some((size) => (sizeQty.get(size) ?? 0) > 0 && isBigTeeSize(size));
        const extras = [
          `${tier.label} shirts are ${money(tier.cents)} each for one print position.`,
          big ? '3XL and larger include an extra $3 on those shirts.' : '3XL and larger add $3 each.',
          positions >= 2
            ? 'A second print position adds $7 to each shirt. That fee is included.'
            : 'A second print position adds $7 to each shirt.',
        ];
        priceNote.hidden = false;
        priceNote.textContent = extras.join(' ');
      } else {
        priceNote.hidden = true;
        priceNote.textContent = '';
      }
    }
    if (note) {
      note.textContent =
        total > 12
          ? 'Same-day is available for up to 12 pieces, ordered before 11:00am Pacific, in select Los Angeles ZIPs.'
          : 'Same-day printing can be requested at checkout for up to 12 pieces, before 11:00am Pacific, in select Los Angeles ZIPs.';
    }
    if (addBtn && !addBtn.dataset.busy) {
      addBtn.disabled = total < 1;
      addBtn.textContent = subtotal > 0 ? `Add to cart · ${money(subtotal)}` : 'Add to cart';
    }
  }

  function setSizeQty(size: string, next: number) {
    const capped = Math.max(0, Math.min(teeQtyMax(product), next));
    sizeQty.set(size, capped);
    const input = document.querySelector<HTMLInputElement>(`#sizeQtyGrid input[data-size="${size}"]`);
    if (input) input.value = String(capped);
    syncQtyTotals();
  }

  function renderSizeGrid() {
    const grid = $('sizeQtyGrid');
    const heading = $('sizeQtyHeading');
    if (!grid) return;
    const sizes = adultSizes();
    grid.classList.toggle('is-wide', isStudioTee(product));
    if (heading) heading.textContent = sizes.length === 1 && sizes[0] === 'OS' ? 'Quantity' : 'Adult sizes';
    grid.innerHTML = sizes
      .map((size) => {
        const qty = sizeQty.get(size) ?? 0;
        const label = size === 'OS' ? 'One size' : size;
        const max = teeQtyMax(product);
        return `<label class="size-step">${label}<span class="size-step__ctrl"><button type="button" data-size-dec="${size}" aria-label="Decrease ${label}">−</button><input data-size="${size}" aria-label="${label} quantity" inputmode="numeric" min="0" max="${max}" value="${qty}" /><button type="button" data-size-inc="${size}" aria-label="Increase ${label}">+</button></span></label>`;
      })
      .join('');
    syncQtyTotals();
  }

  function openPricing() {
    saveCurrentSide();
    if (!hasDesign()) {
      setStatus('Add text or an image before seeing pricing.');
      return;
    }
    renderSizeGrid();
    syncPrice();
    show($('pricingPanel'));
  }

  function pushHistory() {
    if (!canvas || applyingHistory) return;
    const json = JSON.stringify(canvas.toJSON());
    if (history[historyIndex] === json) return;
    history = history.slice(0, historyIndex + 1);
    history.push(json);
    if (history.length > 40) history.shift();
    historyIndex = history.length - 1;
    syncEmptyCtas();
  }

  async function restoreHistory(index: number) {
    if (!canvas) return;
    if (index < 0) {
      setStatus('Nothing to undo.');
      return;
    }
    if (index >= history.length) {
      setStatus('Nothing to redo.');
      return;
    }
    if (index === historyIndex) {
      setStatus(index === history.length - 1 ? 'Nothing to redo.' : 'Nothing to undo.');
      return;
    }
    applyingHistory = true;
    historyIndex = index;
    await canvas.loadFromJSON(history[index] ?? '{}');
    canvas.requestRenderAll();
    await new Promise((resolve) => setTimeout(resolve, 40));
    applyingHistory = false;
    syncEmptyCtas();
    syncSelectionUi();
    setStatus(index < history.length - 1 ? 'Undone.' : 'Redone.');
  }

  function fitPrintBox(placement: StudioPlacement) {
    const availW = Math.max(180, stage.clientWidth * 0.38);
    const availH = Math.max(140, stage.clientHeight * 0.46);
    const aspect = placement.widthIn / placement.heightIn;
    let width = availW;
    let height = width / aspect;
    if (height > availH) {
      height = availH;
      width = height * aspect;
    }
    return { width: Math.round(width), height: Math.round(height) };
  }

  function keepMostlyInside(obj: FabricObject) {
    if (!canvas) return;
    obj.setCoords();
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const bound = obj.getBoundingRect();
    const minVisible = 40;
    let dx = 0;
    let dy = 0;
    if (bound.left + bound.width < minVisible) dx = minVisible - (bound.left + bound.width);
    if (bound.top + bound.height < minVisible) dy = minVisible - (bound.top + bound.height);
    if (bound.left > cw - minVisible) dx = cw - minVisible - bound.left;
    if (bound.top > ch - minVisible) dy = ch - minVisible - bound.top;
    if (!dx && !dy) return;
    obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
    obj.setCoords();
  }

  function syncSelectionUi() {
    const selected = Boolean(canvas?.getActiveObject());
    const hint = $('editHint');
    if (hint) hint.hidden = !selected;
    $('btnDelete')?.classList.toggle('is-ready', selected);
  }

  function layoutCanvas() {
    const placement = currentPlacement();
    if (!placement || !canvas) return;
    syncProductCard();
    const frame = $('mockupFrame');
    const photoBox = Boolean(placementImage(placement) && frame);
    const box = photoBox
      ? {
          width: Math.max(48, Math.round(frame!.clientWidth * (placement.mockup.wPct / 100))),
          height: Math.max(32, Math.round(frame!.clientHeight * (placement.mockup.hPct / 100))),
        }
      : fitPrintBox(placement);
    const prevW = canvas.getWidth();
    const prevH = canvas.getHeight();
    if (canvas.getObjects().length && prevW > 0 && prevH > 0 && (prevW !== box.width || prevH !== box.height)) {
      const sx = box.width / prevW;
      const sy = box.height / prevH;
      for (const obj of canvas.getObjects()) {
        obj.set({
          scaleX: (obj.scaleX || 1) * sx,
          scaleY: (obj.scaleY || 1) * sy,
          left: (obj.left || 0) * sx,
          top: (obj.top || 0) * sy,
        });
        obj.setCoords();
      }
    }
    canvas.setDimensions({ width: box.width, height: box.height });
    if (photoBox) {
      printFrame.style.left = `${placement.mockup.xPct}%`;
      printFrame.style.top = `${placement.mockup.yPct}%`;
      printFrame.style.width = `${placement.mockup.wPct}%`;
      printFrame.style.height = `${placement.mockup.hPct}%`;
      printFrame.style.transform = 'none';
    } else {
      printFrame.style.width = `${box.width}px`;
      printFrame.style.height = `${box.height}px`;
      const cx = placement.mockup.xPct + placement.mockup.wPct / 2;
      const cy = placement.mockup.yPct + placement.mockup.hPct / 2;
      printFrame.style.left = `${cx}%`;
      printFrame.style.top = `${cy}%`;
      printFrame.style.transform = 'translate(-50%, -50%)';
    }
    if (emptyCtas) {
      const cap = shapeKey(product as { shape?: string }) === 'cap';
      emptyCtas.classList.toggle('is-cap', cap);
      // Hat print boxes are short. Shrinking the prompts to fit them makes the
      // labels a few pixels tall. Keep hat type near full size and let it sit
      // on the crown, past the dashed print box.
      const fit = cap
        ? Math.max(0.92, Math.min(1, box.width / 168))
        : Math.min(1, box.width / 190, box.height / 148);
      emptyCtas.style.transform = fit < 0.98 ? `scale(${fit.toFixed(3)})` : '';
    }
    syncPrice();
    canvas.calcOffset();
    canvas.requestRenderAll();
    stage.style.transform = `scale(${zoom})`;
  }

  function persistActiveSide() {
    if (!canvas || restoringSide) return;
    sideCanvases[side] = JSON.stringify(canvas.toJSON());
    markDesignedThumbs();
  }

  function bindCanvas() {
    if (!printFrame.contains(canvasEl)) {
      printFrame.replaceChildren(canvasEl);
    }
    canvas?.dispose();
    if (!canvasEl.isConnected) {
      printFrame.appendChild(canvasEl);
    }
    canvas = new Canvas(canvasEl, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: 'rgba(255,255,255,0.001)',
    });
    canvas.on('object:modified', () => {
      pushHistory();
      persistActiveSide();
    });
    canvas.on('object:added', () => {
      if (!applyingHistory) {
        pushHistory();
        persistActiveSide();
      }
      syncEmptyCtas();
    });
    canvas.on('object:removed', () => {
      if (!applyingHistory && !restoringSide) {
        pushHistory();
        persistActiveSide();
      }
      syncEmptyCtas();
      syncSelectionUi();
    });
    canvas.on('object:moving', (event) => {
      if (event.target) keepMostlyInside(event.target);
    });
    canvas.on('object:scaling', (event) => {
      if (event.target) keepMostlyInside(event.target);
    });
    canvas.on('selection:created', syncSelectionUi);
    canvas.on('selection:updated', syncSelectionUi);
    canvas.on('selection:cleared', () => {
      syncSelectionUi();
      if (!canvas) return;
      setStatus(
        canvas.getObjects().length
          ? 'Click your design to move, resize, or delete it.'
          : 'Upload art or add text inside the print area.',
      );
    });
    layoutCanvas();
    history = [];
    historyIndex = -1;
    pushHistory();
    syncEmptyCtas();
  }

  async function loadSideJson(json?: string) {
    if (!canvas) return;
    const expected = objectsInJson(json);
    restoringSide = true;
    applyingHistory = true;
    try {
      canvas.clear();
      canvas.backgroundColor = 'rgba(255,255,255,0.001)';
      layoutCanvas();
      if (json && expected > 0) {
        await canvas.loadFromJSON(json);
        canvas.requestRenderAll();
      }
      history = [];
      historyIndex = -1;
      pushHistory();
    } finally {
      applyingHistory = false;
      restoringSide = false;
      const actual = canvas?.getObjects().length ?? 0;
      if (expected === 0 || actual >= expected) {
        persistActiveSide();
      } else if (json) {
        // Keep the saved JSON when restore fails (e.g. stale blob image src).
        sideCanvases[side] = json;
      }
      syncEmptyCtas();
      syncSelectionUi();
      markDesignedThumbs();
    }
  }

  function saveCurrentSide() {
    persistActiveSide();
  }

  function switchSide(next: string) {
    if (next === side || restoringSide) return;
    if (!(next in (product.placements as object))) return;
    saveCurrentSide();
    const kept = Object.keys(placementMap())
      .filter((key) => key !== next && objectsInJson(sideCanvases[key]) > 0)
      .map((key) => placementMap()[key].label);
    side = next;
    refreshSideButtons();
    const label = currentPlacement()?.label ?? side;
    void loadSideJson(sideCanvases[side]).then(() => {
      setStatus(kept.length ? `${product.label} · ${label}. ${kept.join(' and ')} kept.` : `${product.label} · ${label}`);
    });
  }

  function refreshSideButtons() {
    const wrap = $('sideButtons');
    if (!wrap) return;
    wrap.innerHTML = '';
    const keys = Object.keys(product.placements);
    const hex = garmentHex();
    for (const key of keys) {
      const placement = (product.placements as Record<string, StudioPlacement>)[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      const designed = objectsInJson(sideCanvases[key]) > 0 || (key === side && (canvas?.getObjects().length ?? 0) > 0);
      btn.className = `print-thumb${key === side ? ' is-active' : ''}${designed ? ' is-designed' : ''}`;
      btn.setAttribute('aria-label', designed ? `${placement.label}, design saved` : placement.label);
      const box = placement.mockup;
      const shape = shapeKey(product as { shape?: string });
      const mark = `<span style="left:${box.xPct}%;top:${box.yPct}%;width:${box.wPct}%;height:${box.hPct}%"></span>`;
      const image = placement.image;
      const preview = image ? `<img alt="" src="${image}">` : placeholderSvg(shape, hex);
      btn.innerHTML = `<span class="print-thumb__preview">${preview}${mark}</span><span class="print-thumb__label">${placement.label}</span>`;
      if (image) {
        const img = btn.querySelector('img');
        void coloredGarment(image, hex).then((src) => {
          if (img) img.src = src;
        });
      }
      btn.addEventListener('click', () => switchSide(key));
      wrap.append(btn);
    }
  }

  function refreshColorButtons() {
    const wrap = $('colorButtons');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (const c of product.colors) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `swatch${c.id === colorId ? ' is-active' : ''}`;
      btn.title = c.label;
      btn.setAttribute('aria-label', c.label);
      btn.style.background = c.hex;
      btn.addEventListener('click', () => {
        colorId = c.id;
        refreshColorButtons();
        refreshSideButtons();
        layoutCanvas();
      });
      wrap.append(btn);
    }
  }

  function productCategory(item: StudioProduct) {
    return (item as { category?: string }).category ?? 'T-shirts';
  }

  function selectProduct(p: StudioProduct) {
    Object.keys(sideCanvases).forEach((k) => delete sideCanvases[k]);
    product = p;
    catalogCategory = productCategory(p);
    colorId = p.colors.find((c) => c.id === 'black')?.id ?? p.colors[0]?.id ?? colorId;
    side = Object.keys(p.placements)[0] ?? 'front';
    sizeQty.clear();
    refreshProductButtons();
    refreshColorButtons();
    refreshSideButtons();
    bindCanvas();
    syncPrice();
    setStatus(`${p.label} ready — upload art or add text`);
    track('design_started', { productId: p.id });
    window.dispatchEvent(new CustomEvent('lialvaro:design-started'));
    hide($('productDrawer'));
  }

  function refreshProductButtons() {
    const cats = $('productCats');
    const wrap = $('productButtons');
    if (!wrap) return;
    const categories = [...new Set(studio.products.map(productCategory))];
    if (!categories.includes(catalogCategory)) catalogCategory = categories[0] ?? 'T-shirts';
    if (cats) {
      cats.innerHTML = '';
      for (const cat of categories) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `product-cat${cat === catalogCategory ? ' is-active' : ''}`;
        btn.textContent = cat;
        btn.addEventListener('click', () => {
          catalogCategory = cat;
          refreshProductButtons();
        });
        cats.append(btn);
      }
    }
    wrap.innerHTML = '';
    for (const p of studio.products.filter((item) => productCategory(item) === catalogCategory)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `product-chip${p.id === product.id ? ' is-active' : ''}`;
      const front = (p.placements as Record<string, StudioPlacement>).front;
      const shape = shapeKey(p as { shape?: string });
      const hex = p.colors.find((c) => c.id === 'black')?.hex ?? p.colors[0]?.hex ?? '#1b2233';
      const preview = front?.image
        ? `<img src="${front.image}" alt="">`
        : placeholderSvg(shape, hex);
      btn.innerHTML = `<span class="pick-preview">${preview}</span><strong>${p.label}</strong><span class="pick-blurb">${p.blurb}</span>`;
      btn.addEventListener('click', () => selectProduct(p));
      wrap.append(btn);
    }
  }

  async function addText() {
    if (!canvas) return;
    const text = new IText('Your text', {
      fontFamily: 'Poppins, sans-serif',
      fill: colorId === 'white' || colorId === 'sand' || colorId === 'sky' ? '#1b2233' : '#fffdf9',
      fontSize: Math.max(22, Math.round(canvas.getHeight() * 0.12)),
      fontWeight: '700',
    });
    centerInPrintBox(canvas, text, 0.7);
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    syncEmptyCtas();
    syncSelectionUi();
    setStatus('Drag to move. Drag a corner to resize. The red × or Delete removes it.');
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  async function addUpload(file: File) {
    if (!canvas) return;
    const nextWarnings = [...warnings.filter((w) => !w.startsWith('Upload:'))];
    if (file.size > studio.maxUploadBytes) {
      nextWarnings.push('Upload: file is over 8MB — compress before export.');
      setWarnings(nextWarnings);
      return;
    }
    if (!/^(image\/(png|jpeg|jpg|svg\+xml))$/i.test(file.type) && !/\.(png|jpe?g|svg)$/i.test(file.name)) {
      nextWarnings.push('Upload: use PNG, JPG, or SVG.');
      setWarnings(nextWarnings);
      return;
    }
    try {
      // Data URLs survive side switches; blob: URLs were revoked and wiped the design on restore.
      const url = await fileToDataUrl(file);
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const placement = currentPlacement();
      img.set({ lockUniScaling: true });
      centerInPrintBox(canvas, img, 0.78);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      persistActiveSide();
      syncEmptyCtas();
      syncSelectionUi();
      setStatus('Centered in the print area. Drag to move, drag a corner to resize, or press Delete.');

      const printedInches = ((img.getScaledWidth() || 1) / canvas.getWidth()) * placement!.widthIn;
      const approxDpi = printedInches > 0 ? (img.width || 0) / printedInches : 0;
      if (approxDpi > 0 && approxDpi < 150) {
        nextWarnings.push(`Upload: about ${Math.round(approxDpi)} DPI when printed — under 150 DPI may look soft.`);
      }
      if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) {
        nextWarnings.push('Upload: JPG has no transparency — use PNG for knockouts.');
      }
      setWarnings(nextWarnings);
    } catch {
      nextWarnings.push('Upload: could not read that image. Try PNG or JPG.');
      setWarnings(nextWarnings);
    }
  }

  function selected(): FabricObject | undefined {
    return canvas?.getActiveObject() ?? undefined;
  }

  function bringForward() {
    const obj = selected();
    if (!canvas) return;
    if (!obj) {
      setStatus('Select a design first, then use Layers.');
      return;
    }
    if (canvas.getObjects().length < 2) {
      setStatus('Add text or another image before stacking layers.');
      return;
    }
    canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    pushHistory();
    setStatus('Moved up one layer.');
  }

  function sendBackward() {
    const obj = selected();
    if (!canvas) return;
    if (!obj) {
      setStatus('Select a design first, then use Layers.');
      return;
    }
    if (canvas.getObjects().length < 2) {
      setStatus('Add text or another image before stacking layers.');
      return;
    }
    canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    pushHistory();
    setStatus('Moved down one layer.');
  }

  function removeSelected() {
    const obj = selected();
    if (!obj || !canvas) return;
    canvas.remove(obj);
    canvas.requestRenderAll();
    pushHistory();
  }

  /** API payload must stay small — full Fabric JSON embeds multi-MB data URLs. */
  function sidesMetaForApi() {
    saveCurrentSide();
    const out: Record<string, { objects: Array<{ type: string }> }> = {};
    for (const [key, json] of Object.entries(sideCanvases)) {
      const count = objectsInJson(json);
      if (count > 0) out[key] = { objects: Array.from({ length: count }, () => ({ type: 'design' })) };
    }
    return out;
  }

  function resetExportButton() {
    const addBtn = $('btnExport') as HTMLButtonElement | null;
    if (!addBtn) return;
    delete addBtn.dataset.busy;
    syncQtyTotals();
  }

  async function exportAndCart() {
    if (!canvas) return;
    const attestation = $('ipAttest') as HTMLInputElement | null;
    const localWarnings = [...warnings];
    saveCurrentSide();
    if (!hasDesign()) {
      setStatus('Add text or an image before adding to cart.');
      return;
    }
    const sizes = Object.fromEntries(adultSizes().map((size) => [size, sizeQty.get(size) ?? 0]));
    const total = pieceCount();
    if (total < 1) {
      setStatus('Choose a quantity for at least one size.');
      return;
    }
    if (!isStudioTee(product) && total > 20) {
      setStatus('Studio orders for this product are limited to 20 pieces. Use a quote for larger runs.');
      return;
    }
    if (total > teeQtyMax(product)) {
      setStatus(`Studio orders are limited to ${teeQtyMax(product)} pieces.`);
      return;
    }
    if (!attestation?.checked) {
      setStatus('Check the rights box before adding to cart.');
      return;
    }

    const sidesMeta = sidesMetaForApi();
    const positionKeys = designedSideKeys(sidesMeta);
    const artSide =
      canvas.getObjects().length > 0
        ? side
        : (positionKeys[0] ?? Object.keys(sideCanvases).find((key) => objectsInJson(sideCanvases[key]) > 0) ?? side);
    const objectCount = Math.max(
      positionKeys.reduce((sum, key) => sum + (sidesMeta[key]?.objects.length ?? 0), 0) > 0
        ? sidesMeta[artSide]?.objects.length ?? 0
        : 0,
      artSide === side ? canvas.getObjects().length : objectsInJson(sideCanvases[artSide]),
      1,
    );
    const canvasJson = {
      version: 'studio-meta-1',
      productId: product.id,
      colorId,
      side: artSide,
      objectCount,
      positions: positionKeys,
      note: 'Full artwork stays on-device until print-file storage ships; cart uses design metadata.',
    };
    const addBtn = $('btnExport') as HTMLButtonElement | null;
    if (addBtn) {
      addBtn.dataset.busy = '1';
      addBtn.disabled = true;
      addBtn.textContent = 'Adding to cart…';
    }
    setStatus('Saving design…');

    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          colorId,
          side: artSide,
          canvasJson,
          objectCount,
          attestation: true,
          guestId: guestId(),
          preflightWarnings: localWarnings,
          sizes,
          sides: sidesMeta,
        }),
      });
      let data: {
        designId?: string;
        variantId?: string;
        unitPriceCents?: number;
        printPositions?: number;
        positions?: string[];
        error?: string;
        warnings?: string[];
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        resetExportButton();
        setStatus('Could not save design. Please try again.');
        return;
      }
      if (!res.ok || !data.designId || !data.variantId) {
        resetExportButton();
        setStatus(data.error || 'Could not save design.');
        return;
      }
      if (data.warnings?.length) setWarnings(data.warnings);

      let downloaded = false;
      try {
        const print = printBoxPx(currentPlacement()!);
        const multiplier = Math.min(4, print.width / Math.max(1, canvas.getWidth()));
        const png = canvas.toDataURL({ format: 'png', multiplier, enableRetinaScaling: false });
        const link = document.createElement('a');
        link.href = png;
        link.download = `${data.designId}-${side}.png`;
        link.click();
        downloaded = true;
      } catch {
        /* cart still proceeds if preview PNG export fails */
      }

      const savedPositions = data.positions?.length ? data.positions : positionKeys;
      const positionLabel = savedPositions.map((key) => placementMap()[key]?.label ?? key).join(', ');
      const printPositions = Math.max(1, data.printPositions ?? savedPositions.length);
      for (const [size, quantity] of Object.entries(sizes)) {
        if (quantity > 0) {
          addToCart(data.variantId, quantity, data.designId, size, {
            studioPrice: isStudioTee(product) ? 'tee' : undefined,
            printPositions,
            positions: positionLabel,
          });
        }
      }
      track('add_to_cart', { designId: data.designId, variantId: data.variantId });
      setStatus(
        savedPositions.length > 1
          ? `Design saved and added to cart. ${positionLabel} kept.${downloaded ? ' Print-ready PNG downloaded.' : ''}`
          : `Design saved and added to cart.${downloaded ? ' Print-ready PNG downloaded.' : ''}`,
      );
      window.location.href = '/cart/';
    } catch {
      resetExportButton();
      setStatus('Network error while adding to cart. Check your connection and try again.');
    }
  }

  // Toolbar + drawers
  $('btnAddText')?.addEventListener('click', () => void addText());
  $('btnUpload')?.addEventListener('click', () => $('fileInput')?.click());
  $('fileInput')?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    void uploadRejection(file).then((rejection) => {
      if (rejection) {
        setStatus(rejection);
        return;
      }
      void addUpload(file);
    });
  });
  emptyCtas?.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = (btn as HTMLElement).dataset.action;
      if (action === 'upload') $('fileInput')?.click();
      if (action === 'text') void addText();
      if (action === 'note') {
        setStatus('Design note saved locally — add details in cart notes or Contact if needed.');
        try {
          sessionStorage.setItem('lialvaro_design_note', '1');
        } catch {
          /* ignore */
        }
      }
    });
  });

  $('btnUndo')?.addEventListener('click', () => void restoreHistory(historyIndex - 1));
  $('btnRedo')?.addEventListener('click', () => void restoreHistory(historyIndex + 1));
  $('btnForward')?.addEventListener('click', () => bringForward());
  $('btnBack')?.addEventListener('click', () => sendBackward());
  $('btnDelete')?.addEventListener('click', () => removeSelected());
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    const target = event.target as HTMLElement | null;
    if (target && (target.closest('input, textarea, select') || target.isContentEditable)) return;
    const obj = canvas?.getActiveObject() as (FabricObject & { isEditing?: boolean }) | undefined;
    if (!obj || obj.isEditing) return;
    event.preventDefault();
    removeSelected();
  });
  $('btnExport')?.addEventListener('click', () => void exportAndCart());
  $('textColor')?.addEventListener('input', (event) => {
    const value = (event.target as HTMLInputElement).value;
    const obj = selected();
    if (obj && 'set' in obj) {
      obj.set('fill', value);
      canvas?.requestRenderAll();
      pushHistory();
      persistActiveSide();
    }
  });

  $('btnZoomIn')?.addEventListener('click', () => {
    zoom = Math.min(1.6, zoom + 0.1);
    stage.style.transform = `scale(${zoom})`;
  });
  $('btnZoomOut')?.addEventListener('click', () => {
    zoom = Math.max(0.7, zoom - 0.1);
    stage.style.transform = `scale(${zoom})`;
  });
  $('btnToggleGrid')?.addEventListener('click', () => {
    const frame = $('mockupFrame');
    const on = frame?.classList.toggle('is-grid') ?? false;
    $('btnToggleGrid')?.setAttribute('aria-pressed', on ? 'true' : 'false');
    setStatus(on ? 'Grid on.' : 'Grid off.');
  });

  document.querySelectorAll('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', () => hide($('productDrawer')));
  });
  $('btnQtySize')?.addEventListener('click', () => openPricing());
  $('btnSeePricing')?.addEventListener('click', () => openPricing());
  $('sizeQtyGrid')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dec = target.getAttribute('data-size-dec');
    const inc = target.getAttribute('data-size-inc');
    if (dec) setSizeQty(dec, (sizeQty.get(dec) ?? 0) - 1);
    if (inc) setSizeQty(inc, (sizeQty.get(inc) ?? 0) + 1);
  });
  $('sizeQtyGrid')?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.dataset.size) return;
    setSizeQty(target.dataset.size, Number(target.value) || 0);
  });
  document.querySelectorAll('[data-close-pricing]').forEach((el) => {
    el.addEventListener('click', () => hide($('pricingPanel')));
  });

  $('btnSaveShare')?.addEventListener('click', () => {
    if (!canvas) return;
    saveCurrentSide();
    const png = canvas.toDataURL({ format: 'png', multiplier: 1, enableRetinaScaling: false });
    const link = document.createElement('a');
    link.href = png;
    link.download = `lialvaro-design-${product.id}-${side}.png`;
    link.click();
    setStatus('Preview PNG saved to your device.');
  });

  $('btnPreview')?.addEventListener('click', () => {
    emptyCtas && (emptyCtas.hidden = true);
    setStatus('Preview mode — empty helpers hidden. Click Upload or Add text to keep editing.');
    setTimeout(() => syncEmptyCtas(), 2500);
  });

  $('btnChangeProduct')?.addEventListener('click', () => {
    catalogCategory = productCategory(product);
    refreshProductButtons();
    show($('productDrawer'));
  });
  $('btnProductDesc')?.addEventListener('click', () => {
    const dialog = $('descDialog') as HTMLDialogElement | null;
    const title = $('descTitle');
    const body = $('descBody');
    const more = $('descMore') as HTMLButtonElement | null;
    const colors = $('descColors');
    const sizes = $('descSizes');
    const sizeHeading = $('descSizeHeading');
    const details = product as StudioProduct & {
      description?: string;
      sizeGuide?: { sizes: string[]; rows: { label: string; values: string[] }[] };
    };
    if (title) title.textContent = product.label;
    if (body) body.textContent = product.blurb;
    if (more) {
      const full = details.description ?? product.blurb;
      more.hidden = full === product.blurb;
      more.onclick = () => {
        if (body) body.textContent = full;
        more.hidden = true;
      };
    }
    if (colors) {
      const extra = Math.max(0, product.colors.length - 3);
      colors.innerHTML = product.colors
        .slice(0, 3)
        .map((c) => `<span style="background:${c.hex}" title="${c.label}"></span>`)
        .join('');
      if (extra) colors.insertAdjacentHTML('beforeend', `<strong>+${extra} colors</strong>`);
    }
    if (sizes && sizeHeading) {
      const guide = details.sizeGuide;
      sizeHeading.hidden = !guide;
      sizes.hidden = !guide;
      if (guide) {
        const head = guide.sizes.map((size) => `<th>${size}</th>`).join('');
        const rows = guide.rows
          .map(
            (row) =>
              `<tr><td>${row.label}</td>${row.values.map((value) => `<td>${value}</td>`).join('')}</tr>`,
          )
          .join('');
        sizes.innerHTML = `<table class="size-table"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
      } else {
        sizes.innerHTML = '';
      }
    }
    dialog?.showModal();
  });

  refreshProductButtons();
  refreshColorButtons();
  refreshSideButtons();
  renderSizeGrid();
  bindCanvas();
  syncPricingGate();
  syncCartBadge();
  setStatus('Upload art or add text inside the print area.');
  track('design_started', { productId: product.id });
  window.dispatchEvent(new CustomEvent('lialvaro:design-started'));
  window.addEventListener('lialvaro:cart-updated', () => syncCartBadge());
}
