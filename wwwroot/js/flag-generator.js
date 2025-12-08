// wwwroot/js/flag-generator.js

const SVG_NS = "http://www.w3.org/2000/svg";

function fg$(id) {
    return document.getElementById(id);
}

function fgClamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function fgRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ---------- colour helpers ---------- */

function fgHslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));

    return (
        "#" +
        [r, g, b]
            .map(x => x.toString(16).padStart(2, "0"))
            .join("")
            .toLowerCase()
    );
}

function fgRandomColour() {
    return fgColourFromRng(Math.random);
}

function fgColourFromRng(rng) {
    const h = Math.floor(rng() * 360);
    const s = 65 + Math.floor(rng() * 30);
    const l = 35 + Math.floor(rng() * 30);
    return fgHslToHex(h, s, l);
}

function fgBaseColours() {
    const c1 = fg$("fg-colour-1")?.value || "#002b5b";
    const c2 = fg$("fg-colour-2")?.value || "#f5f5f5";
    const c3 = fg$("fg-colour-3")?.value || "#d72638";
    return [c1, c2, c3];
}

function fgNormaliseColours(colours) {
    const c1 = colours[0] || "#002b5b";
    const c2 = colours[1] || "#f5f5f5";
    const c3 = colours[2] || null;
    return [c1, c2, c3]; // [background, main, accent]
}

/* ---------- state & segments ---------- */

let fgLastLayout = null;
let fgLastStripeCount = null;
let fgLastEmblemEnabled = null;
let fgLastBaseColours = null;

function fgReadState() {
    const layoutSelect = fg$("fg-layout");
    const stripesInput = fg$("fg-stripes");
    const layout = layoutSelect ? layoutSelect.value : "horizontal";

    let stripeCount = stripesInput ? parseInt(stripesInput.value, 10) : 3;
    if (!Number.isFinite(stripeCount)) stripeCount = 3;
    stripeCount = fgClamp(stripeCount, 2, 6);

    const emblemEnabled = !!fg$("fg-emblem-enabled")?.checked;
    const emblemType = fg$("fg-emblem-type")?.value || "circle";

    return {
        layout,
        stripeCount,
        colours: fgBaseColours(),
        emblemEnabled,
        emblemType
    };
}

// Defined segments for each layout. Each gets its own colour input.
function fgGetSegmentsForState(state) {
    const segments = [];
    const { layout, stripeCount, emblemEnabled } = state;

    if (layout === "horizontal" || layout === "vertical") {
        for (let i = 0; i < stripeCount; i++) {
            segments.push({ id: `stripe${i}`, label: `Stripe ${i + 1}` });
        }
    } else if (layout === "diagonal") {
        segments.push({ id: "background", label: "Background" });
        segments.push({ id: "diagonal", label: "Diagonal area" });
    } else if (layout === "cross") {
        segments.push({ id: "background", label: "Background" });
        segments.push({ id: "crossMain", label: "Cross" });
        segments.push({ id: "crossBorder", label: "Cross border" });
    } else if (layout === "nordic") {
        segments.push({ id: "background", label: "Background" });
        segments.push({ id: "crossMain", label: "Cross" });
        segments.push({ id: "crossBorder", label: "Cross border" });
    } else if (layout === "quartered") {
        segments.push({ id: "q1", label: "Top-left" });
        segments.push({ id: "q2", label: "Top-right" });
        segments.push({ id: "q3", label: "Bottom-left" });
        segments.push({ id: "q4", label: "Bottom-right" });
    } else if (layout === "saltire") {
        segments.push({ id: "background", label: "Background" });
        segments.push({ id: "saltireMain", label: "Saltire" });
        segments.push({ id: "saltireBorder", label: "Saltire border" });
    } else if (layout === "canton") {
        for (let i = 0; i < stripeCount; i++) {
            segments.push({ id: `stripe${i}`, label: `Stripe ${i + 1}` });
        }
        segments.push({ id: "canton", label: "Canton" });
    } else if (layout === "verticalBand") {
        segments.push({ id: "left", label: "Left field" });
        segments.push({ id: "centre", label: "Centre band" });
        segments.push({ id: "right", label: "Right field" });
    } else if (layout === "border") {
        segments.push({ id: "border", label: "Border" });
        segments.push({ id: "inner", label: "Inner field" });
    } else if (layout === "triangleHoist") {
        segments.push({ id: "background", label: "Background" });
        segments.push({ id: "triangle", label: "Triangle" });
    }

    if (emblemEnabled) {
        segments.push({ id: "emblem", label: "Emblem" });
    }

    return segments;
}

