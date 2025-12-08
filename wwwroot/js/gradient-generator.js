// wwwroot/js/gradient-generator.js
(function () {
    function $(id) { return document.getElementById(id); }

    // Layer data: topmost layer is index 0
    let layers = [];
    let activeLayerIndex = 0;

    // ---------- Models / helpers ----------

    function createDefaultLayer(isTransparent) {
        const stops = isTransparent
            ? [
                { color: '#000000', position: 0, transparent: true },
                { color: '#000000', position: 100, transparent: true }
            ]
            : [
                { color: '#ff6b6b', position: 0, transparent: false },
                { color: '#4dabf7', position: 100, transparent: false }
            ];

        return {
            type: 'linear',
            angle: 90,
            shape: 'ellipse',
            size: 'farthest-corner',
            position: 'center center',
            stops: stops,
            visible: true
        };
    }

    function colorToCss(stop) {
        if (stop.transparent) return 'transparent';
        return stop.color || '#000000';
    }

    function randomHexColour() {
        const n = Math.floor(Math.random() * 0xFFFFFF);
        return '#' + n.toString(16).padStart(6, '0');
    }

    function areStopsEvenlySpaced(stops) {
        if (!stops || stops.length < 2) return false;

        const sorted = stops.slice().sort((a, b) => a.position - b.position);
        const expectedStep = 100 / (sorted.length - 1);
        const tolerance = 2; // percent leeway

        for (let i = 0; i < sorted.length; i++) {
            const expected = Math.round(i * expectedStep);
            if (Math.abs(sorted[i].position - expected) > tolerance) {
                return false;
            }
        }

        return true;
    }

    // ---------- DOM render helpers ----------

    function createStopRow(stop, index) {
        const container = document.createElement('div');
        container.className = 'grad-stop-row form-row';
        container.dataset.index = index.toString();

        container.innerHTML = `
            <label class="form-label">Stop ${index + 1}</label>
            <div class="grad-stop-controls">
                <input type="color" class="grad-stop-color" value="${stop.color}">
                <input type="number" class="form-input grad-stop-position"
                       min="0" max="100" value="${stop.position}" />%
                <label class="grad-stop-transparent-label">
                    <input type="checkbox" class="grad-stop-transparent-input" ${stop.transparent ? 'checked' : ''} />
                    Transparent
                </label>
                <button type="button" class="btn btn-outline-secondary btn-sm grad-stop-remove" title="Remove stop">
                    ✕
                </button>
            </div>
        `;

        return container;
    }

    function renderStopsForActiveLayer() {
        const container = $('grad-stops');
        if (!container) return;

        const layer = layers[activeLayerIndex];
        if (!layer) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = '';
        layer.stops.forEach((stop, idx) => {
            container.appendChild(createStopRow(stop, idx));
        });
    }

    function renderLayerTabs() {
        const container = $('grad-layers');
        if (!container) return;

        container.innerHTML = '';
        if (!layers.length) return;

        layers.forEach((layer, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-outline-secondary btn-sm grad-layer-tab';
            if (index === activeLayerIndex) btn.classList.add('active');
            btn.dataset.index = index.toString();

            const isVisible = layer.visible !== false;

            btn.innerHTML = `
                <span class="grad-layer-eye" data-eye="${index}">
                    ${isVisible ? '👁' : '🚫'}
                </span>
                <span class="grad-layer-label">
                    Layer ${index + 1}${index === 0 ? ' (top)' : ''}
                </span>
            `;

            container.appendChild(btn);
        });
    }

    function loadActiveLayerIntoUI() {
        const layer = layers[activeLayerIndex];
        if (!layer) return;

        const typeEl = $('grad-type');
        const shapeEl = $('grad-shape');
        const sizeEl = $('grad-size');
        const posEl = $('grad-position');

        if (typeEl) typeEl.value = layer.type;
        if (shapeEl) shapeEl.value = layer.shape;
        if (sizeEl) sizeEl.value = layer.size;
        if (posEl) posEl.value = layer.position;

        toggleTypeOptions(false); // don't immediately rebuild

        if (layer.type === 'linear') {
            setLinearAngle(layer.angle);
        }

        renderStopsForActiveLayer();
    }

    // ---------- Gradient building ----------

    function buildGradientString(layer) {
        if (!layer || !layer.stops || layer.stops.length === 0 || layer.visible === false) return '';

        const stopsString = layer.stops
            .map(s => `${colorToCss(s)} ${s.position}%`)
            .join(', ');

        if (layer.type === 'radial') {
            return `radial-gradient(${layer.shape} ${layer.size} at ${layer.position}, ${stopsString})`;
        }

        return `linear-gradient(${layer.angle}deg, ${stopsString})`;
    }

    function getAllGradientStrings() {
        return layers
            .filter(l => l.visible !== false)
            .map(buildGradientString)
            .filter(str => str && str.length > 0);
    }

    function updatePreviewAndOutputs() {
        const preview = $('grad-preview');
        const cssOutput = $('grad-css-output');
        const twOutput = $('grad-tailwind-output');
        if (!preview || !cssOutput || !twOutput) return;

        const gradients = getAllGradientStrings();
        if (!gradients.length) {
            preview.style.backgroundImage = 'none';
            cssOutput.value = '';
            twOutput.value = '';
            return;
        }

        const bgImage = gradients.join(', ');

        preview.style.backgroundImage = bgImage;
        preview.style.backgroundSize = '100% 100%';
        preview.style.backgroundRepeat = 'no-repeat';

        cssOutput.value = `background-image: ${bgImage};`;

        const escaped = bgImage.replace(/[\[\]]/g, '\\$&');
        twOutput.value = `bg-[${escaped}]`;
    }

    // ---------- Linear direction dial ----------

    function setLinearAngle(angleDeg) {
        const layer = layers[activeLayerIndex];
        const angleInput = $('grad-angle');
        const angleDisplay = $('grad-angle-display');
        const indicator = $('grad-dial-indicator');

        if (!angleInput || !angleDisplay || !indicator) return;

        const normalised = ((angleDeg % 360) + 360) % 360;

        angleInput.value = normalised.toFixed(1);
        angleDisplay.textContent = `${Math.round(normalised)}°`;
        indicator.style.transform = `rotate(${normalised}deg)`;

        if (layer && layer.type === 'linear') {
            layer.angle = normalised;
        }

        updatePreviewAndOutputs();
    }

    function setupDial() {
        const dial = $('grad-dial');
        const indicator = $('grad-dial-indicator');
        if (!dial || !indicator) return;

        let isDragging = false;

        function handlePointer(e) {
            const rect = dial.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const dx = e.clientX - cx;
            const dy = e.clientY - cy;

            // 0deg = up, 90deg = right
            const angleRad = Math.atan2(dx, -dy);
            let angleDeg = angleRad * 180 / Math.PI;
            angleDeg = ((angleDeg % 360) + 360) % 360;

            // Snap with Shift
            if (e.shiftKey) {
                const step = 15;
                angleDeg = Math.round(angleDeg / step) * step;
            }

            setLinearAngle(angleDeg);
        }

        dial.addEventListener('mousedown', function (e) {
            isDragging = true;
            handlePointer(e);
        });

        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            handlePointer(e);
        });

        window.addEventListener('mouseup', function () {
            isDragging = false;
        });
    }

    // ---------- Type toggle ----------

    function toggleTypeOptions(update = true) {
        const typeEl = $('grad-type');
        const linear = $('grad-linear-options');
        const radial = $('grad-radial-options');
        if (!typeEl || !linear || !radial) return;

        const type = typeEl.value;
        const layer = layers[activeLayerIndex];

        if (layer) {
            layer.type = type;
        }

        if (type === 'radial') {
            linear.classList.add('hidden');
            radial.classList.remove('hidden');
        } else {
            radial.classList.add('hidden');
            linear.classList.remove('hidden');
        }

        if (update) updatePreviewAndOutputs();
    }

    // ---------- Layers ----------

    function addLayer(isTransparentTop) {
        const layer = createDefaultLayer(isTransparentTop);

        if (isTransparentTop) {
            layers.unshift(layer);
            activeLayerIndex = 0;
        } else {
            layers.push(layer);
            activeLayerIndex = layers.length - 1;
        }

        renderLayerTabs();
        loadActiveLayerIntoUI();
        updatePreviewAndOutputs();
    }

    // ---------- Colour stop management ----------

    function addStop(color, position) {
        const layer = layers[activeLayerIndex];
        if (!layer) return;

        const stops = layer.stops;

        // Explicit position: used by randomisers
        if (typeof position === 'number') {
            stops.push({
                color: color || randomHexColour(),
                position: position,
                transparent: false
            });
            stops.sort((a, b) => a.position - b.position);
            renderStopsForActiveLayer();
            updatePreviewAndOutputs();
            return;
        }

        // User clicked "Add colour stop" with evenly spaced stops
        if (stops.length >= 2 && areStopsEvenlySpaced(stops)) {
            const newStops = stops.slice();
            newStops.push({
                color: color || randomHexColour(),
                position: 100,
                transparent: false
            });

            const count = newStops.length;
            const step = 100 / (count - 1);
            for (let i = 0; i < count; i++) {
                newStops[i].position = Math.round(i * step);
            }

            layer.stops = newStops;
            renderStopsForActiveLayer();
            updatePreviewAndOutputs();
            return;
        }

        // Fallback: old behaviour
        const index = stops.length;
        const pos = Math.round(100 * index / Math.max(1, index));
        stops.push({
            color: color || randomHexColour(),
            position: pos,
            transparent: false
        });

        stops.sort((a, b) => a.position - b.position);
        renderStopsForActiveLayer();
        updatePreviewAndOutputs();
    }

    function randomiseColours(keepLayout) {
        const layer = layers[activeLayerIndex];
        if (!layer) return;

        if (!keepLayout || !layer.stops.length) {
            const count = 2 + Math.floor(Math.random() * 3); // 2–4 stops
            const newStops = [];

            for (let i = 0; i < count; i++) {
                newStops.push({
                    color: randomHexColour(),
                    position: Math.round(100 * i / (count - 1)),
                    transparent: false
                });
            }

            layer.stops = newStops;
        } else {
            layer.stops.forEach(stop => {
                stop.color = randomHexColour();
                stop.transparent = false;
            });
        }

        layer.stops.sort((a, b) => a.position - b.position);
        renderStopsForActiveLayer();
        updatePreviewAndOutputs();
    }

    function randomiseAll() {
        const typeEl = $('grad-type');
        if (!typeEl) return;

        const layer = layers[activeLayerIndex];
        if (!layer) return;

        const isLinear = Math.random() < 0.5;
        typeEl.value = isLinear ? 'linear' : 'radial';
        toggleTypeOptions(false);

        if (isLinear) {
            const angle = Math.random() * 360;
            setLinearAngle(angle);
        } else {
            const shapes = ['ellipse', 'circle'];
            const sizes = ['farthest-corner', 'closest-corner', 'farthest-side', 'closest-side'];
            const positions = [
                'center center', 'top left', 'top center', 'top right',
                'center left', 'center right',
                'bottom left', 'bottom center', 'bottom right'
            ];

            layer.shape = shapes[Math.floor(Math.random() * shapes.length)];
            layer.size = sizes[Math.floor(Math.random() * sizes.length)];
            layer.position = positions[Math.floor(Math.random() * positions.length)];

            const shapeEl = $('grad-shape');
            const sizeEl = $('grad-size');
            const posEl = $('grad-position');

            if (shapeEl) shapeEl.value = layer.shape;
            if (sizeEl) sizeEl.value = layer.size;
            if (posEl) posEl.value = layer.position;
        }

        randomiseColours(false);
    }

    function reverseStops() {
        const layer = layers[activeLayerIndex];
        if (!layer || layer.stops.length < 2) return;

        layer.stops.forEach(stop => {
            stop.position = 100 - stop.position;
        });

        layer.stops.sort((a, b) => a.position - b.position);
        renderStopsForActiveLayer();
        updatePreviewAndOutputs();
    }

    function distributeStopsEvenly() {
        const layer = layers[activeLayerIndex];
        if (!layer || layer.stops.length < 2) return;

        const count = layer.stops.length;
        const step = 100 / (count - 1);

        for (let i = 0; i < count; i++) {
            layer.stops[i].position = Math.round(i * step);
        }

        layer.stops.sort((a, b) => a.position - b.position);
        renderStopsForActiveLayer();
        updatePreviewAndOutputs();
    }

    // ---------- PNG export ----------

    function exportPng() {
        if (!layers.length) return;

        const width = 800;
        const height = 450;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw from bottom to top (reverse order)
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if (!layer || !layer.stops.length || layer.visible === false) continue;

            let gradient;

            if (layer.type === 'linear') {
                const angleRad = layer.angle * Math.PI / 180;
                const cx = width / 2;
                const cy = height / 2;
                const r = Math.sqrt(width * width + height * height) / 2;
                const dx = Math.sin(angleRad);
                const dy = -Math.cos(angleRad);

                const x0 = cx - dx * r;
                const y0 = cy - dy * r;
                const x1 = cx + dx * r;
                const y1 = cy + dy * r;

                gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            } else {
                const pos = (layer.position || 'center center').split(' ');
                const mapX = { left: 0, center: 0.5, right: 1 };
                const mapY = { top: 0, center: 0.5, bottom: 1 };

                const px = mapX[pos[1]] ?? 0.5;
                const py = mapY[pos[0]] ?? 0.5;

                const cx = width * px;
                const cy = height * py;
                const radius = Math.max(width, height);

                gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            }

            layer.stops.forEach(s => {
                gradient.addColorStop(s.position / 100, colorToCss(s));
            });

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'gradient.png';
        link.click();
    }

    // ---------- Misc ----------

    function copyToClipboard(textareaId) {
        const el = $(textareaId);
        if (!el || !el.value) return;

        el.select();
        try { document.execCommand('copy'); } catch { }
        el.setSelectionRange(0, 0);
    }

    // ---------- init ----------

    function init() {
        if (!$('grad-type')) return; // not on this page

        // Base layer (visible)
        addLayer(false);

        setupDial();

        // Type change
        $('grad-type').addEventListener('change', function () {
            toggleTypeOptions();
        });

        // Radial options
        ['grad-shape', 'grad-size', 'grad-position'].forEach(id => {
            const el = $(id);
            if (el) {
                el.addEventListener('change', function () {
                    const layer = layers[activeLayerIndex];
                    if (!layer) return;

                    if (id === 'grad-shape') layer.shape = this.value;
                    if (id === 'grad-size') layer.size = this.value;
                    if (id === 'grad-position') layer.position = this.value;

                    updatePreviewAndOutputs();
                });
            }
        });

        // Add colour stop
        $('grad-add-stop').addEventListener('click', function () {
            addStop();
        });

        // Randomisers
        $('grad-random-colours').addEventListener('click', function () {
            randomiseColours(true);
        });

        $('grad-random-all').addEventListener('click', randomiseAll);

        // Reverse / distribute
        $('grad-reverse-stops').addEventListener('click', reverseStops);
        $('grad-distribute-stops').addEventListener('click', distributeStopsEvenly);

        // Copy buttons
        $('grad-copy-css').addEventListener('click', function () {
            copyToClipboard('grad-css-output');
        });

        $('grad-copy-tailwind').addEventListener('click', function () {
            copyToClipboard('grad-tailwind-output');
        });

        $('grad-export-png').addEventListener('click', exportPng);

        // Add layer (top, transparent)
        $('grad-add-layer').addEventListener('click', function () {
            addLayer(true);
        });

        // Layer tab switching + visibility toggle
        $('grad-layers').addEventListener('click', function (e) {
            const eye = e.target.closest('.grad-layer-eye');
            if (eye) {
                const idx = parseInt(eye.dataset.eye, 10);
                if (!isNaN(idx) && layers[idx]) {
                    layers[idx].visible = layers[idx].visible === false ? true : false;
                    renderLayerTabs();
                    updatePreviewAndOutputs();
                }
                return;
            }

            const btn = e.target.closest('.grad-layer-tab');
            if (!btn) return;

            const idx = parseInt(btn.dataset.index, 10);
            if (isNaN(idx)) return;

            activeLayerIndex = idx;
            renderLayerTabs();
            loadActiveLayerIntoUI();
            updatePreviewAndOutputs();
        });

        // Colour stop interactions

        // Live updates for colour + transparency WITHOUT re-rendering (keeps colour picker open)
        $('grad-stops').addEventListener('input', function (e) {
            const row = e.target.closest('.grad-stop-row');
            if (!row) return;

            const idx = parseInt(row.dataset.index, 10);
            const layer = layers[activeLayerIndex];
            if (!layer || isNaN(idx) || !layer.stops[idx]) return;

            const stop = layer.stops[idx];

            if (e.target.classList.contains('grad-stop-color')) {
                stop.color = e.target.value;
                updatePreviewAndOutputs();
            } else if (e.target.classList.contains('grad-stop-transparent-input')) {
                stop.transparent = e.target.checked;
                updatePreviewAndOutputs();
            }
        });

        // Position changes: OK to re-render once user finishes editing
        $('grad-stops').addEventListener('change', function (e) {
            if (!e.target.classList.contains('grad-stop-position')) return;

            const row = e.target.closest('.grad-stop-row');
            if (!row) return;

            const idx = parseInt(row.dataset.index, 10);
            const layer = layers[activeLayerIndex];
            if (!layer || isNaN(idx) || !layer.stops[idx]) return;

            const stop = layer.stops[idx];

            let pos = parseInt(e.target.value, 10);
            if (isNaN(pos)) pos = 0;
            pos = Math.min(100, Math.max(0, pos));
            stop.position = pos;

            layer.stops.sort((a, b) => a.position - b.position);
            renderStopsForActiveLayer();
            updatePreviewAndOutputs();
        });

        // Remove stop
        $('grad-stops').addEventListener('click', function (e) {
            if (!e.target.classList.contains('grad-stop-remove')) return;

            const row = e.target.closest('.grad-stop-row');
            if (!row) return;

            const idx = parseInt(row.dataset.index, 10);
            const layer = layers[activeLayerIndex];
            if (!layer || isNaN(idx) || !layer.stops[idx]) return;

            if (layer.stops.length <= 2) return; // keep at least 2 stops

            layer.stops.splice(idx, 1);
            renderStopsForActiveLayer();
            updatePreviewAndOutputs();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
