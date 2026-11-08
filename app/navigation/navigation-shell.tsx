"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "@base-ui/react/drawer";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import {
  House, Search, Star, Library, Menu, ArrowLeft, ArrowUpRight,
  Disc3,
} from "lucide-react";

const MOTION_PROFILES = {
  tactile: { label: "Tactile", stiffness: 310, damping: 38, description: "Balanced, attached to the finger." },
  quiet: { label: "Quiet", stiffness: 245, damping: 35, description: "Softer, with restrained energy." },
  brisk: { label: "Brisk", stiffness: 410, damping: 43, description: "Fast, without extra bounce." },
} as const;

type MotionProfile = keyof typeof MOTION_PROFILES;
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(callback: () => void) {
  const preference = window.matchMedia(motionQuery);
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;

const LINKS = [
  { href: "/navigation", label: "Feed", Icon: House },
  { href: "/navigation/reviews", label: "Reviews", Icon: Star },
  { href: "/navigation/library", label: "Library", Icon: Library },
] as const;

function NavigationLink({ href, label, Icon, active, onNavigate }: {
  href: string;
  label: string;
  Icon: typeof House;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="navlab-link"
      data-active={active || undefined}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export default function NavigationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const [open, setOpen] = useState(false);
  const [drawerPresent, setDrawerPresent] = useState(false);
  const [distance, setDistance] = useState(304);
  const [query, setQuery] = useState("");
  const [routeVisits, setRouteVisits] = useState(0);
  const [motionProfile, setMotionProfile] = useState<MotionProfile>("tactile");
  const gripStart = useRef(0);
  const gestureHappened = useRef(false);
  const animation = useRef<{ stop: () => void } | null>(null);
  const previousPath = useRef(pathname);

  // This shell is a layout, not a page. It lives across /navigation/* routes.
  // Shared state and the exact same header/dock DOM survive route navigation.
  useEffect(() => { setRouteVisits(value => value + 1); }, [pathname]);
  useEffect(() => {
    const measure = () => setDistance(Math.max(0, Math.min(window.innerWidth - 84, 304)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const progress = useMotionValue(0);
  const x = useTransform(progress, value => value * distance);
  const menuX = useTransform(progress, value => -12 * (1 - value));
  const radius = useTransform(progress, value => `${Math.round(20 * value)}px`);
  const shadowOpacity = useTransform(progress, value => Math.min(1, value * 1.4));

  const move = (next: boolean) => {
    animation.current?.stop();
    if (next) setDrawerPresent(true);
    setOpen(next);
    if (reducedMotion) {
      progress.jump(next ? 1 : 0);
    } else {
      const profile = MOTION_PROFILES[motionProfile];
      animation.current = animate(progress, next ? 1 : 0, {
        type: "spring",
        stiffness: profile.stiffness,
        damping: profile.damping,
        mass: 1,
      });
    }
  };

  useEffect(() => {
    if (open) {
      setDrawerPresent(true);
      return;
    }
    const finish = (value: number) => {
      if (value < 0.005) setDrawerPresent(false);
    };
    finish(progress.get());
    return progress.on("change", finish);
  }, [open, progress]);

  // A route is replaced, not the shell. The close spring retains its trajectory.
  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      if (open || progress.get() > 0.005) move(false);
    }
  });

  // Only the narrow explicit grip is draggable. No pan handler is placed on
  // the content/3D canvas, so scrolling, text selection and orbit stay intact.
  const handlePanStart = () => {
    gestureHappened.current = true;
    gripStart.current = progress.get();
    animation.current?.stop();
  };
  const handlePan = (_event: unknown, info: { offset: { x: number } }) => {
    if (distance <= 0) return;
    const next = Math.max(0, Math.min(1, gripStart.current + info.offset.x / distance));
    progress.set(next);
    if (next > 0.001) setDrawerPresent(true);
  };
  const handlePanEnd = (_event: unknown, info: { velocity: { x: number } }) => {
    const next = info.velocity.x > 550 ? true : info.velocity.x < -550 ? false : progress.get() > 0.48;
    move(next);
  };

  const isSearch = pathname === "/navigation/search";
  return (
    <div className="navlab-root">
      <Drawer.Root
        modal="trap-focus"
        open={drawerPresent}
        onOpenChange={(next) => move(next)}
        swipeDirection="left"
      >
        <Drawer.Portal keepMounted>
          <Drawer.Viewport className="navlab-drawer-viewport">
            <Drawer.Popup className="navlab-sidebar" style={{ width: Math.max(0, distance - 16) }}>
              <Drawer.Title className="sr-only">Navigation</Drawer.Title>
              <Drawer.Description className="sr-only">Persistent navigation experiment.</Drawer.Description>
              <Drawer.Content data-base-ui-swipe-ignore="x" className="navlab-sidebar-scroll">
                <motion.div style={{ x: menuX }} className="navlab-sidebar-inner">
                  <div className="navlab-logo"><Disc3 size={26} strokeWidth={1.5} /><span>CONTINUITY</span></div>
                  <p className="navlab-section-label">Navigation</p>
                  <nav aria-label="Underlay navigation" className="navlab-navigation">
                    {LINKS.map(({ href, label, Icon }) => (
                      <NavigationLink key={href} href={href} label={label} Icon={Icon}
                        active={pathname === href} onNavigate={() => move(false)} />
                    ))}
                    <NavigationLink href="/navigation/search" label="Search" Icon={Search}
                      active={isSearch} onNavigate={() => move(false)} />
                  </nav>
                  <section className="navlab-motion-panel" aria-label="Motion tuning">
                    <p className="navlab-section-label">Motion profile</p>
                    <div className="navlab-motion-options" role="group" aria-label="Choose the opening animation">
                      {(Object.keys(MOTION_PROFILES) as MotionProfile[]).map((name) => (
                        <button key={name} type="button"
                          onClick={() => setMotionProfile(name)}
                          aria-pressed={motionProfile === name}
                          className="navlab-motion-option">
                          {MOTION_PROFILES[name].label}
                        </button>
                      ))}
                    </div>
                    <p className="navlab-motion-description">{MOTION_PROFILES[motionProfile].description}</p>
                  </section>
                  <div className="navlab-sidebar-footer">
                    <p className="navlab-footer-title">One surface, many states.</p>
                    <p>The navigation stays mounted while the destination changes.</p>
                    <a href="/" className="navlab-origin-link">Original music experiment <ArrowUpRight size={15}/></a>
                  </div>
                </motion.div>
              </Drawer.Content>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <motion.section
        initial={false}
        aria-label="Navigation experiment foreground"
        className="navlab-foreground"
        style={{ x, borderTopLeftRadius: radius, borderBottomLeftRadius: radius }}
      >
        <motion.div aria-hidden="true" style={{ opacity: shadowOpacity }} className="navlab-foreground-shadow" />
        <div className="navlab-app-header">
          <motion.button
            type="button"
            className="navlab-icon-button navlab-menu-trigger"
            style={{ touchAction: "pan-y" }}
            onPointerDown={() => { gestureHappened.current = false; }}
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            onClick={() => { if (!gestureHappened.current) move(!open); }}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}>
            <Menu size={20} strokeWidth={1.8}/>
          </motion.button>
          <span className="navlab-app-name">continuity<span className="navlab-muted"> / navigation</span></span>
          <span className="navlab-live-tag">LIVE</span>
        </div>
        <div className="navlab-body">
          <div className="navlab-body-content">{children}
            <div className="navlab-persistence-proof">
              <span className="navlab-mini-label">PERSISTENCE PROBE</span>
              <p>Route transitions in this mounted shell: <strong>{Math.max(routeVisits - 1, 0)}</strong></p>
              <p>Search query retained: <strong>{query || "—"}</strong></p>
              <p>Motion profile retained: <strong>{MOTION_PROFILES[motionProfile].label}</strong></p>
            </div>
          </div>
        </div>
        <div className="navlab-dock-wrap">
          <nav className="navlab-dock" aria-label="Persistent bottom navigation">
            {/* Both capsule owners stay mounted when Search becomes a text input. */}
            <motion.div
              layout="size"
              className={"navlab-dock-main" + (isSearch ? " navlab-dock-main-compact" : "")}
              transition={{ type: "spring", stiffness: 390, damping: 42, mass: 0.9 }}
            >
              <motion.div
                initial={false}
                aria-hidden={isSearch}
                inert={isSearch}
                animate={{ opacity: isSearch ? 0 : 1 }}
                transition={{ duration: 0.13 }}
                className="navlab-dock-layer navlab-dock-nav"
              >
                {LINKS.map(({ href, label, Icon }) => (
                  <Link key={href} href={href} className="navlab-dock-link"
                    aria-label={label} aria-current={pathname === href ? "page" : undefined}>
                    <Icon size={19} strokeWidth={1.8} />
                    {pathname === href ? <span className="navlab-dock-label">{label}</span> : null}
                  </Link>
                ))}
              </motion.div>
              <motion.div
                initial={false}
                aria-hidden={!isSearch}
                inert={!isSearch}
                animate={{ opacity: isSearch ? 1 : 0 }}
                transition={{ duration: 0.13 }}
                className="navlab-dock-layer navlab-dock-back"
              >
                <Link href="/navigation" className="navlab-dock-link" aria-label="Back to Feed">
                  <ArrowLeft size={20} strokeWidth={1.8}/>
                </Link>
              </motion.div>
            </motion.div>
            <motion.div
              layout="size"
              className={"navlab-dock-search" + (isSearch ? " navlab-search-active" : "")}
              transition={{ type: "spring", stiffness: 390, damping: 42, mass: 0.9 }}
            >
              <motion.div
                initial={false}
                aria-hidden={isSearch}
                inert={isSearch}
                animate={{ opacity: isSearch ? 0 : 1 }}
                transition={{ duration: 0.13 }}
                className="navlab-dock-layer navlab-dock-search-button"
              >
                <Link href="/navigation/search" className="navlab-dock-link" aria-label="Search">
                  <Search size={20} strokeWidth={1.8}/>
                </Link>
              </motion.div>
              <motion.div
                initial={false}
                aria-hidden={!isSearch}
                inert={!isSearch}
                animate={{ opacity: isSearch ? 1 : 0 }}
                transition={{ duration: 0.13 }}
                className="navlab-dock-layer navlab-dock-search-input"
              >
                <label className="navlab-dock-input-wrap">
                  <Search size={18} aria-hidden="true" strokeWidth={1.8}/>
                  <input aria-label="Search demo" value={query} placeholder="Search music"
                    onChange={event => setQuery(event.target.value)}/>
                </label>
              </motion.div>
            </motion.div>
          </nav>
        </div>
        {open ? <button className="navlab-close-shield" aria-label="Close navigation" onClick={() => move(false)} /> : null}
      </motion.section>
    </div>
  );
}
