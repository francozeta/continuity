# Experiment 002 — persistent navigation shell

Status: experimental branch `feat/persistent-navigation-study`. Not a shipped component, library API, or Kocteau implementation.

## Question

Does a **single persistent React layout** with two independent visual surfaces (Base UI navigation underlay and a fixed bottom dock) preserve animation progress, search query, and UI identity across real Next.js route changes, including interrupted or reversed navigation?

This is not the v0 compact/preview/player experiment: this version exercises a portal, route segment changes, a shared Motion controller, viewport-aware geometry, and a fixed shell.

## Prototype

Visit `/navigation` (plus `/navigation/reviews`, `/navigation/library`, `/navigation/search`).

- The layout owns Drawer state, Motion progress, measured distance and the Search query.
- Actual route pages mount separately inside the layout; the sidebar and dock do not remount when navigating within `/navigation/*`.
- Base UI Drawer owns dismissal, focus trapping and semantics. Motion controls the foreground and the subtle underlay offset.
- The foreground is fixed at `100dvh`, and content scrolls *inside* that viewport-sized shell, so a fixed dock/header needs no body portal and cannot drift when a long page scrolls.
- A narrow gesture grip demonstrates direct manipulation without adding horizontal touch capture to the content or an unrelated WebGL surface.
- The dock reuses the same navigation/Search containers and Search query across routes.

## References

- [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion): realistic, brief, cancellable and reduced-motion aware
- [Apple: fluid transitions](https://developer.apple.com/documentation/uikit/enhancing-your-app-with-fluid-transitions): user can stop, drag, reverse
- [Emil Kowalski: Great Animations](https://www.hackdesign.org/lessons/great-animations/): restrained, fast, natural
- [Jakub Krehel: drag gestures](https://jakub.kr/work/drag-gesture): gesture distance and real-time motion
- [Jakub Krehel: shared layout](https://jakub.kr/work/shared-layout-animations): stable shared components outside presence
- [Gustavo Fior: Interruptibility](https://craft.gustavofior.com/interruptibility): a destination, not a recording
- [Motion: motion values](https://motion.dev/docs/react-motion-value): one value synchronizes independent components
- [Base UI Drawer](https://base-ui.com/react/components/drawer): focus, dismissal, mobile touch semantics

## Required device checks (not yet claimed)

- Open/close rapidly 8–10 times; reverse mid-spring
- Swipe grip in both directions, including a short drag and quick flick; confirm iOS browser back gesture is not stolen
- Touch scrolling/text selection in main and vertical menu scrolling
- Navigate Feed → Search → Reviews → Library → Search without shell remount
- Search query persists, independent pages replace only their own content
- Dynamic height/keyboard/safe areas at 320px, 390px, 430px and rotation
- Focus, Escape, tap to dismiss, VoiceOver, reduced-motion *changes during runtime*
- Test CSS transforms and compositor performance while background 3D/WebGL is active in Kocteau; this study has no WebGL

## Exit criterion

Do **not** extract a `Continuity.Root` or publish an npm package from a single successful demo. Compare the direct Motion+Base UI shell with the existing Kocteau mobile shell and document concrete duplicated coordination that can be deleted through extraction. If the demo does not outperform direct code, keep the pattern as documented research.

This branch intentionally leaves the music experiment and public library surface untouched.

## Phase 2 — directly manipulable, configurable, still persistent

- Header menu button is both an accessible click target and a horizontal pan surface.
  A real drag drives a single MotionValue directly; lifting retargets the same value
  using velocity and distance. The rest of the foreground remains scrollable and
  does **not** intercept gestures, including a hypothetical WebGL canvas.
- Motion profiles Tactile / Quiet / Brisk use different critically/over-damped
  spring characteristics. They exist to gather subjective iPhone feedback, not to
  expose a public animation API. They persist between demo routes.
- The bottom dock and Search input are always mounted. Contextual controls use
  inert/aria-hidden and short opacity fades, while the same capsule containers
  change width using Motion layout. Search query remains mounted across routes.
- Reduced motion is read through useSyncExternalStore + matchMedia change event,
  including when the preference changes after the app was mounted.
- Review the interactive demo on iOS Safari and in-app browsers before copying
  this gesture model into Kocteau. Base UI remains responsible for focus semantics,
  while native swipe dismissal within drawer content is explicitly disabled on
  the horizontal axis to prevent two unsynchronized movement controllers.

### New QA

1. Compare Tactile, Quiet and Brisk on iPhone; record which one feels attached to the finger.
2. Drag the menu trigger right, reverse left before release, and check immediate response.
3. Repeat rapid clicks and drags. No rubber-band return or duplicate animations.
4. Enter Search, type a query, change to Reviews, then return: same input/query.
5. Ensure VoiceOver doesn't navigate to invisible dock controls, and the close
   button remains keyboard-accessible when reduced motion is on.
