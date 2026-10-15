import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Compositor-only audio waveform with click-to-seek, drag-to-select loop region,
 * and a loop on/off toggle.
 *
 * Architecture (per the design memo / removal-commit hint):
 *   - The waveform shape is built ONCE from peaks data as an SVG <path>,
 *     encoded into a data: URL, and applied as a CSS `mask-image` on a
 *     wrapper div. The mask is never recomputed during playback.
 *   - Two solid-colored child divs sit under the mask: a static grey
 *     `wave-bg` and an accent `wave-fg`.
 *   - Per-frame, only `wave-fg.style.transform = scaleX(progress)` changes.
 *     `transform` with `will-change: transform` is a guaranteed
 *     compositor-only operation → no paint, no layout, no flicker.
 *   - The loop region overlay (`wave-loop`) only updates on user interaction
 *     (drag-select), not per-frame, so its `left`/`width` mutations don't
 *     contribute to playback flicker.
 *   - `contain: layout paint style` on the root bounds any worst-case paint
 *     to this element so it can never bleed into the RSVP area.
 */
import { useEffect, useMemo, useRef, useState } from "react";
function buildMaskDataUrl(peaks) {
    if (!peaks || peaks.length < 4)
        return "";
    const W = 1000, H = 60;
    const PAIRS = peaks.length / 2;
    const BARS = Math.min(400, PAIRS);
    const stride = PAIRS / BARS;
    const barW = (W / BARS) * 0.7;
    let d = "";
    for (let i = 0; i < BARS; i++) {
        const idx = Math.floor(i * stride) * 2;
        const min = peaks[idx] / 128;
        const max = peaks[idx + 1] / 128;
        const x = (i / BARS) * W;
        const top = (1 - max) * H / 2;
        const bot = (1 - min) * H / 2;
        const h = Math.max(1, bot - top);
        d += `M${x.toFixed(1)} ${top.toFixed(1)}h${barW.toFixed(2)}v${h.toFixed(1)}h${(-barW).toFixed(2)}z`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="white"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
}
const DRAG_THRESHOLD = 0.005; // ~0.5% of width — distinguishes click from drag
const TOUCH_ARM_MS = 400; // long-press hold needed on touch before drag-select arms
export function Waveform({ peaks, audio, height = 96 }) {
    const rootRef = useRef(null);
    const fgRef = useRef(null);
    const loopRef = useRef(null);
    const scrollRef = useRef(null);
    const [region, setRegion] = useState(null);
    const [loopOn, setLoopOn] = useState(true);
    const [zoom, setZoom] = useState(1);
    // `armed` only flips for touch (long-press); drives the visual cue. Mouse/pen
    // arms instantly so we don't bother reflecting that in render state.
    const [armed, setArmed] = useState(false);
    // Drag state lives in a ref to avoid re-renders during pointermove.
    const dragRef = useRef(null);
    const maskUrl = useMemo(() => buildMaskDataUrl(peaks), [peaks]);
    // Reset transient state whenever the chapter changes.
    useEffect(() => { setRegion(null); setZoom(1); }, [peaks]);
    // Per-frame progress fill + auto-scroll to keep the playhead in view when
    // zoomed past 1×. Direct DOM mutation, no React state churn.
    // scrollLeft updates are compositor-only on modern browsers (no paint of the
    // wave content), so they don't reintroduce flicker.
    useEffect(() => {
        if (!audio || !fgRef.current)
            return;
        let raf = 0;
        const tick = () => {
            const dur = audio.duration;
            if (dur && isFinite(dur)) {
                const p = Math.max(0, Math.min(1, audio.currentTime / dur));
                fgRef.current.style.transform = `scaleX(${p})`;
                const scroll = scrollRef.current;
                if (scroll && !audio.paused) {
                    const innerW = scroll.scrollWidth;
                    const viewW = scroll.clientWidth;
                    if (innerW > viewW + 1) {
                        const playX = p * innerW;
                        const inView = playX - scroll.scrollLeft;
                        // If the playhead has drifted into the right 15% or has wrapped
                        // back behind the visible window (loop bounce / manual seek),
                        // re-anchor it at 25% from the left.
                        if (inView > viewW * 0.85 || inView < 0) {
                            scroll.scrollLeft = Math.max(0, playX - viewW * 0.25);
                        }
                    }
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [audio]);
    // Read region via a ref inside the zoom-change effect so the effect doesn't
    // re-run (and re-center) on every region change — only on actual zoom moves.
    const regionRef = useRef(null);
    useEffect(() => { regionRef.current = region; }, [region]);
    // When zoom changes, re-center the scroll. Focus the selected region if
    // there is one (the user's marked area is what they want to inspect);
    // otherwise center on the playhead so the user keeps their orientation.
    useEffect(() => {
        if (!audio || !audio.duration || !isFinite(audio.duration))
            return;
        const id = requestAnimationFrame(() => {
            const scroll = scrollRef.current;
            if (!scroll)
                return;
            const dur = audio.duration;
            const reg = regionRef.current;
            const focusTime = reg ? (reg.start + reg.end) / 2 : audio.currentTime;
            const p = focusTime / dur;
            const innerW = scroll.scrollWidth;
            const viewW = scroll.clientWidth;
            scroll.scrollLeft = innerW > viewW
                ? Math.max(0, Math.min(innerW - viewW, p * innerW - viewW * 0.5))
                : 0;
        });
        return () => cancelAnimationFrame(id);
    }, [zoom, audio]);
    // Sync the loop-overlay's position to committed region state.
    useEffect(() => {
        const el = loopRef.current;
        if (!el)
            return;
        if (!region || !audio?.duration || !isFinite(audio.duration)) {
            el.style.display = "none";
            return;
        }
        el.style.display = "";
        const startPct = (region.start / audio.duration) * 100;
        const widthPct = ((region.end - region.start) / audio.duration) * 100;
        el.style.left = `${startPct}%`;
        el.style.width = `${widthPct}%`;
    }, [region, audio]);
    // Region confinement + loop enforcement.
    // While a region is active, playback is confined to [region.start, region.end].
    //   - on play : snap currentTime into the region if outside
    //   - on time : if past the end, loop back (loopOn) or pause at end (loopOff)
    //               if before the start (e.g. user used Shift+← to skip backward),
    //               snap forward to region.start
    useEffect(() => {
        if (!audio || !region)
            return;
        const inBounds = () => audio.currentTime >= region.start && audio.currentTime < region.end;
        const onTime = () => {
            if (audio.currentTime >= region.end) {
                if (loopOn) {
                    audio.currentTime = region.start;
                }
                else {
                    audio.pause();
                    audio.currentTime = region.end;
                }
            }
            else if (audio.currentTime < region.start) {
                audio.currentTime = region.start;
            }
        };
        const onPlay = () => {
            if (!inBounds())
                audio.currentTime = region.start;
        };
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("play", onPlay);
        return () => {
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("play", onPlay);
        };
    }, [audio, region, loopOn]);
    const updateLoopVisual = (startPct, endPct) => {
        const el = loopRef.current;
        if (!el)
            return;
        el.style.display = "";
        el.style.left = `${startPct * 100}%`;
        el.style.width = `${(endPct - startPct) * 100}%`;
    };
    const pctFromEvent = (e) => {
        const r = rootRef.current.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    };
    const onPointerDown = (e) => {
        if (!audio || !rootRef.current)
            return;
        const startPct = pctFromEvent(e);
        const isTouch = e.pointerType === "touch";
        if (isTouch) {
            // On touch, drag-select would conflict with native horizontal pan,
            // so we require a 400 ms hold to disambiguate from a tap-to-seek
            // (matching the iOS/Android long-press idiom for text selection).
            const pointerId = e.pointerId;
            dragRef.current = {
                startPct, moved: false, armed: false, pointerId, isTouch: true,
                timer: window.setTimeout(() => {
                    if (!dragRef.current || dragRef.current.pointerId !== pointerId)
                        return;
                    dragRef.current.armed = true;
                    dragRef.current.timer = null;
                    try {
                        rootRef.current?.setPointerCapture(pointerId);
                    }
                    catch { }
                    setArmed(true);
                    if ("vibrate" in navigator)
                        navigator.vibrate(10);
                }, TOUCH_ARM_MS),
            };
        }
        else {
            // Mouse / pen — instant arm, current desktop behavior unchanged.
            dragRef.current = {
                startPct, moved: false, armed: true, pointerId: e.pointerId,
                isTouch: false, timer: null,
            };
            try {
                rootRef.current.setPointerCapture(e.pointerId);
            }
            catch { }
        }
    };
    const onPointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag || !audio || e.pointerId !== drag.pointerId)
            return;
        const nowPct = pctFromEvent(e);
        const delta = Math.abs(nowPct - drag.startPct);
        // Touch waiting for arm — any meaningful movement aborts the long-press
        // (the user clearly didn't intend to select; treat as no-op since
        // touch-action: pan-y blocks horizontal native scroll).
        if (!drag.armed) {
            if (delta > DRAG_THRESHOLD) {
                if (drag.timer != null)
                    clearTimeout(drag.timer);
                dragRef.current = null;
            }
            return;
        }
        if (delta > DRAG_THRESHOLD || drag.moved) {
            drag.moved = true;
            const startPct = Math.min(drag.startPct, nowPct);
            const endPct = Math.max(drag.startPct, nowPct);
            updateLoopVisual(startPct, endPct);
        }
    };
    const onPointerUp = (e) => {
        const drag = dragRef.current;
        if (!drag || !audio || e.pointerId !== drag.pointerId)
            return;
        if (drag.timer != null)
            clearTimeout(drag.timer);
        if (drag.armed) {
            try {
                rootRef.current?.releasePointerCapture(e.pointerId);
            }
            catch { }
            if (drag.isTouch)
                setArmed(false);
        }
        const dur = audio.duration;
        if (drag.armed && drag.moved && dur && isFinite(dur)) {
            const nowPct = pctFromEvent(e);
            const start = Math.min(drag.startPct, nowPct) * dur;
            const end = Math.max(drag.startPct, nowPct) * dur;
            setRegion({ start, end });
        }
        else if (dur && isFinite(dur) && !drag.moved) {
            // Plain tap (no drag) — seek. This fires for both touch tap and
            // touch-hold-without-drag (user armed but changed their mind).
            let t = drag.startPct * dur;
            // While a region is active, taps outside it snap to region.start —
            // consistent with the "playback confined to region" behavior.
            if (region && (t < region.start || t >= region.end))
                t = region.start;
            audio.currentTime = t;
        }
        dragRef.current = null;
    };
    return (_jsxs("div", { className: "waveform-container", children: [_jsx("div", { className: "wave-scroll", ref: scrollRef, children: _jsxs("div", { ref: rootRef, className: `waveform${armed ? " armed" : ""}`, style: { height, width: `${zoom * 100}%` }, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerUp, children: [_jsxs("div", { className: "wave-mask", style: { ["--wave-mask"]: `url("${maskUrl}")` }, children: [_jsx("div", { className: "wave-bg" }), _jsx("div", { className: "wave-fg", ref: fgRef })] }), _jsx("div", { className: "wave-loop", ref: loopRef, style: { display: "none" } })] }) }), _jsxs("div", { className: "wave-controls", children: [region && (_jsxs(_Fragment, { children: [_jsxs("span", { className: "secondary", children: ["Loop ", fmt(region.start), "\u2013", fmt(region.end), " (", fmt(region.end - region.start), ")"] }), _jsx("button", { className: loopOn ? "primary" : "", onClick: () => setLoopOn((v) => !v), title: loopOn ? "Disable looping" : "Enable looping", children: loopOn ? "Loop on" : "Loop off" }), _jsx("button", { onClick: () => setRegion(null), title: "Clear region", children: "Clear" })] })), _jsxs("div", { className: "wave-zoom", children: [_jsx("span", { className: "secondary", children: "Zoom" }), _jsx("input", { type: "range", min: "1", max: "20", step: "0.5", value: zoom, onChange: (e) => setZoom(parseFloat(e.target.value)), "aria-label": "Waveform zoom" }), _jsxs("span", { className: "secondary", style: { minWidth: "2.5rem" }, children: [zoom.toFixed(1), "\u00D7"] })] })] })] }));
}
