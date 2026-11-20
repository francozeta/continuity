import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const tool = ".beetle-tool";
const single = ".beetle-dock--single";
const pair = ".beetle-dock--pair";
const toggleName = "Link brightness";
const axeTags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];

async function openPreview(page: Page) {
  const response = await page.goto("/beetle");
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("button", { name: toggleName })).toBeVisible();
}

async function slowNextHandoff(page: Page) {
  await page.locator(tool).getByRole("button").evaluate((button, selector) => {
    button.addEventListener("click", () => {
      requestAnimationFrame(() => {
        const host = document.querySelector(selector)?.parentElement;
        host?.getAnimations()[0]?.updatePlaybackRate(0.2);
      });
    }, { once: true });
  }, tool);
}

test("one keyboard-operable control changes scope and keeps internal value and focus", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openPreview(page);

  const slider = page.getByRole("slider");
  const toggle = page.getByRole("button", { name: toggleName });
  const pictures = page.getByRole("region", { name: "Photograph pair" }).getByRole("img");
  const sliderNode = await slider.elementHandle();
  const toggleNode = await toggle.elementHandle();

  await expect(pictures).toHaveCount(2);
  await expect.poll(() => pictures.evaluateAll((images) => images.every(
    (node) => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0,
  ))).toBe(true);

  await page.keyboard.press("Tab");
  await expect(slider).toBeFocused();
  await expect(slider).toHaveAccessibleName("Brightness for the first photograph");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("140");
  await expect(pictures.nth(0)).toHaveCSS("filter", "brightness(1.4)");
  await expect(pictures.nth(1)).toHaveCSS("filter", "brightness(1)");

  await page.keyboard.press("Tab");
  await expect(toggle).toBeFocused();
  await toggle.evaluate((element) => {
    element.addEventListener("blur", () => element.setAttribute("data-test-blur", ""));
  });
  await page.keyboard.press("Enter");

  await expect(page.locator(pair).locator(tool)).toBeVisible();
  await expect(page.locator(single)).toBeEmpty();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  if (await page.evaluate(() => "moveBefore" in Element.prototype)) {
    await expect(toggle).not.toHaveAttribute("data-test-blur", "");
  }
  expect(await toggle.evaluate((element, earlier) => element === earlier, toggleNode)).toBe(true);
  expect(await slider.evaluate((element, earlier) => element === earlier, sliderNode)).toBe(true);
  await expect(slider).toHaveValue("140");
  await expect(slider).toHaveAccessibleName("Brightness for both photographs");
  await expect(pictures.nth(1)).toHaveCSS("filter", "brightness(1.4)");

  await page.keyboard.press("Shift+Tab");
  await expect(slider).toBeFocused();
  await page.keyboard.press("Home");
  await expect(pictures.nth(0)).toHaveCSS("filter", "brightness(0.6)");
  await expect(pictures.nth(1)).toHaveCSS("filter", "brightness(0.6)");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page.locator(single).locator(tool)).toBeVisible();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("61");
  await expect(pictures.nth(0)).toHaveCSS("filter", "brightness(0.61)");
  await expect(pictures.nth(1)).toHaveCSS("filter", "brightness(0.6)");
  expect(errors).toEqual([]);
});

test("a real press can reverse a moving button or be cancelled outside it", async ({ page }) => {
  await openPreview(page);
  const toggle = page.getByRole("button", { name: toggleName });
  await slowNextHandoff(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.waitForFunction(({ selector, dock }) => {
    const button = document.querySelector(`${selector} button`);
    const destination = document.querySelector(dock);
    if (!button || !destination) return false;
    const remaining = destination.getBoundingClientRect().right - button.getBoundingClientRect().right;
    return remaining > 90 && remaining < 170;
  }, { selector: tool, dock: pair });

  const movingBox = (await toggle.boundingBox())!;
  const pressX = movingBox.x + movingBox.width * 0.68;
  const pressY = movingBox.y + movingBox.height / 2;
  await page.mouse.move(pressX, pressY);
  await page.mouse.down();
  await expect.poll(() => toggle.evaluate((element) => {
    const animation = element.closest(".beetle-tool")?.parentElement?.getAnimations()[0];
    return animation?.playState === "paused" && !animation.pending;
  })).toBe(true);
  const pressedBox = (await toggle.boundingBox())!;
  await page.waitForTimeout(220); // A held press would otherwise outlast this hit target.
  const heldBox = (await toggle.boundingBox())!;
  expect(Math.abs(heldBox.x - pressedBox.x)).toBeLessThan(2);
  await page.mouse.up();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(single).locator(tool)).toBeVisible();

  await slowNextHandoff(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.waitForFunction((selector) => {
    const animation = document.querySelector(selector)?.parentElement?.getAnimations()[0];
    return animation && Number(animation.currentTime) > 35;
  }, tool);
  const cancelBox = (await toggle.boundingBox())!;
  await page.mouse.move(cancelBox.x + cancelBox.width * 0.68, cancelBox.y + cancelBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cancelBox.x + cancelBox.width / 2, cancelBox.y + cancelBox.height + 30);
  await page.mouse.up();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.locator(tool).evaluate(
    (element) => element.parentElement!.getAnimations().length,
  )).toBe(0);
});

