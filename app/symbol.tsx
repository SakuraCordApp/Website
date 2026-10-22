import type { CSSProperties, ReactNode } from "react";

/** An SF Symbol, drawn in the current text colour from a mask in /site/symbols. */
export function SFSymbol({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={["sf", className].filter(Boolean).join(" ")}
      style={{ "--sf": `url(/site/symbols/${name}.png)` } as CSSProperties}
      aria-hidden="true"
    />
  );
}

/** Button label that blurs into an SF Symbol on hover, like the home page's pills. */
export function Morph({ children, icon }: { children: ReactNode; icon: string }) {
  return (
    <span className="morph">
      <span className="rest">{children}</span>
      <span className="hover" aria-hidden="true">
        <SFSymbol name={icon} />
      </span>
    </span>
  );
}
