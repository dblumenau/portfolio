import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * The five display modes (RSVP, Block, Guide, Karaoke, Subtitle), plus the
 * <TimedView> wrapper that subscribes to wavesurfer's timeupdate directly so
 * that the parent <Listen> page does NOT re-render on every audio frame.
 *
 * Word changes happen at speech rate (~3-5Hz), not 60Hz. The wrapper only
 * setStates when the active word index actually changes — keeping the
 * surrounding controls/settings/waveform stable.
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { renderOrp } from "../lib/orp";
export function findActiveIndex(words, t) {
    let lo = 0, hi = words.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const w = words[mid];
        if ((w.start ?? Infinity) > t)
            hi = mid - 1;
        else if ((w.end ?? -Infinity) <= t)
            lo = mid + 1;
        else
            return mid;
    }
    return Math.max(0, Math.min(words.length - 1, lo - 1));
}
/** Subscribes to the audio element's timeupdate and only re-renders when the
 *  active word index changes. HTMLAudioElement's timeupdate fires ~4Hz which
 *  is plenty for word-level sync (~5Hz speech rate). */
export function TimedView({ audio, words, mode }) {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        if (!audio)
            return;
        const onTime = () => {
            const ni = findActiveIndex(words, audio.currentTime);
            setIdx((prev) => (prev === ni ? prev : ni));
        };
        audio.addEventListener("timeupdate", onTime);
        onTime(); // initial sync
        return () => audio.removeEventListener("timeupdate", onTime);
    }, [audio, words]);
    switch (mode) {
        case "rsvp": return _jsx(RsvpView, { words: words, idx: idx });
        case "block": return _jsx(BlockView, { words: words, idx: idx });
        case "guide": return _jsx(GuideView, { words: words, idx: idx });
        case "karaoke": return _jsx(KaraokeView, { words: words, idx: idx });
        case "subtitle": return _jsx(SubtitleView, { words: words, idx: idx });
    }
}
// ---------- RSVP ----------
export const RsvpView = memo(function RsvpView({ words, idx }) {
    const w = words[idx]?.word ?? "";
    const { before, orp, after } = renderOrp(w);
    return (_jsxs("div", { className: "rsvp", children: [_jsx("span", { children: before }), _jsx("span", { className: "orp-letter", children: orp }), _jsx("span", { children: after })] }));
});
// ---------- Block (full chapter text) ----------
// Full chapter view with auto-scroll-to-current. Auto-scroll *suspends*
// when the user manually scrolls — they can read backwards or skim ahead
// without the page yanking back. Auto-scroll resumes after 5s of no
// manual scroll, OR if the user scrolls back near the active word.
export const BlockView = memo(function BlockView({ words, idx }) {
    const containerRef = useRef(null);
    const currentRef = useRef(null);
    const userScrolledAt = useRef(0);
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        let isProgrammatic = false;
        const onScroll = () => {
            if (isProgrammatic) {
                isProgrammatic = false;
                return;
            }
            userScrolledAt.current = performance.now();
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        // Auto-scroll attempt (will be suppressed if user scrolled recently)
        const sinceScroll = performance.now() - userScrolledAt.current;
        if (sinceScroll > 5000 || userScrolledAt.current === 0) {
            isProgrammatic = true;
            currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return () => el.removeEventListener("scroll", onScroll);
    }, [idx]);
    return (_jsx("div", { ref: containerRef, className: "block-text scrollable", children: words.map((w, i) => (_jsxs("span", { ref: i === idx ? currentRef : null, children: [w.word, " ", i > 0 && words[i].para !== words[i - 1].para ? _jsxs(_Fragment, { children: [_jsx("br", {}), _jsx("br", {})] }) : null] }, i))) }));
});
function buildCues(words) {
    const out = [];
    let bufStart = 0;
    for (let i = 0; i < words.length; i++) {
        const lastChar = words[i].word.slice(-1);
        const len = i - bufStart + 1;
        if (len >= 8 && (".?!".includes(lastChar) || len >= 14)) {
            out.push({ firstIdx: bufStart, lastIdx: i, words: words.slice(bufStart, i + 1) });
            bufStart = i + 1;
        }
    }
    if (bufStart < words.length) {
        out.push({ firstIdx: bufStart, lastIdx: words.length - 1, words: words.slice(bufStart) });
    }
    return out;
}
function findCue(cues, idx) {
    for (const c of cues)
        if (c.firstIdx <= idx && idx <= c.lastIdx)
            return c;
    return cues[0];
}
export const SubtitleView = memo(function SubtitleView({ words, idx }) {
    const cues = useMemo(() => buildCues(words), [words]);
    const cue = findCue(cues, idx);
    return _jsx("div", { className: "subtitle", children: cue?.words.map((w) => w.word).join(" ") ?? "" });
});
export const GuideView = memo(function GuideView({ words, idx }) {
    const cues = useMemo(() => buildCues(words), [words]);
    const cue = findCue(cues, idx);
    if (!cue)
        return null;
    return (_jsx("div", { className: "subtitle guide", children: cue.words.map((w, i) => {
            const absIdx = cue.firstIdx + i;
            const isCurrent = absIdx === idx;
            return (_jsxs("span", { className: isCurrent ? "word current" : "word", children: [w.word, i < cue.words.length - 1 ? " " : ""] }, i));
        }) }));
});
export const KaraokeView = memo(function KaraokeView({ words, idx }) {
    const cues = useMemo(() => buildCues(words), [words]);
    const cue = findCue(cues, idx);
    if (!cue)
        return null;
    return (_jsx("div", { className: "subtitle karaoke", children: cue.words.map((w, i) => {
            const absIdx = cue.firstIdx + i;
            const isCurrent = absIdx === idx;
            const isFuture = absIdx > idx;
            const cls = isCurrent ? "word current" : isFuture ? "word future" : "word";
            return (_jsxs("span", { className: cls, children: [w.word, i < cue.words.length - 1 ? " " : ""] }, i));
        }) }));
});
