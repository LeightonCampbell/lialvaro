import { Canvas, FabricImage, IText, type FabricObject } from 'fabric';
import studio from '../data/design-studio.json';
import { displayBoxPx, effectiveDpi, type StudioProduct } from '../lib/design-studio';
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
  const warnings: string[] = [];
  const sideCanvases: Record<string, string> = {};

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
  }

  function syncProductCard() {
    const name = $('productName');
    const blurb = $('productBlurb');
    const thumb = $('productThumb');
    const colorLabel = $('selectedColorLabel');
    if (name) name.textContent = product.label;
    if (blurb) blurb.textContent = product.blurb;
    if (thumb) thumb.style.background = garmentHex();
    if (colorLabel) {
      colorLabel.textContent = product.colors.find((c) => c.id === colorId)?.label ?? colorId;
    }
    mockup.style.color = garmentHex();
    mockup.dataset.shape = (product as { shape?: string }).shape ?? 'tee';
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
  }

  function pushHistory() {
    if (!canvas || applyingHistory) return;
    const json = JSON.stringify(canvas.toJSON());
    history = history.slice(0, historyIndex + 1);
    history.push(json);
    if (history.length > 40) history.shift();
    historyIndex = history.length - 1;
    syncEmptyCtas();
  }

  async function restoreHistory(index: number) {
    if (!canvas || index < 0 || index >= history.length) return;
    applyingHistory = true;
    historyIndex = index;
    await canvas.loadFromJSON(history[index]);
    canvas.requestRenderAll();
    applyingHistory = false;
    syncEmptyCtas();
  }

  function layoutCanvas() {
    const placement = currentPlacement();
    if (!placement || !canvas) return;
    const box = displayBoxPx(placement);
    canvas.setDimensions({ width: box.width, height: box.height });
    printFrame.style.width = `${box.width}px`;
    printFrame.style.height = `${box.height}px`;
    printFrame.style.left = `${placement.mockup.xPct}%`;
    printFrame.style.top = `${placement.mockup.yPct}%`;
    syncProductCard();
    syncPrice();
    canvas.requestRenderAll();
    stage.style.transform = `scale(${zoom})`;
  }

  function bindCanvas(restoreJson?: string) {
    canvas?.dispose();
    canvas = new Canvas(canvasEl, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: 'rgba(255,255,255,0.001)',
    });
    canvas.on('object:modified', () => pushHistory());
    canvas.on('object:added', () => {
      if (!applyingHistory) pushHistory();
      syncEmptyCtas();
    });
    canvas.on('object:removed', () => syncEmptyCtas());
    layoutCanvas();
    history = [];
    historyIndex = -1;
    if (restoreJson) {
      void (async () => {
        applyingHistory = true;
        await canvas!.loadFromJSON(restoreJson);
        canvas!.requestRenderAll();
        applyingHistory = false;
        pushHistory();
        syncEmptyCtas();
      })();
    } else {
      pushHistory();
      syncEmptyCtas();
    }
  }

  function saveCurrentSide() {
    if (!canvas) return;
    sideCanvases[side] = JSON.stringify(canvas.toJSON());
  }

  function switchSide(next: string) {
    if (next === side) return;
    if (!(next in (product.placements as object))) return;
    saveCurrentSide();
    side = next;
    refreshSideButtons();
    bindCanvas(sideCanvases[side]);
    setStatus(`${product.label} · ${currentPlacement()?.label ?? side}`);
  }

  function refreshSideButtons() {
    const wrap = $('sideButtons');
    if (!wrap) return;
    wrap.innerHTML = '';
    const keys = Object.keys(product.placements);
    for (const key of keys) {
      const placement = (product.placements as Record<string, { label: string }>)[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `print-thumb${key === side ? ' is-active' : ''}`;
      btn.innerHTML = `<span class="print-thumb__preview" style="background:${garmentHex()}"><span></span></span><span class="print-thumb__label">${placement.label}</span>`;
      btn.addEventListener('click', () => switchSide(key));
      wrap.append(btn);
    }
    // Disabled sleeve placeholders to match competitor chrome without claiming support
    for (const label of ['Left sleeve', 'Right sleeve']) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'print-thumb is-disabled';
      btn.disabled = true;
      btn.title = 'Not available on this blank yet';
      btn.innerHTML = `<span class="print-thumb__preview"><span style="left:35%;top:40%;width:30%;height:18%"></span></span><span class="print-thumb__label">${label}</span>`;
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

  function selectProduct(p: StudioProduct) {
    Object.keys(sideCanvases).forEach((k) => delete sideCanvases[k]);
    product = p;
    colorId = p.colors.find((c) => c.id === 'black')?.id ?? p.colors[0]?.id ?? colorId;
    side = Object.keys(p.placements)[0] ?? 'front';
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
    const wrap = $('productButtons');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (const p of studio.products) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `product-chip${p.id === product.id ? ' is-active' : ''}`;
      btn.innerHTML = `<strong>${p.label}</strong><span>${p.blurb}</span>`;
      btn.addEventListener('click', () => selectProduct(p));
      wrap.append(btn);
    }
  }

  async function addText() {
    if (!canvas) return;
    const text = new IText('Your text', {
      left: 24,
      top: 24,
      fontFamily: 'Poppins, sans-serif',
      fill: colorId === 'white' || colorId === 'sand' || colorId === 'sky' ? '#1b2233' : '#fffdf9',
      fontSize: 28,
      fontWeight: '700',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    syncEmptyCtas();
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
    const url = URL.createObjectURL(file);
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      const placement = currentPlacement();
      const box = displayBoxPx(placement!);
      const maxW = box.width * 0.85;
      const maxH = box.height * 0.85;
      const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
      img.set({
        left: box.width * 0.08,
        top: box.height * 0.08,
        scaleX: scale,
        scaleY: scale,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      syncEmptyCtas();

      const exportScale = 1 / studio.displayScale;
      const approxDpi = effectiveDpi((img.width || 0) * (img.scaleX || 1) * exportScale, placement!.widthIn);
      if (approxDpi > 0 && approxDpi < 150) {
        nextWarnings.push(`Upload: about ${Math.round(approxDpi)} DPI when printed — under 150 DPI may look soft.`);
      }
      if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)) {
        nextWarnings.push('Upload: JPG has no transparency — use PNG for knockouts.');
      }
      setWarnings(nextWarnings);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function selected(): FabricObject | undefined {
    return canvas?.getActiveObject() ?? undefined;
  }

  function bringForward() {
    const obj = selected();
    if (!obj || !canvas) return;
    canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    pushHistory();
  }

  function sendBackward() {
    const obj = selected();
    if (!obj || !canvas) return;
    canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    pushHistory();
  }

  function removeSelected() {
    const obj = selected();
    if (!obj || !canvas) return;
    canvas.remove(obj);
    canvas.requestRenderAll();
    pushHistory();
  }

  function qty() {
    const input = $('studioQty') as HTMLInputElement | null;
    return Math.max(1, Math.min(20, Number(input?.value) || 1));
  }

  async function exportAndCart() {
    if (!canvas) return;
    const attestation = $('ipAttest') as HTMLInputElement | null;
    const objects = canvas.getObjects();
    const localWarnings = [...warnings];
    if (!attestation?.checked) {
      setStatus('Check the IP attestation box before adding to cart.');
      show($('pricingPanel'));
      return;
    }
    if (!objects.length) {
      setStatus('Add text or an upload before exporting.');
      return;
    }

    setStatus('Saving design…');
    saveCurrentSide();
    const canvasJson = canvas.toJSON();
    const res = await fetch('/api/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        colorId,
        side,
        canvasJson,
        objectCount: objects.length,
        attestation: true,
        guestId: guestId(),
        preflightWarnings: localWarnings,
        size: (document.getElementById('studioSize') as HTMLSelectElement | null)?.value,
        quantity: qty(),
      }),
    });
    const data = (await res.json()) as {
      designId?: string;
      variantId?: string;
      unitPriceCents?: number;
      error?: string;
      warnings?: string[];
    };
    if (!res.ok || !data.designId || !data.variantId) {
      setStatus(data.error || 'Could not save design.');
      return;
    }
    if (data.warnings?.length) setWarnings(data.warnings);

    const multiplier = 1 / studio.displayScale;
    const png = canvas.toDataURL({ format: 'png', multiplier, enableRetinaScaling: false });
    const link = document.createElement('a');
    link.href = png;
    link.download = `${data.designId}-${side}.png`;
    link.click();

    addToCart(data.variantId, qty(), data.designId);
    track('add_to_cart', { designId: data.designId, variantId: data.variantId });
    setStatus('Design saved and added to cart. Print-ready PNG downloaded.');
    window.location.href = '/cart/';
  }

  // Toolbar + drawers
  $('btnAddText')?.addEventListener('click', () => void addText());
  $('btnUpload')?.addEventListener('click', () => $('fileInput')?.click());
  $('fileInput')?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void addUpload(file);
    input.value = '';
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
  $('btnExport')?.addEventListener('click', () => void exportAndCart());
  $('textColor')?.addEventListener('input', (event) => {
    const value = (event.target as HTMLInputElement).value;
    const obj = selected();
    if (obj && 'set' in obj) {
      obj.set('fill', value);
      canvas?.requestRenderAll();
      pushHistory();
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
    const on = stage.classList.toggle('is-grid');
    $('btnToggleGrid')?.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  $('btnChangeProduct')?.addEventListener('click', () => show($('productDrawer')));
  document.querySelectorAll('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', () => hide($('productDrawer')));
  });
  $('btnQtySize')?.addEventListener('click', () => show($('qtyPanel')));
  document.querySelectorAll('[data-close-qty]').forEach((el) => {
    el.addEventListener('click', () => hide($('qtyPanel')));
  });
  $('btnSeePricing')?.addEventListener('click', () => {
    syncPrice();
    show($('pricingPanel'));
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

  $('btnProductDesc')?.addEventListener('click', () => {
    const dialog = $('descDialog') as HTMLDialogElement | null;
    const body = $('descBody');
    if (body) body.textContent = product.blurb;
    dialog?.showModal();
  });

  refreshProductButtons();
  refreshColorButtons();
  refreshSideButtons();
  bindCanvas();
  syncCartBadge();
  setStatus('Upload art or add text inside the print area.');
  track('design_started', { productId: product.id });
  window.dispatchEvent(new CustomEvent('lialvaro:design-started'));
  window.addEventListener('lialvaro:cart-updated', () => syncCartBadge());
}

if (document.getElementById('designStudioRoot')) {
  initDesignStudio();
}