function fgGetSegmentColour(id, fallbackColour) {
    const input = fg$(`fg-seg-${id}`);
    if (input && input.value) return input.value;
    return fallbackColour;
}

// Build the segment colour controls in the sidebar
function fgBuildSegmentColourControls(state) {
    const container = fg$("fg-segment-colours");
    if (!container) return;

    const prevValues = {};
    container.querySelectorAll("input[type=color]").forEach(inp => {
        prevValues[inp.id] = inp.value;
    });

    const segments = fgGetSegmentsForState(state);
    const base = state.colours;

    if (segments.length === 0) {
        container.innerHTML = "<p class=\"tool-hint\">No segments for this layout.</p>";
        return;
    }

    let html = "";
    segments.forEach((seg, index) => {
        const id = `fg-seg-${seg.id}`;
        const fallback = base[index % base.length];
        const value = prevValues[id] || fallback;

        html += `
<div class="form-row fg-colour-row">
    <label class="form-label" for="${id}">${seg.label}</label>
    <input id="${id}" class="form-input" type="color" value="${value}">
</div>`;
    });

    container.innerHTML = html;

    // Segment colour changes: re-render SVG only (do NOT rebuild controls)
    container.querySelectorAll("input[type=color]").forEach(inp => {
        inp.addEventListener("input", () => fgRenderFlag({ skipSegments: true }));
    });
}

/* ---------- SVG helpers ---------- */

function fgClearSvg(svg) {
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
}

function fgRect(x, y, w, h, colour) {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
    rect.setAttribute("fill", colour);
    return rect;
}

function fgPolygon(points, colour) {
    const poly = document.createElementNS(SVG_NS, "polygon");
    poly.setAttribute("points", points.join(" "));
    poly.setAttribute("fill", colour);
    return poly;
}

/* ---------- layout draw functions ---------- */

function fgDrawHorizontalStripes(svg, state, width, height) {
    const { stripeCount, colours } = state;
    const stripeHeight = height / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
        const fallback = colours[i % colours.length];
        const colour = fgGetSegmentColour(`stripe${i}`, fallback);
        svg.appendChild(
            fgRect(0, i * stripeHeight, width, stripeHeight, colour)
        );
    }
}

function fgDrawVerticalStripes(svg, state, width, height) {
    const { stripeCount, colours } = state;
    const stripeWidth = width / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
        const fallback = colours[i % colours.length];
        const colour = fgGetSegmentColour(`stripe${i}`, fallback);
        svg.appendChild(
            fgRect(i * stripeWidth, 0, stripeWidth, height, colour)
        );
    }
}

function fgDrawDiagonal(svg, state, width, height) {
    const [bgDefault, overlayDefault] = fgNormaliseColours(state.colours);

    const bg = fgGetSegmentColour("background", bgDefault);
    const overlay = fgGetSegmentColour("diagonal", overlayDefault);

    svg.appendChild(fgRect(0, 0, width, height, bg));

    const points = [`${width},0`, `${width},${height}`, `0,${height}`];
    svg.appendChild(fgPolygon(points, overlay));
}

function fgDrawCenteredCross(svg, state, width, height) {
    const [bgDefault, crossDefault, borderDefault] = fgNormaliseColours(state.colours);

    const bg = fgGetSegmentColour("background", bgDefault);
    const crossMain = fgGetSegmentColour("crossMain", crossDefault);
    const crossBorder = borderDefault ? fgGetSegmentColour("crossBorder", borderDefault) : null;

    svg.appendChild(fgRect(0, 0, width, height, bg));

    const verticalWidth = width * 0.2;
    const horizontalHeight = height * 0.2;
    const borderWidth = width * 0.26;
    const borderHeight = height * 0.26;

    const cx = width / 2;
    const cy = height / 2;

    if (crossBorder) {
        svg.appendChild(
            fgRect(cx - borderWidth / 2, 0, borderWidth, height, crossBorder)
        );
        svg.appendChild(
            fgRect(0, cy - borderHeight / 2, width, borderHeight, crossBorder)
        );
    }

    svg.appendChild(
        fgRect(cx - verticalWidth / 2, 0, verticalWidth, height, crossMain)
    );
    svg.appendChild(
        fgRect(0, cy - horizontalHeight / 2, width, horizontalHeight, crossMain)
    );
}

