import { expect, test, type Locator, type Page } from "@playwright/test";

function atRest(dialog: Locator) {
  return expect(dialog).not.toHaveAttribute("data-moving", "");
}

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error("Expected a visible surface");
  return result;
}

async function nextFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function touch(page: Page) {
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

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("keyboard activation, checkbox state, and focus survive the surface changes", async ({ page }) => {
  const row = page.getByRole("button", { name: "Packing" });
  await row.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Packing" });
  const expand = dialog.getByRole("button", { name: "Expand", exact: true });
  await expect(expand).toBeFocused();
  await atRest(dialog);

  const keys = dialog.getByRole("checkbox", { name: "Keys", exact: true });
  await keys.focus();
  await page.keyboard.press("Space");
  await expect(keys).toBeChecked();
  const original = await keys.elementHandle();

  const title = await box(dialog.getByRole("heading"));
  await page.mouse.move(title.x + 180, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + 62, title.y + title.height / 2, { steps: 5 });
  await page.mouse.up();

  await expect(dialog).toHaveAttribute("data-stage", "expanded");
  await atRest(dialog);
  await expect(keys).toBeFocused();
  expect(await keys.evaluate((current, before) => current === before, original)).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveAttribute("data-stage", "preview");
  await atRest(dialog);
  await expect(keys).toBeFocused();
  await expect(keys).toBeChecked();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  await page.keyboard.press("Space");
  await expect(keys).toBeChecked();
});

test("re-grabbing a settling preview holds its painted position and lets it return to the row", async ({ page }) => {
  const row = page.getByRole("button", { name: "Packing" });
  const rowBox = await box(row);
  await row.tap();

  const dialog = page.getByRole("dialog", { name: "Packing" });
  await expect(dialog).toHaveAttribute("data-moving", "");
  const x = rowBox.x + 110;
  const y = rowBox.y + rowBox.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const style = await dialog.getAttribute("style");
  await nextFrames(page);
  expect(await dialog.getAttribute("style")).toBe(style);
  await page.mouse.move(x + 130, y, { steps: 6 });
  await page.mouse.up();

  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
});

test("interrupting expansion keeps the preview's scroll position", async ({ page }) => {
  await page.getByRole("button", { name: "Packing" }).tap();
  const dialog = page.getByRole("dialog", { name: "Packing" });
  await atRest(dialog);
  const scroll = dialog.getByRole("list", { name: "Tasks" }).locator("..");
  await scroll.evaluate((el) => { el.scrollTop = 80; });
  const title = await box(dialog.getByRole("heading"));
  await dialog.getByRole("button", { name: "Expand" }).tap();
  await expect(dialog).toHaveAttribute("data-moving", "");

  const x = title.x + 115;
  const y = title.y + title.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 56, y, { steps: 5 });
  // Hold still long enough for the release velocity to expire.
  await page.waitForTimeout(80);
  await page.mouse.up();

  await expect(dialog).toHaveAttribute("data-stage", "preview");
  await atRest(dialog);
  expect(await scroll.evaluate((el) => el.scrollTop)).toBe(80);
});

test("reduces motion and fits a resized viewport while retaining the same dialog", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const row = page.getByRole("button", { name: "Camping" });
  await row.tap();
  const dialog = page.getByRole("dialog", { name: "Camping" });
  await expect(dialog).toBeVisible();
  await atRest(dialog);
  await dialog.getByRole("button", { name: "Expand" }).tap();
  await expect(dialog).toHaveAttribute("data-stage", "expanded");
  await atRest(dialog);
  const original = await dialog.elementHandle();
  await page.setViewportSize({ width: 844, height: 360 });
  await expect.poll(async () => {
    const bounds = await box(dialog);
    return bounds.y >= 0 && bounds.y + bounds.height <= 360;
  }).toBe(true);
  expect(await dialog.evaluate((current, before) => current === before, original)).toBe(true);
  await dialog.getByRole("button", { name: "Close" }).tap();
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  await expect(row).toBeInViewport();
});

