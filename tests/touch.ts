import type { Page } from "@playwright/test";

export async function touch(page: Page) {
  const session = await page.context().newCDPSession(page);
  let point = { x: 0, y: 0, id: 1 };
  return {
    async start(x: number, y: number) {
      point = { x, y, id: 1 };
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    },
    async move(x: number, y: number) {
      point = { ...point, x, y };
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
    },
    async addFinger() {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point, { x: point.x + 20, y: point.y + 24, id: 2 }],
      });
    },
    async end(type: "touchEnd" | "touchCancel" = "touchEnd") {
      await session.send("Input.dispatchTouchEvent", { type, touchPoints: [] });
    },
  };
}
