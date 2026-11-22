import { expect, test, type Locator, type Page } from "@playwright/test";
import { touch } from "./touch";

function viewer(page: Page) {
  return page.getByRole("dialog", { name: "Photo viewer" });
}

async function showsPhoto(dialog: Locator, name: string) {
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("status")).toContainText(name);
  await expect(dialog).not.toHaveAttribute("data-motion", /./);
}

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error("Expected a visible photo");
  return result;
}

async function photoTapPoints(dialog: Locator) {
  return dialog.locator("[data-photo-viewport]").evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const image = element.querySelector<HTMLImageElement>('li[aria-hidden="false"] img')!;
    const ratio = Number(image.getAttribute("width")) / Number(image.getAttribute("height"));
    const fittedWidth = Math.min(bounds.width, bounds.height * ratio);
    const fittedHeight = fittedWidth / ratio;
    const leftGap = (bounds.width - fittedWidth) / 2;
    const topGap = (bounds.height - fittedHeight) / 2;
    return {
      inside: { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
      outside: leftGap > topGap
        ? { x: bounds.left + leftGap / 2, y: bounds.top + bounds.height / 2 }
        : { x: bounds.left + bounds.width / 2, y: bounds.top + topGap / 2 },
      gap: Math.max(leftGap, topGap),
    };
  });
}

async function nextFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/photos");
});

test("pages with the keyboard and returns focus to the last viewed thumbnail", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const first = page.getByRole("button", { name: "The Bahamas", exact: true });
  await first.focus();
  await page.keyboard.press("Enter");
  const dialog = viewer(page);
  await showsPhoto(dialog, "The Bahamas");
  const close = dialog.getByRole("button", { name: "Close viewer" });
  await expect(close).toBeFocused();
  const original = await dialog.elementHandle();

  await page.keyboard.press("ArrowRight");
  await showsPhoto(dialog, "Aurora over Earth");
  await expect(close).toBeFocused();
  expect(await dialog.evaluate((current, before) => current === before, original)).toBe(true);
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /green aurora/);

  // The last photo starts below the mobile grid's viewport.
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
  await showsPhoto(dialog, "Clouds over New Zealand");
  await expect(dialog.getByRole("button", { name: "Next photo" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  const last = page.getByRole("button", { name: "Clouds over New Zealand" });
  await expect(last).toBeInViewport();
  await expect(last).toBeFocused();
});

test("catches the opening photo at its last painted position and reverses to the grid", async ({ page }) => {
  const tile = page.getByRole("button", { name: "The Bahamas", exact: true });
  await tile.tap();
  const dialog = viewer(page);
  await expect(dialog).toHaveAttribute("data-motion", "surface");
  await page.mouse.move(115, 240);
  await page.mouse.down();
  const photo = dialog.getByRole("img");
  const held = await photo.getAttribute("style");
  await nextFrames(page);
  expect(await photo.getAttribute("style")).toBe(held);
  await page.mouse.move(259, 240, { steps: 7 });
  await page.mouse.up();
  await expect(dialog).toHaveCount(0);
  await expect(tile).toBeFocused();
});

test("catches page settling on the same rail and can reverse to the preceding photo", async ({ page }) => {
  await page.getByRole("button", { name: "The Bahamas", exact: true }).tap();
  const dialog = viewer(page);
  await showsPhoto(dialog, "The Bahamas");
  await dialog.getByRole("button", { name: "Next photo" }).tap();
  await expect(dialog).toHaveAttribute("data-motion", "paging");
  await page.mouse.move(54, 250);
  await page.mouse.down();
  const rail = dialog.getByRole("list", { name: "Viewer photos" });
  const held = await rail.getAttribute("style");
  await nextFrames(page);
  expect(await rail.getAttribute("style")).toBe(held);
  await page.mouse.move(351, 250, { steps: 9 });
  await page.mouse.up();
  await showsPhoto(dialog, "The Bahamas");
});

test("keeps the selected photo through a viewport resize", async ({ page }) => {
  const tile = page.getByRole("button", { name: "Mount Fuji" });
  await tile.tap();
  const dialog = viewer(page);
  await showsPhoto(dialog, "Mount Fuji");
  await page.setViewportSize({ width: 844, height: 375 });
  const photo = dialog.getByRole("img");
  await expect(photo).toBeInViewport();
  const imageBounds = await box(photo);
  expect(imageBounds.y + imageBounds.height).toBeLessThanOrEqual(375);
  await dialog.getByRole("button", { name: "Close viewer" }).tap();
  await expect(dialog).toHaveCount(0);
  await expect(tile).toBeFocused();
  await expect(tile).toBeInViewport();
});

test("only the active viewer owns the selected photo, including after paging", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const earth = page.getByRole("button", { name: "Earth from DSCOVR", includeHidden: true });
  const namib = page.getByRole("button", { name: "Namib Desert", includeHidden: true });
  await earth.tap();
  const dialog = viewer(page);
  await showsPhoto(dialog, "Earth from DSCOVR");

  // Regression for an iPhone compositor ghost: the source tile must remain
  // unpainted after opening settles, not only while it is animating.
  await expect(earth).toHaveAttribute("data-lifted", "");
  await expect(earth.locator("img")).toHaveCSS("visibility", "hidden");

  await dialog.getByRole("button", { name: "Next photo" }).tap();
  await showsPhoto(dialog, "Namib Desert");
  await expect(earth).not.toHaveAttribute("data-lifted", "");
  await expect(earth.locator("img")).toHaveCSS("visibility", "visible");
  await expect(namib).toHaveAttribute("data-lifted", "");
  await expect(namib.locator("img")).toHaveCSS("visibility", "hidden");

  await dialog.getByRole("button", { name: "Close viewer" }).tap();
  await expect(dialog).toHaveCount(0);
  await expect(namib).not.toHaveAttribute("data-lifted", "");
  await expect(namib.locator("img")).toHaveCSS("visibility", "visible");
  await expect(namib).toBeFocused();
});

