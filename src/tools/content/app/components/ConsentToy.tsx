import { useEffect, useRef, useState } from "react";
import { Check } from "@phosphor-icons/react";

function Box({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg px-4 py-3 text-left text-sm text-text-primary transition-colors hover:border-border-hov"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked ? "border-brand bg-brand text-white" : "border-border-hov"
        }`}
      >
        {checked && <Check size={12} weight="bold" />}
      </span>
      {label}
    </button>
  );
}

/**
 * The landing page toy. "Their box" is pre-ticked and ticks itself again
 * whenever you untick it; "Our box" starts empty and stays how you leave it.
 */
export function ConsentToy() {
  const [theirs, setTheirs] = useState(true);
  const [ours, setOurs] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const fightBack = () => {
    setTheirs(false);
    setAttempts((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setTheirs(true), 450);
  };

  return (
    <div className="grid gap-4 @xl:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-border-subtle bg-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-dim">Their box</p>
        <Box checked={theirs} onClick={() => (theirs ? fightBack() : setTheirs(true))} label="I agree" />
        <p className="h-4 font-mono text-[11px] text-text-dim">{attempts > 0 && `Unticked ${attempts}× · still ticked`}</p>
      </div>
      <div className="space-y-3 rounded-xl border border-brand/30 bg-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-brand-light">Our box</p>
        <Box checked={ours} onClick={() => setOurs((v) => !v)} label="I agree" />
        <p className="h-4 font-mono text-[11px] text-text-dim">{ours ? "Ticked, by you" : "Empty until you say yes"}</p>
      </div>
    </div>
  );
}