function fgDrawNordicCross(svg, state, width, height) {
    const [bgDefault, crossDefault, borderDefault] = fgNormaliseColours(state.colours);

    const bg = fgGetSegmentColour("background", bgDefault);
    const crossMain = fgGetSegmentColour("crossMain", crossDefault);
    const crossBorder = borderDefault ? fgGetSegmentColour("crossBorder", borderDefault) : null;

    svg.appendChild(fgRect(0, 0, width, height, bg));

    const verticalWidth = width * 0.12;
    const horizontalHeight = height * 0.18;
    const borderWidth = width * 0.18;
    const borderHeight = height * 0.24;

    const cx = width * 0.35;
    const cy = height / 2;

    if (crossBorder) {
        svg.appendChild(
            fgRect(cx - borderWidth / 2, 0, borderWidth, height, crossBorder)
        );
        svg.appendChild(
            fgRect(0, cy - borderHeight / 2, width, borderHeight, crossBorder)
        );
    }

    svg.appendChild(
        fgRect(cx - verticalWidth / 2, 0, verticalWidth, height, crossMain)
    );
    svg.appendChild(
        fgRect(0, cy - horizontalHeight / 2, width, horizontalHeight, crossMain)
    );
}

function fgDrawQuartered(svg, state, width, height) {
    const base = state.colours;
    const q1 = fgGetSegmentColour("q1", base[0] || "#002b5b");
    const q2 = fgGetSegmentColour("q2", base[1] || base[0]);
    const q3 = fgGetSegmentColour("q3", base[2] || base[0]);
    const q4 = fgGetSegmentColour("q4", base[1] || base[2] || base[0]);

    const hw = width / 2;
    const hh = height / 2;

    svg.appendChild(fgRect(0, 0, hw, hh, q1));      // TL
    svg.appendChild(fgRect(hw, 0, hw, hh, q2));     // TR
    svg.appendChild(fgRect(0, hh, hw, hh, q3));     // BL
    svg.appendChild(fgRect(hw, hh, hw, hh, q4));    // BR
}

function fgDrawSaltire(svg, state, width, height) {
    const [bgDefault, mainDefault, borderDefault] = fgNormaliseColours(state.colours);

    const bg = fgGetSegmentColour("background", bgDefault);
    const main = fgGetSegmentColour("saltireMain", mainDefault);
    const border = borderDefault ? fgGetSegmentColour("saltireBorder", borderDefault) : null;

    svg.appendChild(fgRect(0, 0, width, height, bg));

    const createLine = (x1, y1, x2, y2, colour, strokeWidth) => {
        const line = document.createElementNS(SVG_NS, "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", colour);
        line.setAttribute("stroke-width", strokeWidth);
        line.setAttribute("stroke-linecap", "square");
        svg.appendChild(line);
    };

    const borderWidth = height * 0.28;
    const mainWidth = height * 0.18;

    if (border) {
        createLine(-width * 0.2, -height * 0.2, width * 1.2, height * 1.2, border, borderWidth);
        createLine(-width * 0.2, height * 1.2, width * 1.2, -height * 0.2, border, borderWidth);
    }

    createLine(-width * 0.2, -height * 0.2, width * 1.2, height * 1.2, main, mainWidth);
    createLine(-width * 0.2, height * 1.2, width * 1.2, -height * 0.2, main, mainWidth);
}