test("reopening the same source never leaves a duplicate thumbnail painted", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const earth = page.getByRole("button", { name: "Earth from DSCOVR", includeHidden: true });
  for (let repeat = 0; repeat < 2; repeat++) {
    await earth.tap();
    const dialog = viewer(page);
    await showsPhoto(dialog, "Earth from DSCOVR");
    await expect(earth.locator("img")).toHaveCSS("visibility", "hidden");
    await dialog.getByRole("button", { name: "Close viewer" }).tap();
    await expect(dialog).toHaveCount(0);
    await expect(earth.locator("img")).toHaveCSS("visibility", "visible");
  }
});

test("stops painting the viewer photo before revealing its thumbnail", async ({ page }) => {
  const earth = page.getByRole("button", { name: "Earth from DSCOVR", includeHidden: true });
  await earth.tap();
  const dialog = viewer(page);
  await showsPhoto(dialog, "Earth from DSCOVR");

  // Sample the handoff synchronously. The dialog can unmount in the same frame.
  await earth.evaluate((tile) => {
    const rail = document.querySelector<HTMLUListElement>('[aria-label="Viewer photos"]')!;
    const removeAttribute = tile.removeAttribute;
    tile.removeAttribute = function (name) {
      if (name === "data-lifted" && this.hasAttribute(name)) {
        this.dataset.viewerRailHiddenAtHandoff = String(rail.getClientRects().length === 0);
      }
      return removeAttribute.call(this, name);
    };
  });

  await dialog.getByRole("button", { name: "Close viewer" }).tap();
  await expect(dialog).toHaveCount(0);
  await expect(earth).toHaveAttribute("data-viewer-rail-hidden-at-handoff", "true");
  await expect(earth).toBeFocused();
});

test("a tap on the photo stays open; a tap in its empty letterbox closes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const earth = page.getByRole("button", { name: "Earth from DSCOVR", includeHidden: true });
  await earth.tap();
  const dialog = viewer(page);
  await showsPhoto(dialog, "Earth from DSCOVR");
  const { inside, outside, gap } = await photoTapPoints(dialog);
  expect(gap).toBeGreaterThan(12);

  await page.touchscreen.tap(inside.x, inside.y);
  await showsPhoto(dialog, "Earth from DSCOVR");

  await page.touchscreen.tap(outside.x, outside.y);
  await expect(dialog).toHaveCount(0);
  await expect(earth).toBeFocused();
});

