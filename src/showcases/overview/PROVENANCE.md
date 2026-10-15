# Portfolio overview viewer

The homepage offers the optional **Watch the tour** link beside its existing **Take a look around** action. The tour is 78.2 seconds, silent and captioned in English. It is an editorial overview of David Blumenau's built work, using approved authentic media and genuine local portfolio interactions.

## Public media

Only four assets belong to this showcase, under `public/media/overview/`:

- `selected-work-overview.mp4`: H.264, 1920 × 1080, 30 fps, no audio; SHA-256 `323da5988a2c6c680d1b979a2b1df59262f123ef23549746ec183b0cbde5cd87`.
- `selected-work-poster.jpg`: genuine overview-film comparison frame, with the film's authored title and scope label.
- `selected-work-overview.vtt`: 17 descriptive native caption cues, at most three words per second, all within the film duration.
- `selected-work-text-alternative.txt`: readable scene-by-scene description with source, method, actor and version limits.

`media-provenance.fragment.json` contains the four exact asset hashes, sizes and applicable dimensions/duration for root-owned integration into the central media manifest. Working files, private edit decisions, raw captures and preview HTML are outside the public site.

## Source boundaries

The teapot comparison reviews completed generated images and their retained-original relationship. It does not record inference. Attention uses actual Mac source-film intervals 5–19s and 35.5–38.5s at original speed. Automated Intel Computer Helper selected the native Session cards answer; the originating task was Codex. That actual live exchange used build121. The separate later build128 persisted-card observation is outside this overview.

Recovery is a recorded controlled local experiment with one continuing engine process, not a process restart. Studio is a working local browser tool adapted from Kitforge; its actual downloaded PNG has the same pixels as the paused preview. World is an interactive portfolio illustration of the fixed recorded choice. Its illustrated first-entry sequence ends on the actual generated artifact; it starts no new task or native interaction. The film's compact captions and full text alternative retain these distinctions.

The approved source footage remains untouched. Moving excerpts retain real-time speed. Hard cuts, contained scaling and locally licensed DM Sans/Fraunces typographic framing are the editorial treatment. No fabricated UI, replacement terminal text, new inference, music or narration was used.

## Viewer behavior

The native anchor points directly to the MP4. JavaScript enhances ordinary activation into a native modal dialog; modified clicks retain normal link behavior. Without JavaScript, the direct film and a visible text-alternative link remain available.

The video declares static `data-src` and `data-poster` paths, and its English track declares `data-src`. No video, poster or caption request occurs before activation. Opening assigns those URLs and loads metadata without autoplay. The native controls provide playback, seeking and caption selection. A sticky Close button stays reachable while the dialog scrolls. Native Escape and modal focus handling remain browser-provided. Closing pauses playback and restores focus to the trigger. Actual page navigation pauses and closes the dialog and restores the body's prior overflow style.

The layout and controller are scoped to this component. The homepage change consists of its import and the action wrapper around the existing primary link. No additional route, dependencies, global stylesheet or network service is introduced.

## Focused verification

`tests/browser/overview.spec.ts` verifies deferred media traffic, paused opening, native keyboard playback and seeking, all 17 caption cues, Close/Escape focus restoration, the native modal's inert background, actual pagehide cleanup during navigation, no-JavaScript MP4/text navigation, UTF-8 text readability and exact approved hashes for all four assets. Browser requests remain static same-origin GETs.

At 390 × 844, both existing Studio and Recovery entrances remain visible in the first screen. The dialog, video and sticky Close fit at 390, 834 and 1440px widths, with no horizontal overflow and no scoped WCAG A/AA axe violations. Native focus can enter browser chrome at the end of the tab sequence; the background page remains unfocusable. Browser tests use Chromium, not physical-device or Safari verification.