function fgDrawCanton(svg, state, width, height) {
    const { stripeCount, colours } = state;
    const stripeHeight = height / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
        const fallback = colours[i % colours.length];
        const colour = fgGetSegmentColour(`stripe${i}`, fallback);
        svg.appendChild(
            fgRect(0, i * stripeHeight, width, stripeHeight, colour)
        );
    }

    const cantonColour = fgGetSegmentColour("canton", colours[2] || colours[0]);
    const cantonWidth = width * 0.45;
    const cantonHeight = height * 0.5;
    svg.appendChild(fgRect(0, 0, cantonWidth, cantonHeight, cantonColour));
}

function fgDrawVerticalBand(svg, state, width, height) {
    const base = state.colours;
    const left = fgGetSegmentColour("left", base[0] || "#002b5b");
    const centre = fgGetSegmentColour("centre", base[1] || base[0]);
    const right = fgGetSegmentColour("right", base[2] || base[1] || base[0]);

    const leftWidth = width * 0.3;
    const centreWidth = width * 0.4;
    const rightWidth = width - leftWidth - centreWidth;

    svg.appendChild(fgRect(0, 0, leftWidth, height, left));
    svg.appendChild(fgRect(leftWidth, 0, centreWidth, height, centre));
    svg.appendChild(fgRect(leftWidth + centreWidth, 0, rightWidth, height, right));
}

function fgDrawBorder(svg, state, width, height) {
    const base = state.colours;
    const borderColour = fgGetSegmentColour("border", base[0] || "#002b5b");
    const innerColour = fgGetSegmentColour("inner", base[1] || base[0]);

    const border = Math.min(width, height) * 0.12;

    svg.appendChild(fgRect(0, 0, width, height, borderColour));
    svg.appendChild(fgRect(border, border, width - 2 * border, height - 2 * border, innerColour));
}

function fgDrawTriangleHoist(svg, state, width, height) {
    const [bgDefault, triDefault] = fgNormaliseColours(state.colours);

    const bg = fgGetSegmentColour("background", bgDefault);
    const tri = fgGetSegmentColour("triangle", triDefault);

    svg.appendChild(fgRect(0, 0, width, height, bg));

    const points = [`0,0`, `0,${height}`, `${width * 0.6},${height / 2}`];
    svg.appendChild(fgPolygon(points, tri));
}

/* ---------- emblem drawing ---------- */