test("keeps the previous experiment available at /track", async ({ page }) => {
  await page.goto("/track");
  await expect(page.getByRole("heading", { name: "Continuity music experiment" })).toBeAttached();
});

test.describe("native Chromium touch input", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "Uses Chromium's trusted multi-touch input protocol");
  });

  test("vertical swipes on a row and in a preview scroll only the surface under the finger", async ({ page }) => {
    const list = page.getByRole("main", { name: "Checklists", includeHidden: true });
    const row = page.getByRole("button", { name: "Pantry" });
    const rowBox = await box(row);
    const finger = await touch(page);
    const x = rowBox.x + 130;
    const y = rowBox.y + rowBox.height / 2;
    await finger.start(x, y);
    for (let distance = 20; distance <= 180; distance += 20) {
      await finger.move(x, y - distance);
    }
    await finger.end();
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(60);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Packing" }).tap();
    const dialog = page.getByRole("dialog", { name: "Packing" });
    await atRest(dialog);
    const listTop = await list.evaluate((el) => el.scrollTop);
    const scroll = dialog.getByRole("list", { name: "Tasks" }).locator("..");
    const scrollBox = await box(scroll);
    const startX = scrollBox.x + 80;
    const startY = scrollBox.y + scrollBox.height - 20;
    await finger.start(startX, startY);
    for (let distance = 16; distance <= 112; distance += 16) {
      await finger.move(startX, startY - distance);
    }
    await finger.end();
    await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(50);
    await expect(dialog).toHaveAttribute("data-stage", "preview");
    expect(await list.evaluate((el) => el.scrollTop)).toBe(listTop);
  });

  test("a single touch crosses both surfaces and reverses immediately at the travel limit", async ({ page }) => {
    const row = page.getByRole("button", { name: "Packing", includeHidden: true });
    const rowBox = await box(row);
    const finger = await touch(page);
    const x = rowBox.x + rowBox.width - 20;
    const y = rowBox.y + rowBox.height / 2;
    await finger.start(x, y);
    for (let distance = 20; distance <= 280; distance += 20) {
      await finger.move(x - distance, y);
    }
    const dialog = page.getByRole("dialog", { name: "Packing" });
    await expect(dialog).toBeVisible();
    await expect(row).toHaveAttribute("data-lifted", "");
    await nextFrames(page);
    expect(await dialog.evaluate((el) => el.style.clipPath)).toBe("");

    await finger.move(x - 262, y);
    await nextFrames(page);
    expect(await dialog.evaluate((el) => el.style.clipPath)).toContain("inset");
    await finger.end();
    await expect(dialog).toHaveAttribute("data-stage", "expanded");
    await atRest(dialog);
  });

  for (const interruption of ["cancellation", "second finger", "capture loss"] as const) {
    test(`rolls back a claimed touch after ${interruption}`, async ({ page }) => {
      const row = page.getByRole("button", { name: "Packing", includeHidden: true });
      const rowBox = await box(row);
      const finger = await touch(page);
      const x = rowBox.x + 200;
      const y = rowBox.y + rowBox.height / 2;

      // Record the browser's pointer ID for the capture-loss case.
      const rowId = await row.getAttribute("id");
      await page.evaluate((id) => {
        document.getElementById(id!)?.addEventListener("pointerdown", (event) => {
          (event.currentTarget as HTMLElement).dataset.testPointerId = String(event.pointerId);
        }, { once: true });
      }, rowId);
      await finger.start(x, y);
      await finger.move(x - 80, y);
      const dialog = page.getByRole("dialog", { name: "Packing" });
      await expect(dialog).toHaveAttribute("data-moving", "");
      if (interruption === "second finger") await finger.addFinger();
      if (interruption === "capture loss") {
        await row.evaluate((el) => el.releasePointerCapture(Number(el.dataset.testPointerId)));
        await finger.move(x - 110, y);
      }
      await finger.end(interruption === "cancellation" ? "touchCancel" : "touchEnd");

      await expect(dialog).toHaveCount(0);
      await expect(row).toBeFocused();
      await row.tap();
      await expect(dialog).toHaveAttribute("data-stage", "preview");
      await atRest(dialog);
    });
  }
});
