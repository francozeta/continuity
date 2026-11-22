"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import { Check, ChevronRight, X } from "lucide-react";
import { createBeetleInteraction, type BeetleInteraction } from "./interaction";
import styles from "./experiment.module.css";

const checklists = [
  { name: "Packing", tasks: [
    "Keys", "Wallet", "Passport", "Tickets", "Phone charger", "Power bank",
    "Headphones", "Water bottle", "Sunglasses", "Rain jacket", "Shoes", "Socks",
    "T-shirts", "Trousers", "Sweater", "Sleepwear", "Toothbrush", "Toothpaste",
    "Soap", "Sunscreen", "Laundry bag", "Book",
  ] },
  { name: "Groceries", tasks: ["Bread", "Eggs", "Apples", "Spinach", "Rice", "Yogurt", "Coffee"] },
  { name: "Desk reset", tasks: ["File papers", "Clear cups", "Wipe the desk", "Charge the keyboard", "Empty the bin"] },
  { name: "Laundry", tasks: ["Sort clothes", "Empty pockets", "Wash towels", "Hang shirts", "Fold bedding"] },
  { name: "Bike check", tasks: ["Inflate tires", "Test brakes", "Oil chain", "Test lights", "Pack a lock"] },
  { name: "Garden", tasks: ["Water pots", "Stake tomatoes", "Pull weeds", "Sweep the path", "Refill the watering can"] },
  { name: "Pantry", tasks: ["Oats", "Lentils", "Pasta", "Tomatoes", "Olive oil", "Salt"] },
  { name: "Toolbox", tasks: ["Tape measure", "Screwdrivers", "Spanners", "Pliers", "Flashlight", "Batteries"] },
  { name: "Kitchen", tasks: ["Wash dishes", "Wipe the counter", "Clean the sink", "Wash tea towels", "Empty recycling"] },
  { name: "Camping", tasks: ["Tent", "Tent pegs", "Sleeping bag", "Mat", "Flashlight", "Mug", "Water filter"] },
  { name: "Camera bag", tasks: ["Camera", "Lens", "Memory cards", "Spare battery", "Lens cloth", "Tripod"] },
  { name: "Home supplies", tasks: ["Dish soap", "Bin bags", "Paper towels", "Light bulbs", "Laundry detergent"] },
  { name: "Library", tasks: ["Renew books", "Return books", "Pick up holds", "Bring library card"] },
  { name: "Plants", tasks: ["Check the soil", "Water seedlings", "Turn the pots", "Trim dry leaves"] },
  { name: "Errands", tasks: ["Post the parcel", "Pick up keys", "Collect the print order", "Return the tote"] },
];

type Checklist = (typeof checklists)[number];
type View = { source: HTMLElement; expanded: boolean; open: boolean };
const unchecked: ReadonlySet<string> = new Set();

function ChecklistSurface({ list, view, interaction, checked, onCheckedChange }: {
  list: Checklist;
  view: View;
  interaction: RefObject<BeetleInteraction | null>;
  checked: ReadonlySet<string>;
  onCheckedChange: (task: string, checked: boolean) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const scrollport = useRef<HTMLDivElement>(null);
  const expand = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!frame.current || !popup.current || !backdrop.current || !scrollport.current) return;
    return interaction.current?.attach({
      frame: frame.current,
      popup: popup.current,
      backdrop: backdrop.current,
      scrollport: scrollport.current,
    });
  }, [interaction]);

  return (
    <>
      <Dialog.Backdrop ref={backdrop} className={styles.backdrop} />
      <div ref={frame} className={styles.frame}>
        <Dialog.Popup
          ref={popup}
          initialFocus={expand}
          finalFocus={() => view.source}
          className={styles.popup}
          data-stage={view.expanded ? "expanded" : "preview"}
        >
          <header
            className={styles.header}
            onPointerDown={(event) => {
              // A mouse press on the title can grab the surface without
              // moving focus off a checklist control.
              if (event.pointerType === "mouse" && !(event.target as Element).closest("button")) {
                event.preventDefault();
              }
              interaction.current?.startDrag(event.currentTarget, event.nativeEvent, false);
            }}
          >
            <Dialog.Title className={styles.title}>{list.name}</Dialog.Title>
            <Button ref={expand} className={styles.action} onClick={() => interaction.current?.toggle()}>
              {view.expanded ? "Shrink" : "Expand"}
            </Button>
            <Dialog.Close className={styles.action} aria-label="Close">
              <X size={18} aria-hidden />
            </Dialog.Close>
          </header>
          <div ref={scrollport} className={styles.scrollport}>
            <ul role="list" aria-label="Tasks" className={styles.tasks}>
              {list.tasks.map((task) => (
                <li key={task}>
                  <Checkbox.Root
                    className={styles.task}
                    checked={checked.has(task)}
                    onCheckedChange={(value) => onCheckedChange(task, value)}
                  >
                    <span className={styles.check} aria-hidden>
                      <Checkbox.Indicator>
                        <Check size={14} />
                      </Checkbox.Indicator>
                    </span>
                    {task}
                  </Checkbox.Root>
                </li>
              ))}
            </ul>
          </div>
        </Dialog.Popup>
      </div>
    </>
  );
}

export function BeetleExperiment() {
  const interaction = useRef<BeetleInteraction | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [checked, setChecked] = useState<Record<string, ReadonlySet<string>>>({});
  const list = view && checklists[Number(view.source.dataset.listIndex)];

  useLayoutEffect(() => {
    const instance = createBeetleInteraction({
      open(source) {
        setView({ source, expanded: false, open: true });
      },
      resize(expanded) {
        setView((current) => current && current.expanded !== expanded ? { ...current, expanded } : current);
      },
      close() {
        setView((current) => current && { ...current, open: false });
      },
    });
    interaction.current = instance;
    return () => {
      instance.destroy();
      interaction.current = null;
    };
  }, []);

  return (
    <Dialog.Root
      open={view?.open ?? false}
      triggerId={view?.source.id ?? null}
      onOpenChange={(open, details) => {
        if (open && details.trigger instanceof HTMLElement) {
          interaction.current?.press(details.trigger);
        } else if (!open) {
          details.cancel();
          interaction.current?.dismiss(details.reason === "escape-key");
        }
      }}
    >
      <main className={styles.library} aria-label="Checklists">
        <ul role="list" className={styles.rows}>
          {checklists.map(({ name }, index) => (
            <li key={name}>
              <Dialog.Trigger
                id={`beetle-list-${index}`}
                data-list-index={index}
                className={styles.row}
                onPointerDown={(event) => {
                  interaction.current?.startDrag(event.currentTarget, event.nativeEvent, true);
                }}
              >
                {name}
                <ChevronRight size={18} aria-hidden />
              </Dialog.Trigger>
            </li>
          ))}
        </ul>
      </main>
      {view && list && (
        <Dialog.Portal>
          <ChecklistSurface
            key={list.name}
            view={view}
            list={list}
            interaction={interaction}
            checked={checked[list.name] ?? unchecked}
            onCheckedChange={(task, value) => {
              setChecked((current) => {
                const tasks = new Set(current[list.name]);
                if (value) tasks.add(task);
                else tasks.delete(task);
                return { ...current, [list.name]: tasks };
              });
            }}
          />
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
