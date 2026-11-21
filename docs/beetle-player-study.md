# Beetle player study

The feedback preview at `/beetle` presents one recording in compact and expanded modes. Play, seek, then expand or minimize during playback. Escape minimizes when focus is inside the player.

The player keeps one audio element and one set of controls mounted. Base UI supplies the buttons and slider. CSS expands the artwork above a transport row whose position stays fixed. The browser reverses the size transition when the user changes direction. The expanded footprint has reserved space, including on narrow and short screens, and the reduced-motion preference switches size immediately.

This is the direct implementation to compare against any later primitive. The earlier Music application demonstrated persistent audio across independent routes and a Drawer portal. The two modes here share a DOM parent, so they can retain focus and input targets directly. The cross-region focus and exit coordination questions remain open for a later study. [Music reference client](https://github.com/francozeta/continuity/blob/e9834819aaef2b025e2bc4df19c2af8de6cf1387/docs/reference-client.md)

## Verification

Lint and the production build passed. Chromium and WebKit probes played and sought the recording, interrupted the expansion with pointer input, verified focus after Escape and retained the same audio and control nodes. Across both engines, 46 frame samples kept the artwork clear of the controls and Play under the same pointer position. Both modes passed axe at the tested size. Layouts at 320 × 568, 390 × 844 and 844 × 390 stayed usable, with instant changes under reduced motion.

## Assets

- Erik Satie’s *Gymnopédie No. 1*, recording uploaded by Teknopazzo under CC0 1.0. Transcoded to local MP3. [Recording](https://commons.wikimedia.org/wiki/File:Gymnopedie_No._1..ogg)
- *Piano keys* by Maciej Korsan, distributed under CC0 1.0. Converted to grayscale WebP. [Photograph](https://commons.wikimedia.org/wiki/File:Keys-piano-sh.jpg)