test("slider input is live before the relocation ends", async ({ page }) => {
  await openPreview(page);
  const toggle = page.getByRole("button", { name: toggleName });
  const slider = page.getByRole("slider");
  await slowNextHandoff(page);
  await toggle.click();
  await page.waitForFunction((selector) => {
    const animation = document.querySelector(selector)?.parentElement?.getAnimations()[0];
    return animation && Number(animation.currentTime) > 35;
  }, tool);
  const track = (await page.locator(".beetle-track").boundingBox())!;
  await page.mouse.move(track.x + track.width * 0.81, track.y + track.height / 2);
  await page.mouse.down();
  await expect(slider).not.toHaveValue("100");
  const value = Number(await slider.inputValue()) / 100;
  await expect(page.getByRole("region", { name: "Photograph pair" }).getByRole("img").nth(1))
    .toHaveCSS("filter", `brightness(${value})`);
  expect(await page.locator(tool).evaluate(
    (element) => element.parentElement!.getAnimations()[0]?.playState,
  )).toBe("paused");
  await page.mouse.up();
  await expect(slider).toBeFocused();
});

test("repeated keyboard reversal retains the same node and final destination", async ({ page }) => {
  await openPreview(page);
  const toggle = page.getByRole("button", { name: toggleName });
  await toggle.focus();
  const initial = await toggle.elementHandle();
  for (let index = 0; index < 13; index++) {
    await page.keyboard.press("Enter");
  }
  await expect(page.locator(pair).locator(tool)).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toBeFocused();
  expect(await toggle.evaluate((element, earlier) => element === earlier, initial)).toBe(true);
  await expect(page.getByRole("slider")).toHaveCount(1);
});

test("viewport changes and intermediate frames keep the live target clear", async ({ page }) => {
  await openPreview(page);
  const toggle = page.getByRole("button", { name: toggleName });
  await slowNextHandoff(page);
  await toggle.click();
  await expect(page.locator(pair).locator(tool)).toBeVisible();
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(() => page.locator(tool).evaluate(
    (element) => element.parentElement!.getAnimations().length,
  )).toBe(0);

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => new Promise<void>((done) => {
      requestAnimationFrame(() => requestAnimationFrame(() => done()));
    }));
    const result = await page.locator(tool).evaluate(async (element) => {
      const button = element.querySelector("button")!;
      const imageBottom = Math.max(...Array.from(
        document.querySelectorAll(".beetle-print img"),
        (image) => image.getBoundingClientRect().bottom,
      ));
      const initial = element.getBoundingClientRect();
      const target = document.querySelector(
        button.getAttribute("aria-pressed") === "true" ? ".beetle-dock--single" : ".beetle-dock--pair",
      )!.getBoundingClientRect();

      // Synthesize only the sampling trigger. Separate tests exercise real clicks.
      button.click();
      const frames = [];
      for (let frame = 0; frame < 21; frame++) {
        await new Promise<void>((done) => requestAnimationFrame(() => done()));
        const rect = element.getBoundingClientRect();
        const hit = button.getBoundingClientRect();
        frames.push({
          between: Math.abs(rect.x - initial.x) > 2 && Math.abs(rect.x - target.x) > 2,
          clear: rect.x >= -0.5 && rect.right <= document.documentElement.clientWidth + 0.5
            && rect.y >= imageBottom && rect.bottom <= window.innerHeight + 0.5,
          sizeStable: Math.abs(rect.width - initial.width) < 0.75
            && Math.abs(rect.height - initial.height) < 0.75,
          hit: button.contains(document.elementFromPoint(hit.x + hit.width / 2, hit.y + hit.height / 2)),
        });
      }
      return frames;
    });
    expect(result.some((frame) => frame.between)).toBe(true);
    expect(result.every((frame) => frame.clear && frame.sizeStable && frame.hit)).toBe(true);
    await expect.poll(() => page.locator(tool).evaluate(
      (element) => element.parentElement!.getAnimations().length,
    )).toBe(0);
  }
});

test("reduced motion works at load and stops an in-progress relocation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPreview(page);
  const toggle = page.getByRole("button", { name: toggleName });
  await toggle.focus();
  await page.keyboard.press("Enter");
  const animations = () => page.locator(tool).evaluate(
    (element) => element.parentElement!.getAnimations().length,
  );
  await expect(page.locator(pair).locator(tool)).toBeVisible();
  expect(await animations()).toBe(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await slowNextHandoff(page);
  await page.keyboard.press("Enter");
  await expect.poll(animations).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(animations).toBe(0);
  await expect(page.locator(single).locator(tool)).toBeVisible();
  await expect(toggle).toBeFocused();
});

test("legacy movement restores the focused descendant and retains the same slider", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "moveBefore", {
      configurable: true,
      value: undefined,
    });
  });
  await openPreview(page);
  const slider = page.getByRole("slider");
  const sliderNode = await slider.elementHandle();
  await slider.focus();
  await page.keyboard.press("End");
  // A move requested independently of the focused control must leave it focused.
  await page.getByRole("button", { name: toggleName }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator(pair).locator(tool)).toBeVisible();
  await expect(slider).toBeFocused();
  await expect(slider).toHaveValue("140");
  expect(await slider.evaluate((element, earlier) => element === earlier, sliderNode)).toBe(true);
});

test("narrow touch targets operate the tool", async ({ browser, browserName }) => {
  test.skip(browserName === "firefox", "Playwright touch emulation is covered on Chromium and WebKit.");
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 320, height: 568 },
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await openPreview(page);
    const toggle = page.getByRole("button", { name: toggleName });
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page.locator(".beetle-track").tap({ position: { x: 12, y: 1 } });
    await expect(page.getByRole("slider")).not.toHaveValue("100");
    await toggle.tap();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  } finally {
    await context.close();
  }
});

test("automated accessibility passes in both locations at wide and narrow sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPreview(page);
  const toggle = page.getByRole("button", { name: toggleName });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    for (const pressed of ["false", "true"]) {
      await expect(toggle).toHaveAttribute("aria-pressed", pressed);
      expect((await new AxeBuilder({ page }).withTags(axeTags).analyze()).violations).toEqual([]);
      await toggle.click();
    }
  }
});
