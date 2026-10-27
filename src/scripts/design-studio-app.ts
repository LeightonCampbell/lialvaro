import { Canvas, FabricImage, IText, type FabricObject } from 'fabric';
import studio from '../data/design-studio.json';
import { displayBoxPx, effectiveDpi, type StudioProduct } from '../lib/design-studio';
import { addToCart } from './cart';
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

export function initDesignStudio() {
  const canvasEl = $('studioCanvas') as HTMLCanvasElement | null;
  const stage = $('studioStage');
  const mockup = $('studioMockup');
  const printFrame = $('printFrame');
  const statusEl = $('studioStatus');
  const priceEl = $('studioPrice');
  const warningEl = $('studioWarnings');
  if (!canvasEl || !stage || !mockup || !printFrame || !statusEl || !priceEl || !warningEl) return;

  let product: StudioProduct = studio.products[0];
  let colorId = product.colors[0]?.id ?? 'white';
  let side: string = Object.keys(product.placements)[0] ?? 'front';
  let canvas: Canvas | null = null;
  let history: HistoryEntry[] = [];
  let historyIndex = -1;
  let applyingHistory = false;
  const warnings: string[] = [];

  function setStatus(msg: string) {
    statusEl.textContent = msg;
  }

  function setWarnings(list: string[]) {
    warningEl.hidden = list.length === 0;
    warningEl.innerHTML = list.map((w) => `<li>${w}</li>`).join('');
  }

  function currentPlacement() {
    return product.placements[side as keyof typeof product.placements];
  }

  function garmentHex() {
    return product.colors.find((c) => c.id === colorId)?.hex ?? '#f5f5f5';
  }

  function money(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  }

  function pushHistory() {
    if (!canvas || applyingHistory) return;
    const json = JSON.stringify(canvas.toJSON());
    history = history.slice(0, historyIndex + 1);
    history.push(json);
    if (history.length > 40) history.shift();
    historyIndex = history.length - 1;
  }

  async function restoreHistory(index: number) {
    if (!canvas || index < 0 || index >= history.length) return;
    applyingHistory = true;
    historyIndex = index;
    await canvas.loadFromJSON(history[index]);
    canvas.requestRenderAll();
    applyingHistory = false;
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
    mockup.style.background = garmentHex();
    canvas.requestRenderAll();
    const variantHint = product.variantId;
    priceEl.textContent = `From catalog blank · ${variantHint}`;
    // Price shown from data attribute filled by page when available
    const priced = Number(priceEl.dataset.cents ?? '0');
    if (priced > 0) priceEl.textContent = money(priced);
  }

  function bindCanvas() {
    canvas?.dispose();
    canvas = new Canvas(canvasEl, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: 'rgba(255,255,255,0.001)',
    });
    canvas.on('object:modified', () => pushHistory());
    canvas.on('object:added', () => {
      if (!applyingHistory) pushHistory();
    });
    layoutCanvas();
    history = [];
    historyIndex = -1;
    pushHistory();
  }

  function refreshSideButtons() {
    const wrap = $('sideButtons');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (const key of Object.keys(product.placements)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `chip${key === side ? ' is-active' : ''}`;
      btn.textContent = product.placements[key as keyof typeof product.placements].label;
      btn.addEventListener('click', () => {
        side = key;
        refreshSideButtons();
        bindCanvas();
        setStatus(`${product.label} · ${currentPlacement()?.label ?? side}`);
      });
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
      btn.style.background = c.hex;
      btn.addEventListener('click', () => {
        colorId = c.id;
        refreshColorButtons();
        layoutCanvas();
      });
      wrap.append(btn);
    }
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
      btn.addEventListener('click', () => {
        product = p;
        colorId = p.colors[0]?.id ?? colorId;
        side = Object.keys(p.placements)[0] ?? 'front';
        const root = $('designStudioRoot');
        try {
          const map = JSON.parse(root?.dataset.priceMap || '{}') as Record<string, number>;
          if (map[p.id]) priceEl.dataset.cents = String(map[p.id]);
        } catch {
          /* ignore */
        }
        refreshProductButtons();
        refreshColorButtons();
        refreshSideButtons();
        bindCanvas();
        setStatus(`${p.label} ready — upload art or add text`);
        track('design_started', { productId: p.id });
        window.dispatchEvent(new CustomEvent('lialvaro:design-started'));
      });
      wrap.append(btn);
    }
  }

  async function addText() {
    if (!canvas) return;
    const text = new IText('Your text', {
      left: 24,
      top: 24,
      fontFamily: 'Poppins, sans-serif',
      fill: colorId === 'white' ? '#1b2233' : '#fffdf9',
      fontSize: 28,
      fontWeight: '700',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
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

      const natural = img.width || 0;
      const dpi = effectiveDpi(natural / (img.scaleX || 1), placement!.widthIn * (natural > 0 ? scale : 1));
      // Simpler: natural pixel width vs print width inches at current visual scale approximation
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

  async function exportAndCart() {
    if (!canvas) return;
    const attestation = $('ipAttest') as HTMLInputElement | null;
    const objects = canvas.getObjects();
    const localWarnings = [...warnings];
    if (!attestation?.checked) {
      setStatus('Check the IP attestation box before adding to cart.');
      return;
    }
    if (!objects.length) {
      setStatus('Add text or an upload before exporting.');
      return;
    }

    setStatus('Saving design…');
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

    // High-res export preview for the customer (print-ready PNG download).
    const multiplier = 1 / studio.displayScale;
    const png = canvas.toDataURL({ format: 'png', multiplier, enableRetinaScaling: false });
    const link = document.createElement('a');
    link.href = png;
    link.download = `${data.designId}-${side}.png`;
    link.click();

    addToCart(data.variantId, 1, data.designId);
    track('add_to_cart', { designId: data.designId, variantId: data.variantId });
    setStatus('Design saved and added to cart. Print-ready PNG downloaded.');
    window.location.href = '/cart/';
  }

  // Wire controls
  $('btnAddText')?.addEventListener('click', () => void addText());
  $('btnUpload')?.addEventListener('click', () => $('fileInput')?.click());
  $('fileInput')?.addEventListener('change', (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void addUpload(file);
    input.value = '';
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

  refreshProductButtons();
  refreshColorButtons();
  refreshSideButtons();
  bindCanvas();
  setStatus('Pick a product, then upload art or add text.');
  track('design_started', { productId: product.id });
  window.dispatchEvent(new CustomEvent('lialvaro:design-started'));
}

if (document.getElementById('designStudioRoot')) {
  initDesignStudio();
}
