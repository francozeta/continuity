# Beetle — Experiment 001: tactile surface

Status: **experimental / preview branch**. Not a released primitive.

## Question

Can a web surface on mobile feel directly manipulable and interruptible while keeping gesture work out of React renders?

## Implementation

- The home page (\`/\`) contains a focused, single-surface touch experiment.
- The earlier music continuity study is preserved at \`/track\`.
- Base UI: shadcn-backed Button and unstyled Tabs for accessible controls.
- UI SDK: behavior-first separation is the architectural reference **only**. No \`@ui-sdk\` dependency has been installed; its experimental APIs are deliberately not claimed as active integrations.
- The gesture loop uses native Pointer Events, pointer capture, \`requestAnimationFrame\`, direct \`translate3d\` updates, velocity-based snapping, spring interruption, and a reduced-motion fallback.
- CSS only styles the experiment. No animated inherited CSS custom property is updated on every pointermove.

## Mobile verification protocol

1. On iOS Safari, drag the surface vertically and stop halfway. The surface should follow the finger without waiting for React.
2. Release slowly between the three snap points, then fling upward and downward. The target should respect position and gesture velocity.
3. Touch the handle during an in-flight spring. It should become directly draggable without restarting or snapping.
4. Resize or rotate the viewport; the surface should remain usable and stay in its chosen snap state.
5. In iOS Accessibility > Motion, enable Reduce Motion. The semantic state should still change without spatial animation.
6. Use Tab to focus the handle, arrows to move one position, Home and End to jump, Escape to compact. Test the Base UI tabs with keyboard.
7. Drag inside the surface content: scrolling should remain native, not hijacked by the handle's gesture.

## Known limitations

- Physics is a deliberately small custom experiment, not a physically measured or cross-browser benchmark.
- The test does not yet solve nested gesture handoff, cross-route identity, or persistent DOM ownership.
- Do not extract an npm API until compared with direct Motion, Base UI Drawer and UI SDK Drag primitives on real devices.
- The Vercel preview may require team authentication due to deployment protection.

## Pass criteria

Measure real frame pacing, long tasks, dropped frames, layout/style work, keyboard behavior, touch latency, and energy usage on at least one iPhone and one mid-tier Android device. Only extract Beetle if a repeated difficult interaction becomes meaningfully easier without sacrificing performance or accessibility.
