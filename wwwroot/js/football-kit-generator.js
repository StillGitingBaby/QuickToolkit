// Football Kit Generator – reference-style silhouette
// Shirt + sleeves like the flat template image, wedge shorts with central notch, socks + boots.

(function () {
    const state = {
        template: "plain",
        colours: {
            primary: "#0044cc",
            secondary: "#ffffff",
            accent: "#ffcc00",
            sleeve: "#0044cc",
            collar: "#ffffff",
            sponsor: "#ffffff"
        },
        sleeveStyle: "short",
        collarStyle: "v-neck",
        badge: {
            shape: "circle",
            main: "#ffffff",
            secondary: "#0044cc",
            text: "QTK"
        },
        sponsor: {
            text: "QuickToolbox",
            font: "sans",
            size: 28,
            colour: "#ffffff"
        },
        shorts: {
            pattern: "plain", // shorts patterns disabled for now
            primary: "#0044cc",
            secondary: "#ffffff"
        },
        socks: {
            pattern: "plain",
            primary: "#0044cc",
            secondary: "#ffffff"
        }
    };

    const $ = id => document.getElementById(id);

    // ------------------------ init & wiring ------------------------

    function init() {
        const canvas = $("kit-canvas");
        if (!canvas) return;

        const templateEl = $("kit-template");
        const sleeveStyleEl = $("kit-sleeve-style");
        const collarStyleEl = $("kit-collar-style");
        const badgeShapeEl = $("kit-badge-shape");
        const shortsPatternEl = $("kit-shorts-pattern");
        const socksPatternEl = $("kit-socks-pattern");

        templateEl?.addEventListener("change", () => {
            state.template = templateEl.value;
            drawKit();
        });
        sleeveStyleEl?.addEventListener("change", () => {
            state.sleeveStyle = sleeveStyleEl.value;
            drawKit();
        });
        collarStyleEl?.addEventListener("change", () => {
            state.collarStyle = collarStyleEl.value;
            drawKit();
        });
        badgeShapeEl?.addEventListener("change", () => {
            state.badge.shape = badgeShapeEl.value;
            drawKit();
        });

        // still wired for later, but shorts.pattern is ignored in drawing
        shortsPatternEl?.addEventListener("change", () => {
            state.shorts.pattern = shortsPatternEl.value;
            drawKit();
        });
        socksPatternEl?.addEventListener("change", () => {
            state.socks.pattern = socksPatternEl.value;
            drawKit();
        });

        // colour pickers
        const colourMap = {
            "kit-colour-primary": v => (state.colours.primary = v),
            "kit-colour-secondary": v => (state.colours.secondary = v),
            "kit-colour-accent": v => (state.colours.accent = v),
            "kit-colour-sleeve": v => (state.colours.sleeve = v),
            "kit-colour-collar": v => (state.colours.collar = v),
            "kit-badge-main": v => (state.badge.main = v),
            "kit-badge-secondary": v => (state.badge.secondary = v),
            "kit-sponsor-colour": v => {
                state.sponsor.colour = v;
                state.colours.sponsor = v;
            },
            "kit-shorts-primary": v => (state.shorts.primary = v),
            "kit-shorts-secondary": v => (state.shorts.secondary = v),
            "kit-socks-primary": v => (state.socks.primary = v),
            "kit-socks-secondary": v => (state.socks.secondary = v)
        };

        Object.keys(colourMap).forEach(id => {
            const el = $(id);
            if (!el) return;
            el.addEventListener("input", () => {
                colourMap[id](el.value);
                drawKit();
            });
        });

        // badge & sponsor
        const badgeTextEl = $("kit-badge-text");
        const sponsorTextEl = $("kit-sponsor-text");
        const sponsorFontEl = $("kit-sponsor-font");
        const sponsorSizeEl = $("kit-sponsor-size");

        badgeTextEl?.addEventListener("input", () => {
            state.badge.text = badgeTextEl.value.toUpperCase().slice(0, 4);
            drawKit();
        });
        sponsorTextEl?.addEventListener("input", () => {
            state.sponsor.text = sponsorTextEl.value;
            drawKit();
        });
        sponsorFontEl?.addEventListener("change", () => {
            state.sponsor.font = sponsorFontEl.value;
            drawKit();
        });
        sponsorSizeEl?.addEventListener("input", () => {
            state.sponsor.size = parseInt(sponsorSizeEl.value, 10) || 28;
            drawKit();
        });

        // random + download
        $("kit-random-colours")?.addEventListener("click", () => {
            randomiseColours();
            syncControlsFromState();
            drawKit();
        });
        $("kit-random-full")?.addEventListener("click", () => {
            randomiseFull();
            syncControlsFromState();
            drawKit();
        });
        $("kit-download-btn")?.addEventListener("click", downloadPng);

        syncControlsFromState();
        drawKit();
    }

    function syncControlsFromState() {
        const { template, colours, sleeveStyle, collarStyle, badge, sponsor, shorts, socks } = state;
        const setVal = (id, v) => {
            const el = $(id);
            if (el) el.value = v;
        };

        setVal("kit-template", template);
        setVal("kit-colour-primary", colours.primary);
        setVal("kit-colour-secondary", colours.secondary);
        setVal("kit-colour-accent", colours.accent);
        setVal("kit-colour-sleeve", colours.sleeve);
        setVal("kit-colour-collar", colours.collar);
        setVal("kit-sleeve-style", sleeveStyle);
        setVal("kit-collar-style", collarStyle);

        setVal("kit-badge-shape", badge.shape);
        setVal("kit-badge-main", badge.main);
        setVal("kit-badge-secondary", badge.secondary);
        setVal("kit-badge-text", badge.text);

        setVal("kit-sponsor-text", sponsor.text);
        setVal("kit-sponsor-font", sponsor.font);
        setVal("kit-sponsor-size", sponsor.size.toString());
        setVal("kit-sponsor-colour", sponsor.colour || colours.sponsor || "#ffffff");

        setVal("kit-shorts-pattern", shorts.pattern);
        setVal("kit-shorts-primary", shorts.primary);
        setVal("kit-shorts-secondary", shorts.secondary);

        setVal("kit-socks-pattern", socks.pattern);
        setVal("kit-socks-primary", socks.primary);
        setVal("kit-socks-secondary", socks.secondary);
    }

    // ------------------------ main drawing ------------------------

    function drawKit() {
        const canvas = $("kit-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        renderKit(ctx, canvas.width, canvas.height);
    }

    function renderKit(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);

        // outer bg
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, w, h);

        const inset = Math.round(w * 0.07);
        const cardX = inset;
        const cardY = inset;
        const cardW = w - inset * 2;
        const cardH = h - inset * 2;

        ctx.save();
        roundRect(ctx, cardX, cardY, cardW, cardH, 24);
        ctx.clip();

        const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
        bgGrad.addColorStop(0, "#020617");
        bgGrad.addColorStop(1, "#020617");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Shirt body (flat front like reference)
        const shirtWidth = cardW * 0.55;
        const shirtHeight = cardH * 0.55;
        const shirtX = cardX + (cardW - shirtWidth) / 2;
        const shirtY = cardY + cardH * 0.08;
        const shirt = { x: shirtX, y: shirtY, width: shirtWidth, height: shirtHeight };

        // Shorts directly under shirt
        const shortsWidth = shirtWidth; // same width as shirt at top
        const shortsHeight = cardH * 0.3;
        const shortsX = shirtX;
        const shortsY = shirtY + shirtHeight;
        const shorts = { x: shortsX, y: shortsY, width: shortsWidth, height: shortsHeight };

        // Socks + boots
        const socks = calculateSockGeometry(shorts);
        const boots = calculateBootGeometry(socks);

        // order
        drawSocks(ctx, socks, state);
        drawBoots(ctx, boots);
        drawShorts(ctx, shorts, state);
        drawSleeves(ctx, shirt, state);

        // shirt body & pattern
        ctx.save();
        drawShirtShape(ctx, shirt);
        ctx.clip();
        ctx.fillStyle = state.colours.primary;
        ctx.fillRect(shirt.x, shirt.y, shirt.width, shirt.height);
        drawPattern(ctx, shirt, state);
        ctx.restore();

        drawCollar(ctx, shirt, state);
        drawBadge(ctx, shirt, state);
        drawSponsor(ctx, shirt, state);

        ctx.restore();
    }

    function roundRect(ctx, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // ------------------------ shirt & pattern ------------------------

    // Simple curved-top rectangle exactly like the reference
    function drawShirtShape(ctx, shirt) {
        const { x, y, width, height } = shirt;
        const topCurve = height * 0.22;

        const topY = y + topCurve;
        const bottomY = y + height;

        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.quadraticCurveTo(x + width / 2, y, x + width, topY);
        ctx.lineTo(x + width, bottomY);
        ctx.lineTo(x, bottomY);
        ctx.closePath();
    }

    function drawPattern(ctx, shirt, state) {
        const { template } = state;
        const c1 = state.colours.primary;
        const c2 = state.colours.secondary;

        switch (template) {
            case "stripes-vertical":
                drawVerticalStripes(ctx, shirt, c1, c2);
                break;
            case "hoops":
                drawHoops(ctx, shirt, c1, c2);
                break;
            case "sash":
                drawSash(ctx, shirt, c2);
                break;
            case "halves":
                drawHalves(ctx, shirt, c1, c2);
                break;
            case "quarters":
                drawQuarters(ctx, shirt, c1, c2);
                break;
            case "modern-panel":
                drawModernPanels(ctx, shirt, c2, state.colours.accent);
                break;
            case "plain":
            default: {
                const grad = ctx.createLinearGradient(
                    shirt.x,
                    shirt.y,
                    shirt.x,
                    shirt.y + shirt.height
                );
                grad.addColorStop(0, lighten(c1, 0.06));
                grad.addColorStop(1, darken(c1, 0.06));
                ctx.fillStyle = grad;
                ctx.fillRect(shirt.x, shirt.y, shirt.width, shirt.height);
                break;
            }
        }
    }

    function drawVerticalStripes(ctx, area, c1, c2) {
        const stripeWidth = 36;
        let toggle = false;
        for (let x = area.x; x < area.x + area.width; x += stripeWidth) {
            ctx.fillStyle = toggle ? c1 : c2;
            ctx.fillRect(x, area.y, stripeWidth, area.height);
            toggle = !toggle;
        }
    }

    function drawHoops(ctx, area, c1, c2) {
        const hoopHeight = 40;
        let toggle = false;
        for (let y = area.y; y < area.y + area.height; y += hoopHeight) {
            ctx.fillStyle = toggle ? c1 : c2;
            ctx.fillRect(area.x, y, area.width, hoopHeight);
            toggle = !toggle;
        }
    }

    function drawSash(ctx, shirt, colour) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = colour;

        ctx.beginPath();
        ctx.moveTo(shirt.x - 40, shirt.y + 40);
        ctx.lineTo(shirt.x + 50, shirt.y - 30);
        ctx.lineTo(shirt.x + shirt.width + 40, shirt.y + shirt.height - 40);
        ctx.lineTo(shirt.x + shirt.width - 50, shirt.y + shirt.height + 30);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawHalves(ctx, area, c1, c2) {
        const midX = area.x + area.width / 2;
        ctx.fillStyle = c1;
        ctx.fillRect(area.x, area.y, area.width / 2, area.height);
        ctx.fillStyle = c2;
        ctx.fillRect(midX, area.y, area.width / 2, area.height);
    }

    function drawQuarters(ctx, area, c1, c2) {
        const midX = area.x + area.width / 2;
        const midY = area.y + area.height / 2;
        ctx.fillStyle = c1;
        ctx.fillRect(area.x, area.y, area.width / 2, area.height / 2);
        ctx.fillRect(midX, midY, area.width / 2, area.height / 2);
        ctx.fillStyle = c2;
        ctx.fillRect(midX, area.y, area.width / 2, area.height / 2);
        ctx.fillRect(area.x, midY, area.width / 2, area.height / 2);
    }

    function drawModernPanels(ctx, shirt, base, accent) {
        ctx.fillStyle = base;
        ctx.fillRect(shirt.x, shirt.y, shirt.width, shirt.height);

        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(shirt.x, shirt.y + 40);
        ctx.lineTo(shirt.x + shirt.width * 0.75, shirt.y);
        ctx.lineTo(shirt.x + shirt.width, shirt.y + shirt.height * 0.5);
        ctx.lineTo(shirt.x + shirt.width * 0.25, shirt.y + shirt.height * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // ------------------------ sleeves, collar, badge, sponsor ------------------------

    // Sleeves: straight wedges attached at sides, same vertical level both sides
    function drawSleeves(ctx, shirt, state) {
        const colour = state.colours.sleeve || state.colours.primary;
        const { x, y, width, height } = shirt;

        // Must match the point where the shoulder meets the body
        const topCurve = height * 0.22;
        const shoulderY = y + topCurve;

        const sleeveLength = width * 0.25;  // how far sleeves stick out
        const sleeveThickness = height * 0.34;

        const shoulderDrop = height * 0.2; // how much the outer top is below the inner top

        // Inner (attached) edge – vertical
        const innerTopY = shoulderY;
        const innerBottomY = innerTopY + sleeveThickness;

        // Outer edge – angled down a bit
        const outerTopY = shoulderY + shoulderDrop;
        const outerBottomY = outerTopY + sleeveThickness * 0.95;

        ctx.fillStyle = colour;

        // LEFT SLEEVE – slight downward angle
        ctx.beginPath();
        ctx.moveTo(x, innerTopY);                            // inner top
        ctx.lineTo(x - sleeveLength, outerTopY);             // outer top (lower)
        ctx.lineTo(x - sleeveLength, outerBottomY);          // outer bottom
        ctx.lineTo(x, innerBottomY);                         // inner bottom
        ctx.closePath();
        ctx.fill();

        // RIGHT SLEEVE – mirror
        const rx = x + width;
        ctx.beginPath();
        ctx.moveTo(rx, innerTopY);
        ctx.lineTo(rx + sleeveLength, outerTopY);
        ctx.lineTo(rx + sleeveLength, outerBottomY);
        ctx.lineTo(rx, innerBottomY);
        ctx.closePath();
        ctx.fill();
    }

    function drawCollar(ctx, shirt, state) {
        const { x, y, width, height } = shirt;
        const collarColour = state.colours.collar || "#ffffff";

        // --- tweakable geometry knobs ---
        const topCurve = height * 0.22;      // must match drawShirtShape
        const neckTopFactor = 0.60;          // 0 = very top of arc, 1 = bottom of curved section
        const neckWidthFactor = 0.32;        // fraction of shirt width
        const vDepthFactor = 0.22;           // depth of V neck
        const roundDepthFactor = 0.16;       // depth of round collar
        const vExtraPointFactor = 0.05;      // extra point on V
        const placketWidthFactor = 0.10;     // polo placket width vs shirt width
        const placketDepthFactor = 0.18;     // polo placket depth vs shirt height

        const neckTopY = y + topCurve * neckTopFactor;
        const neckWidth = width * neckWidthFactor;
        const vDepth = height * vDepthFactor;
        const vExtra = height * vExtraPointFactor;
        const roundDepth = height * roundDepthFactor;
        const placketWidth = width * placketWidthFactor;
        const placketDepth = height * placketDepthFactor;
        const midX = x + width / 2;

        ctx.save();

        // Clip to shirt so collar stays under the curved neckline
        ctx.beginPath();
        drawShirtShape(ctx, shirt); // reuse existing shirt path
        ctx.clip();

        ctx.fillStyle = collarColour;

        if (state.collarStyle === "v-neck") {
            // --- V-NECK ---
            ctx.beginPath();
            ctx.moveTo(midX - neckWidth / 2, neckTopY);              // left top
            ctx.lineTo(midX + neckWidth / 2, neckTopY);              // right top
            ctx.lineTo(midX + neckWidth * 0.35, neckTopY + vDepth);  // right inner
            ctx.lineTo(midX, neckTopY + vDepth + vExtra);            // bottom point
            ctx.lineTo(midX - neckWidth * 0.35, neckTopY + vDepth);  // left inner
            ctx.closePath();
            ctx.fill();

        } else if (state.collarStyle === "polo") {
            // --- POLO COLLAR: two flaps + central placket ---
            const flapDepth = placketDepth * 0.7;

            // left flap
            ctx.beginPath();
            ctx.moveTo(midX - neckWidth / 2, neckTopY);
            ctx.lineTo(midX - placketWidth / 2, neckTopY);
            ctx.lineTo(midX - placketWidth / 2, neckTopY + flapDepth * 0.2);
            ctx.lineTo(midX - neckWidth * 0.3, neckTopY + flapDepth);
            ctx.closePath();
            ctx.fill();

            // right flap (mirror)
            ctx.beginPath();
            ctx.moveTo(midX + neckWidth / 2, neckTopY);
            ctx.lineTo(midX + placketWidth / 2, neckTopY);
            ctx.lineTo(midX + placketWidth / 2, neckTopY + flapDepth * 0.2);
            ctx.lineTo(midX + neckWidth * 0.3, neckTopY + flapDepth);
            ctx.closePath();
            ctx.fill();

            // central placket
            ctx.fillRect(
                midX - placketWidth / 2,
                neckTopY,
                placketWidth,
                placketDepth
            );

        } else {
            // --- ROUND / CREW NECK ---
            const lipOffset = height * 0.02;

            ctx.beginPath();
            ctx.moveTo(midX - neckWidth / 2, neckTopY);
            ctx.quadraticCurveTo(
                midX,
                neckTopY + roundDepth,
                midX + neckWidth / 2,
                neckTopY
            );
            ctx.lineTo(midX + neckWidth / 2, neckTopY - lipOffset);
            ctx.quadraticCurveTo(
                midX,
                neckTopY + roundDepth * 0.6,
                midX - neckWidth / 2,
                neckTopY - lipOffset
            );
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }




    function drawBadge(ctx, shirt, state) {
        const { x, y, width, height } = shirt;
        const { shape, main, secondary, text } = state.badge;
        if (!shape || shape === "none") return;

        const cx = x + width * 0.78;
        const cy = y + height * 0.32;
        const size = width * 0.11;

        // Scale for export vs preview so text & stroke look consistent
        const scale = ctx.canvas.width / 500; // 500 = base logical size

        ctx.save();
        ctx.fillStyle = main;
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 3 * scale;

        ctx.beginPath();
        if (shape === "circle") {
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
        } else if (shape === "shield") {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size * 0.8, cy - size * 0.2);
            ctx.lineTo(cx + size * 0.4, cy + size);
            ctx.lineTo(cx - size * 0.4, cy + size);
            ctx.lineTo(cx - size * 0.8, cy - size * 0.2);
            ctx.closePath();
        } else if (shape === "diamond") {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size);
            ctx.lineTo(cx - size, cy);
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = secondary;
        if (shape === "circle") {
            ctx.arc(cx, cy, size * 0.6, 0, Math.PI * 2);
        } else if (shape === "shield") {
            ctx.moveTo(cx, cy - size * 0.6);
            ctx.lineTo(cx + size * 0.55, cy - size * 0.15);
            ctx.lineTo(cx + size * 0.25, cy + size * 0.6);
            ctx.lineTo(cx - size * 0.25, cy + size * 0.6);
            ctx.lineTo(cx - size * 0.55, cy - size * 0.15);
            ctx.closePath();
        } else if (shape === "diamond") {
            ctx.moveTo(cx, cy - size * 0.6);
            ctx.lineTo(cx + size * 0.6, cy);
            ctx.lineTo(cx, cy + size * 0.6);
            ctx.lineTo(cx - size * 0.6, cy);
            ctx.closePath();
        }
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (text && text.trim().length > 0) {
            ctx.fillStyle = main;
            const fontPx = 14 * scale;
            ctx.font = `bold ${fontPx}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text.toUpperCase(), cx, cy + 1 * scale);
        }

        ctx.restore();
    }

    function drawSponsor(ctx, shirt, state) {
        const { x, y, width, height } = shirt;
        const { text, font, size, colour } = state.sponsor;
        if (!text || text.trim().length === 0) return;

        const centreX = x + width / 2;
        const centreY = y + height * 0.55;

        // Scale sponsor font & outline with canvas size
        const scale = ctx.canvas.width / 500; // 500 = base logical canvas
        const fontPx = size * scale;

        ctx.save();
        ctx.fillStyle = colour || "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const fontFamily =
            font === "condensed"
                ? "'Arial Narrow', system-ui, sans-serif"
                : font === "serif"
                    ? "Georgia, 'Times New Roman', serif"
                    : font === "script"
                        ? "'Brush Script MT', 'Segoe Script', cursive"
                        : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

        ctx.font = `bold ${fontPx}px ${fontFamily}`;
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 4 * scale;
        ctx.strokeText(text, centreX, centreY);
        ctx.fillText(text, centreX, centreY);

        ctx.restore();
    }

    // ------------------------ shorts, socks, boots ------------------------

    // Shorts: rectangle with an upward V notch in the centre.
    function drawShorts(ctx, shorts, state) {
        const primary = state.shorts.primary;
        const { x, y, width, height } = shorts;

        const topY = y;
        const bottomY = y + height;

        // notch = bite up into bottom edge
        const notchWidth = width * 0.35;
        const notchDepth = height * 0.35;

        const midX = x + width / 2;
        const notchLeftX = midX - notchWidth / 2;
        const notchRightX = midX + notchWidth / 2;
        const notchTopY = bottomY - notchDepth;

        ctx.save();

        // Flat colour so it matches the hex exactly
        ctx.fillStyle = primary;

        ctx.beginPath();
        ctx.moveTo(x, topY);                 // top left
        ctx.lineTo(x + width, topY);         // top right
        ctx.lineTo(x + width, bottomY);      // bottom right outer
        ctx.lineTo(notchRightX, bottomY);    // into notch
        ctx.lineTo(midX, notchTopY);         // notch tip
        ctx.lineTo(notchLeftX, bottomY);     // out of notch
        ctx.lineTo(x, bottomY);              // bottom left outer
        ctx.closePath();
        ctx.fill();

        // waistband highlight
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + 4, topY + 3);
        ctx.lineTo(x + width - 4, topY + 3);
        ctx.stroke();

        ctx.restore();
    }

    function calculateSockGeometry(shorts) {
        const { x, y, width, height } = shorts;

        const bottomY = y + height;
        const sockTop = bottomY + height * 0.08; // small gap under shorts

        const totalWidth = width * 0.6;   // overall span of both socks
        const gap = width * 0.08;        // gap between socks
        const sockWidth = (totalWidth - gap) / 2;

        const leftSockX = x + (width - totalWidth) / 2;
        const rightSockX = leftSockX + sockWidth + gap;
        const sockHeight = height * 0.75;

        return {
            left: { x: leftSockX, y: sockTop, width: sockWidth, height: sockHeight },
            right: { x: rightSockX, y: sockTop, width: sockWidth, height: sockHeight }
        };
    }

    function drawSocks(ctx, socks, state) {
        const { pattern, primary, secondary } = state.socks;

        ["left", "right"].forEach(side => {
            const seg = socks[side];
            if (!seg) return;

            ctx.save();
            const radius = seg.width * 0.22;

            ctx.beginPath();
            ctx.moveTo(seg.x + radius, seg.y);
            ctx.lineTo(seg.x + seg.width - radius, seg.y);
            ctx.quadraticCurveTo(seg.x + seg.width, seg.y, seg.x + seg.width, seg.y + radius);
            ctx.lineTo(seg.x + seg.width, seg.y + seg.height);
            ctx.lineTo(seg.x, seg.y + seg.height);
            ctx.lineTo(seg.x, seg.y + radius);
            ctx.quadraticCurveTo(seg.x, seg.y, seg.x + radius, seg.y);
            ctx.closePath();

            ctx.clip();

            const grad = ctx.createLinearGradient(seg.x, seg.y, seg.x, seg.y + seg.height);
            grad.addColorStop(0, lighten(primary, 0.06));
            grad.addColorStop(1, darken(primary, 0.06));
            ctx.fillStyle = grad;
            ctx.fillRect(seg.x, seg.y, seg.width, seg.height);

            if (pattern === "hoops") {
                const bandH = seg.height * 0.18;
                let toggle = false;
                for (let y = seg.y; y < seg.y + seg.height; y += bandH) {
                    ctx.fillStyle = toggle ? secondary : "transparent";
                    ctx.fillRect(seg.x, y, seg.width, bandH * 0.75);
                    toggle = !toggle;
                }
            } else if (pattern === "stripes-vertical") {
                const stripeW = seg.width * 0.22;
                let toggle = false;
                for (let x = seg.x; x < seg.x + seg.width; x += stripeW) {
                    ctx.fillStyle = toggle ? secondary : "transparent";
                    ctx.fillRect(x, seg.y, stripeW * 0.75, seg.height);
                    toggle = !toggle;
                }
            }

            ctx.restore();
        });
    }

    function calculateBootGeometry(socks) {
        const segments = {};
        ["left", "right"].forEach(side => {
            const s = socks[side];
            const bootHeight = s.height * 0.3;
            segments[side] = {
                x: s.x - s.width * 0.06,
                y: s.y + s.height - bootHeight,
                width: s.width * 1.12,
                height: bootHeight
            };
        });
        return segments;
    }

    function drawBoots(ctx, boots) {
        ["left", "right"].forEach(side => {
            const seg = boots[side];
            if (!seg) return;

            const { x, y, width, height } = seg;
            const upperH = height * 0.6;
            const soleH = height - upperH;

            ctx.save();

            // upper
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width * 0.95, y + upperH);
            ctx.lineTo(x + width * 0.05, y + upperH);
            ctx.closePath();
            ctx.fillStyle = "#020617";
            ctx.fill();

            // sole
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(x - width * 0.05, y + upperH, width * 1.1, soleH * 0.9);

            // highlight
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x + width * 0.1, y + upperH * 0.2, width * 0.3, upperH * 0.25);

            ctx.restore();
        });
    }

    // ------------------------ random + colour helpers ------------------------

    function randomiseColours() {
        const baseHue = Math.floor(Math.random() * 360);
        const primary = hslToHex(baseHue, 70, 40);
        const secondary = hslToHex((baseHue + 180) % 360, 20, 92);
        const accent = hslToHex((baseHue + 35) % 360, 80, 55);

        state.colours.primary = primary;
        state.colours.secondary = secondary;
        state.colours.accent = accent;
        state.colours.sleeve = primary;
        state.colours.collar = secondary;
        state.colours.sponsor = secondary;
        state.sponsor.colour = secondary;
        state.badge.main = secondary;
        state.badge.secondary = primary;

        state.shorts.primary = primary;
        state.shorts.secondary = secondary;

        state.socks.primary = primary;
        state.socks.secondary = secondary;
    }

    function randomiseFull() {
        const templates = [
            "plain",
            "stripes-vertical",
            "hoops",
            "sash",
            "halves",
            "quarters",
            "modern-panel"
        ];
        const sleeves = ["short", "long", "raglan"];
        const collars = ["round", "v-neck", "polo"];
        const shapes = ["none", "circle", "shield", "diamond"];
        const sockPatterns = ["plain", "hoops", "stripes-vertical"];

        randomiseColours();

        state.template = pickRandom(templates);
        state.sleeveStyle = pickRandom(sleeves);
        state.collarStyle = pickRandom(collars);
        state.badge.shape = pickRandom(shapes);
        state.socks.pattern = pickRandom(sockPatterns);
        state.shorts.pattern = "plain";

        const sponsors = [
            "QuickToolbox",
            "ToolKit FC",
            "Code United",
            "Parkinson Digital",
            "DevTown",
            "Freddie & Co."
        ];
        state.sponsor.text = pickRandom(sponsors);
        state.sponsor.size = randInt(22, 34);

        const initials = ["QTK", "QFC", "PD", "FTB", "FC"];
        state.badge.text = pickRandom(initials);
    }

    const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;

    function lighten(hex, amount) {
        const { h, s, l } = hexToHsl(hex);
        return hslToHex(h, s, Math.min(100, l + amount * 100));
    }

    function darken(hex, amount) {
        const { h, s, l } = hexToHsl(hex);
        return hslToHex(h, s, Math.max(0, l - amount * 100));
    }

    function hexToHsl(H) {
        let r = 0, g = 0, b = 0;
        H = H.replace("#", "");
        if (H.length === 3) {
            r = "0x" + H[0] + H[0];
            g = "0x" + H[1] + H[1];
            b = "0x" + H[2] + H[2];
        } else if (H.length === 6) {
            r = "0x" + H[0] + H[1];
            g = "0x" + H[2] + H[3];
            b = "0x" + H[4] + H[5];
        }
        r /= 255;
        g /= 255;
        b /= 255;

        const cmin = Math.min(r, g, b);
        const cmax = Math.max(r, g, b);
        const delta = cmax - cmin;

        let h = 0, s = 0, l = 0;
        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;

        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        return { h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
    }

    function hslToHex(h, s, l) {
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
                .map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? "0" + hex : hex;
                })
                .join("")
        );
    }

    // ------------------------ download ------------------------

    function downloadPng() {
        const baseCanvas = $("kit-canvas");
        if (!baseCanvas) return;

        const scale = 3;
        const tmp = document.createElement("canvas");
        tmp.width = baseCanvas.width * scale;
        tmp.height = baseCanvas.height * scale;
        const ctx = tmp.getContext("2d");

        renderKit(ctx, tmp.width, tmp.height);

        const link = document.createElement("a");
        link.href = tmp.toDataURL("image/png");
        link.download = "football-kit.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ------------------------ bootstrapping ------------------------

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
