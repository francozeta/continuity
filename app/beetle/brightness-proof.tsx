"use client";

import { Slider } from "@base-ui/react/slider";
import { Toggle } from "@base-ui/react/toggle";
import { Link2 } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { Beetle } from "@/components/beetle";

const handoff = { stiffness: 420, damping: 36, mass: 0.75 };

export function BrightnessProof() {
  const id = useId();
  const [proof, setProof] = useState({ linked: false, first: 100, second: 100 });
  const [singleDock, setSingleDock] = useState<HTMLDivElement | null>(null);
  const [pairDock, setPairDock] = useState<HTMLDivElement | null>(null);
  const { linked, first, second } = proof;

  function changeBrightness(value: number) {
    setProof((current) => ({
      ...current,
      first: value,
      second: current.linked ? value : current.second,
    }));
  }

  function linkBrightness(pressed: boolean) {
    setProof((current) => ({
      ...current,
      linked: pressed,
      second: pressed ? current.first : current.second,
    }));
  }

  return (
    <section className="beetle-proof" aria-label="Photograph pair">
      <figure className="beetle-frame">
        <div className="beetle-print" id={`${id}-first`}>
          <Image
            src="/beetle/salt-flats.webp"
            alt="Salt flats below a rocky slope in Death Valley"
            fill
            unoptimized
            draggable={false}
            style={{ filter: `brightness(${first}%)` }}
          />
        </div>
        <div className="beetle-dock beetle-dock--single" ref={setSingleDock} />
      </figure>
      <figure className="beetle-frame">
        <div className="beetle-print" id={`${id}-second`}>
          <Image
            src="/beetle/mountains.webp"
            alt="Sunlit desert mountains beneath streaked clouds"
            fill
            unoptimized
            draggable={false}
            style={{ filter: `brightness(${second}%)` }}
          />
        </div>
      </figure>
      <div className="beetle-dock beetle-dock--pair" ref={setPairDock} />
      <Beetle destination={linked ? pairDock : singleDock} spring={handoff}>
        <div className="beetle-tool">
          <div className="beetle-reading" aria-hidden="true">
            <span>Brightness</span>
            <span className="beetle-value">{first}%</span>
          </div>
          <Slider.Root
            min={60}
            max={140}
            defaultValue={100}
            onValueChange={changeBrightness}
          >
            <Slider.Control className="beetle-slider">
              <Slider.Track className="beetle-track">
                <Slider.Indicator className="beetle-indicator" />
                <Slider.Thumb
                  className="beetle-thumb"
                  getAriaLabel={() =>
                    linked
                      ? "Brightness for both photographs"
                      : "Brightness for the first photograph"
                  }
                  getAriaValueText={(_, value) => `${value}%`}
                />
              </Slider.Track>
            </Slider.Control>
          </Slider.Root>
          <Toggle
            className="beetle-link"
            aria-label="Link brightness"
            aria-controls={`${id}-first ${id}-second`}
            pressed={linked}
            onPressedChange={linkBrightness}
          >
            <Link2 aria-hidden="true" size={16} strokeWidth={1.75} />
            <span>Link</span>
          </Toggle>
        </div>
      </Beetle>
    </section>
  );
}