function fgDrawEmblem(svg, state, width, height) {
    if (!state.emblemEnabled) return;

    const baseAccent = state.colours[2] || "#ffd700";
    const emblemColour = fgGetSegmentColour("emblem", baseAccent);
    const type = state.emblemType || "circle";

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.18;

    if (type === "circle") {
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", emblemColour);
        svg.appendChild(circle);
        return;
    }

    if (type === "square") {
        const side = radius * 2 * 0.9;
        const x = cx - side / 2;
        const y = cy - side / 2;
        svg.appendChild(fgRect(x, y, side, side, emblemColour));
        return;
    }

    if (type === "diamond") {
        const points = [
            `${cx},${cy - radius}`,
            `${cx + radius},${cy}`,
            `${cx},${cy + radius}`,
            `${cx - radius},${cy}`
        ];
        svg.appendChild(fgPolygon(points, emblemColour));
        return;
    }

    if (type === "ring") {
        const outer = document.createElementNS(SVG_NS, "circle");
        outer.setAttribute("cx", cx);
        outer.setAttribute("cy", cy);
        outer.setAttribute("r", radius);
        outer.setAttribute("fill", "none");
        outer.setAttribute("stroke", emblemColour);
        outer.setAttribute("stroke-width", radius * 0.35);
        svg.appendChild(outer);
        return;
    }

    if (type === "triple-star") {
        const innerRadius = radius * 0.45;
        const drawStarAt = (x, y, rOuter) => {
            const points = [];
            const inner = rOuter * 0.5;
            for (let i = 0; i < 10; i++) {
                const angle = -Math.PI / 2 + (i * Math.PI) / 5;
                const r = i % 2 === 0 ? rOuter : inner;
                const px = x + r * Math.cos(angle);
                const py = y + r * Math.sin(angle);
                points.push(`${px},${py}`);
            }
            svg.appendChild(fgPolygon(points, emblemColour));
        };

        const spacing = radius * 1.2;
        drawStarAt(cx - spacing, cy, innerRadius);
        drawStarAt(cx, cy, innerRadius);
        drawStarAt(cx + spacing, cy, innerRadius);
        return;
    }

    if (type === "sun") {
        const points = [];
        const outerR = radius * 1.2;
        const innerR = radius * 0.7;
        const steps = 32;
        for (let i = 0; i < steps; i++) {
            const angle = (i * 2 * Math.PI) / steps;
            const r = i % 2 === 0 ? outerR : innerR;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        svg.appendChild(fgPolygon(points, emblemColour));
        return;
    }

    // Default: single star
    const outerR = radius;
    const innerR = radius * 0.5;
    const points = [];
    for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    svg.appendChild(fgPolygon(points, emblemColour));
}

/* ---------- misc UI helpers ---------- */

function fgUpdateStripeVisibility(layout) {
    const row = fg$("fg-stripe-row");
    if (!row) return;

    if (layout === "cross" || layout === "nordic" || layout === "diagonal" ||
        layout === "quartered" || layout === "saltire" ||
        layout === "verticalBand" || layout === "border" || layout === "triangleHoist") {
        row.classList.add("fg-hidden");
    } else {
        row.classList.remove("fg-hidden");
    }
}

function fgUpdateEmblemControls() {
    const enabled = !!fg$("fg-emblem-enabled")?.checked;
    const typeSelect = fg$("fg-emblem-type");
    if (typeSelect) {
        typeSelect.disabled = !enabled;
        typeSelect.classList.toggle("fg-disabled", !enabled);
    }
}

/* ---------- render ---------- */

function fgRenderFlag(options) {
    const svg = fg$("flag-preview");
    if (!svg) {
        console.warn("Flag Generator: #flag-preview not found");
        return;
    }

    const state = fgReadState();
    const width = 300;
    const height = 200;

    const layoutChanged = state.layout !== fgLastLayout;
    const stripeChanged = state.stripeCount !== fgLastStripeCount;
    const emblemChanged = state.emblemEnabled !== fgLastEmblemEnabled;
    const skipSegments = options && options.skipSegments;

    fgUpdateStripeVisibility(state.layout);
    fgUpdateEmblemControls();

    if (!skipSegments && (layoutChanged || stripeChanged || emblemChanged || !fgLastLayout)) {
        fgBuildSegmentColourControls(state);
    }

    fgLastLayout = state.layout;
    fgLastStripeCount = state.stripeCount;
    fgLastEmblemEnabled = state.emblemEnabled;

    svg.setAttribute("viewBox", "0 0 300 200");
    fgClearSvg(svg);

    switch (state.layout) {
        case "vertical":
            fgDrawVerticalStripes(svg, state, width, height);
            break;
        case "cross":
            fgDrawCenteredCross(svg, state, width, height);
            break;
        case "nordic":
            fgDrawNordicCross(svg, state, width, height);
            break;
        case "diagonal":
            fgDrawDiagonal(svg, state, width, height);
            break;
        case "quartered":
            fgDrawQuartered(svg, state, width, height);
            break;
        case "saltire":
            fgDrawSaltire(svg, state, width, height);
            break;
        case "canton":
            fgDrawCanton(svg, state, width, height);
            break;
        case "verticalBand":
            fgDrawVerticalBand(svg, state, width, height);
            break;
        case "border":
            fgDrawBorder(svg, state, width, height);
            break;
        case "triangleHoist":
            fgDrawTriangleHoist(svg, state, width, height);
            break;
        case "horizontal":
        default:
            fgDrawHorizontalStripes(svg, state, width, height);
            break;
    }

    fgDrawEmblem(svg, state, width, height);
}

/* ---------- base palette → segments sync ---------- */

function fgOnBaseColourChange() {
    const oldPalette = fgLastBaseColours || fgBaseColours();
    const newPalette = fgBaseColours();

    const container = fg$("fg-segment-colours");
    if (container) {
        container.querySelectorAll("input[type=color]").forEach(inp => {
            const current = inp.value?.toLowerCase();
            if (!current) return;

            for (let i = 0; i < oldPalette.length; i++) {
                if (!oldPalette[i]) continue;
                if (current === oldPalette[i].toLowerCase()) {
                    if (newPalette[i]) {
                        inp.value = newPalette[i];
                    }
                }
            }
        });
    }

    fgLastBaseColours = newPalette;
    fgRenderFlag({ skipSegments: true });
}

/* ---------- randomisation / reset ---------- */

function fgRandomiseColoursOnly() {
    const c1 = fg$("fg-colour-1");
    const c2 = fg$("fg-colour-2");
    const c3 = fg$("fg-colour-3");
    if (c1) c1.value = fgRandomColour();
    if (c2) c2.value = fgRandomColour();
    if (c3) c3.value = fgRandomColour();

    // Use the same logic as manual palette edits
    fgOnBaseColourChange();
}

function fgRandomiseAll() {
    const layoutSelect = fg$("fg-layout");
    const stripesInput = fg$("fg-stripes");
    const emblemCheckbox = fg$("fg-emblem-enabled");
    const emblemTypeSelect = fg$("fg-emblem-type");

    const layouts = [
        "horizontal", "vertical", "cross", "nordic", "diagonal",
        "quartered", "saltire", "canton", "verticalBand", "border", "triangleHoist"
    ];
    const randomLayout = layouts[fgRandomInt(0, layouts.length - 1)];

    if (layoutSelect) layoutSelect.value = randomLayout;

    if (stripesInput && (randomLayout === "horizontal" || randomLayout === "vertical" || randomLayout === "canton")) {
        stripesInput.value = String(fgRandomInt(2, 6));
    }

    const showEmblem = Math.random() < 0.6;
    if (emblemCheckbox) emblemCheckbox.checked = showEmblem;
    if (emblemTypeSelect) {
        const types = ["circle", "star", "diamond", "ring", "triple-star", "square", "sun"];
        emblemTypeSelect.value = types[fgRandomInt(0, types.length - 1)];
    }

    fgRandomiseColoursOnly();
}

function fgResetSegmentsToBase() {
    const state = fgReadState();
    const segments = fgGetSegmentsForState(state);
    const base = state.colours;
    const container = fg$("fg-segment-colours");
    if (!container) return;

    segments.forEach((seg, index) => {
        const input = fg$(`fg-seg-${seg.id}`);
        if (input) {
            input.value = base[index % base.length];
        }
    });

    fgRenderFlag({ skipSegments: true });
}

function fgResetFlag() {
    const layoutSelect = fg$("fg-layout");
    const stripesInput = fg$("fg-stripes");
    const c1 = fg$("fg-colour-1");
    const c2 = fg$("fg-colour-2");
    const c3 = fg$("fg-colour-3");
    const emblemCheckbox = fg$("fg-emblem-enabled");
    const emblemTypeSelect = fg$("fg-emblem-type");
    const seedInput = fg$("fg-seed-text");

    if (layoutSelect) layoutSelect.value = "horizontal";
    if (stripesInput) stripesInput.value = "3";
    if (c1) c1.value = "#002b5b";
    if (c2) c2.value = "#f5f5f5";
    if (c3) c3.value = "#d72638";
    if (emblemCheckbox) emblemCheckbox.checked = false;
    if (emblemTypeSelect) emblemTypeSelect.value = "circle";
    if (seedInput) seedInput.value = "";

    fgLastBaseColours = fgBaseColours();
    fgLastLayout = null;
    fgLastStripeCount = null;
    fgLastEmblemEnabled = null;

    fgRenderFlag();
}

function fgDownloadSvg() {
    const svg = fg$("flag-preview");
    if (!svg) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.match(/^<svg[^>]+xmlns="/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    source = '<?xml version="1.0" encoding="UTF-8"?>\n' + source;

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "flag.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function fgDownloadPng() {
    const svg = fg$("flag-preview");
    if (!svg) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.match(/^<svg[^>]+xmlns="/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBase64 = window.btoa(unescape(encodeURIComponent(source)));
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + svgBase64;

    img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 600;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(function (blob) {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "flag.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, "image/png");
    };
}

/* ---------- seeded random from text ---------- */

function fgHashString(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return (h >>> 0);
}

function fgMulberry32(a) {
    return function () {
        let t = (a += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function fgRandomFromSeed() {
    const seedInput = fg$("fg-seed-text");
    if (!seedInput) return;

    const text = seedInput.value.trim();
    if (!text) return;

    const seed = fgHashString(text);
    const rng = fgMulberry32(seed);

    const layoutSelect = fg$("fg-layout");
    const stripesInput = fg$("fg-stripes");
    const c1 = fg$("fg-colour-1");
    const c2 = fg$("fg-colour-2");
    const c3 = fg$("fg-colour-3");
    const emblemCheckbox = fg$("fg-emblem-enabled");
    const emblemTypeSelect = fg$("fg-emblem-type");

    const layouts = [
        "horizontal", "vertical", "cross", "nordic", "diagonal",
        "quartered", "saltire", "canton", "verticalBand", "border", "triangleHoist"
    ];
    const layout = layouts[Math.floor(rng() * layouts.length)];
    if (layoutSelect) layoutSelect.value = layout;

    if (stripesInput && (layout === "horizontal" || layout === "vertical" || layout === "canton")) {
        const stripes = 2 + Math.floor(rng() * 5); // 2-6
        stripesInput.value = String(stripes);
    }

    if (c1) c1.value = fgColourFromRng(rng);
    if (c2) c2.value = fgColourFromRng(rng);
    if (c3) c3.value = fgColourFromRng(rng);

    const showEmblem = rng() < 0.7;
    const types = ["circle", "star", "diamond", "ring", "triple-star", "square", "sun"];
    const emblemType = types[Math.floor(rng() * types.length)];

    if (emblemCheckbox) emblemCheckbox.checked = showEmblem;
    if (emblemTypeSelect) emblemTypeSelect.value = emblemType;

    fgLastBaseColours = fgBaseColours();
    fgLastLayout = null;
    fgRenderFlag();
}

/* ---------- init ---------- */

function fgInit() {
    const svg = fg$("flag-preview");
    if (!svg) return;

    const layoutSelect = fg$("fg-layout");
    const stripesInput = fg$("fg-stripes");
    const c1 = fg$("fg-colour-1");
    const c2 = fg$("fg-colour-2");
    const c3 = fg$("fg-colour-3");
    const btnRandom = fg$("fg-random");
    const btnRandomColours = fg$("fg-random-colours");
    const btnReset = fg$("fg-reset");
    const btnSvg = fg$("fg-download-svg");
    const btnPng = fg$("fg-download-png");
    const emblemCheckbox = fg$("fg-emblem-enabled");
    const emblemTypeSelect = fg$("fg-emblem-type");
    const btnRandomSeed = fg$("fg-random-seed");
    const btnResetSegments = fg$("fg-reset-segments");

    if (layoutSelect) layoutSelect.addEventListener("change", () => fgRenderFlag());
    if (stripesInput) stripesInput.addEventListener("input", () => fgRenderFlag());

    if (c1) c1.addEventListener("input", fgOnBaseColourChange);
    if (c2) c2.addEventListener("input", fgOnBaseColourChange);
    if (c3) c3.addEventListener("input", fgOnBaseColourChange);

    if (emblemCheckbox) {
        emblemCheckbox.addEventListener("change", () => fgRenderFlag());
    }
    if (emblemTypeSelect) {
        emblemTypeSelect.addEventListener("change", () => fgRenderFlag());
    }

    if (btnRandom) btnRandom.addEventListener("click", fgRandomiseAll);
    if (btnRandomColours) btnRandomColours.addEventListener("click", fgRandomiseColoursOnly);
    if (btnReset) btnReset.addEventListener("click", fgResetFlag);
    if (btnSvg) btnSvg.addEventListener("click", fgDownloadSvg);
    if (btnPng) btnPng.addEventListener("click", fgDownloadPng);
    if (btnRandomSeed) btnRandomSeed.addEventListener("click", fgRandomFromSeed);
    if (btnResetSegments) btnResetSegments.addEventListener("click", fgResetSegmentsToBase);

    fgLastBaseColours = fgBaseColours();
    fgRenderFlag();
}

document.addEventListener("DOMContentLoaded", fgInit);

// Debug helpers
window.fgRenderFlag = fgRenderFlag;
window.fgRandomFromSeed = fgRandomFromSeed;