test("empty-space dismissal restores focus to the most recently paged photo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Earth from DSCOVR", includeHidden: true }).tap();
  const dialog = viewer(page);
  await showsPhoto(dialog, "Earth from DSCOVR");
  await dialog.getByRole("button", { name: "Next photo" }).tap();
  await showsPhoto(dialog, "Namib Desert");

  const { outside, gap } = await photoTapPoints(dialog);
  expect(gap).toBeGreaterThan(12);
  await page.touchscreen.tap(outside.x, outside.y);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Namib Desert" })).toBeFocused();
});

test.describe("native Chromium touch input", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "Uses Chromium's trusted touch input protocol");
  });

  test("scrolls the grid vertically starting on a thumbnail", async ({ page }) => {
    const tile = page.getByRole("button", { name: "Grand Canyon" });
    const rect = await box(tile);
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    const finger = await touch(page);
    await finger.start(x, y);
    for (let distance = 20; distance <= 180; distance += 20) {
      await finger.move(x, y - distance);
    }
    await finger.end();
    const grid = page.getByRole("main", { name: "Photos" });
    await expect.poll(() => grid.evaluate((el) => el.scrollTop)).toBeGreaterThan(60);
    await expect(viewer(page)).toHaveCount(0);
  });

  test("lifts a thumbnail, pages with the same direction, and dismisses only at the edge", async ({ page }) => {
    const tile = page.getByRole("button", { name: "The Bahamas", exact: true, includeHidden: true });
    const rect = await box(tile);
    const x = rect.x + rect.width - 22;
    const y = rect.y + rect.height / 2;
    const finger = await touch(page);
    await finger.start(x, y);
    await finger.move(x - 28, y);
    const dialog = viewer(page);
    await expect(dialog).toHaveAttribute("data-motion", "surface");
    await expect(tile).toHaveAttribute("data-lifted", "");
    for (let distance = 44; distance <= 116; distance += 16) await finger.move(x - distance, y);
    await finger.end();
    await showsPhoto(dialog, "The Bahamas");

    await finger.start(324, 300);
    for (let i = 1; i <= 8; i++) await finger.move(324 - i * 30, 300);
    await expect(dialog).toHaveAttribute("data-motion", "paging");
    await finger.end();
    await showsPhoto(dialog, "Aurora over Earth");

    await finger.start(78, 300);
    for (let i = 1; i <= 8; i++) await finger.move(78 + i * 30, 300);
    await finger.end();
    await showsPhoto(dialog, "The Bahamas");

    await finger.start(115, 300);
    await finger.move(175, 300);
    await expect(dialog).toHaveAttribute("data-motion", "surface");
    await finger.move(48, 300);
    await finger.end();
    await showsPhoto(dialog, "The Bahamas");

    await finger.start(115, 300);
    await finger.move(238, 300);
    await finger.end();
    await expect(dialog).toHaveCount(0);
    await expect(tile).toBeFocused();
  });

  test("a horizontal swipe from empty space pages without dismissing", async ({ page }) => {
    await page.getByRole("button", { name: "Earth from DSCOVR", includeHidden: true }).tap();
    const dialog = viewer(page);
    await showsPhoto(dialog, "Earth from DSCOVR");
    const { outside } = await photoTapPoints(dialog);
    const finger = await touch(page);

    await finger.start(outside.x, outside.y);
    for (let step = 1; step <= 7; step++) await finger.move(outside.x - 28 * step, outside.y);
    await finger.end();
    await showsPhoto(dialog, "Namib Desert");
  });

  test("a canceled edge drag restores the viewer on the last photo", async ({ page }) => {
    const last = page.getByRole("button", { name: "Clouds over New Zealand", includeHidden: true });
    await last.tap();
    const dialog = viewer(page);
    await showsPhoto(dialog, "Clouds over New Zealand");
    const finger = await touch(page);

    await finger.start(310, 300);
    await finger.move(225, 300);
    await expect(dialog).toHaveAttribute("data-motion", "surface");
    await finger.end("touchCancel");
    await showsPhoto(dialog, "Clouds over New Zealand");
    await expect(last).not.toHaveAttribute("data-lifted", "");

    await finger.start(310, 300);
    await finger.move(175, 300);
    await finger.end();
    await expect(dialog).toHaveCount(0);
    await expect(last).toBeFocused();
  });
});
