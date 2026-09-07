import { Starfield } from "@/components/layout/Starfield";

/**
 * The backdrop everything else floats over.
 *
 * Three layers, in order:
 *
 *  1. the void — a deep blue-black, not pure black
 *  2. nebulae — large, soft colour fields that drift
 *  3. stars — a canvas of drifting points
 *
 * The nebulae are not decoration. `backdrop-filter` works by sampling what is
 * behind an element, so glass over flat black has nothing to refract and reads
 * as grey plastic. The colour fields are what give every frosted panel in the
 * app something to pick up.
 *
 * A server component: only the canvas needs to be interactive.
 */
export function SpaceBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-50 overflow-hidden bg-void"
    >
      {/* Nebulae. Heavily blurred and slowly drifting, so the light behind the
          glass shifts as you read rather than sitting still. */}
      <div className="absolute -top-[20%] -left-[15%] size-[70vmax] animate-drift rounded-full bg-nebula-1 blur-[110px] will-change-transform" />
      <div
        className="absolute -right-[18%] bottom-[-15%] size-[62vmax] animate-drift rounded-full bg-nebula-2 blur-[120px] will-change-transform"
        style={{ animationDelay: "-8s", animationDuration: "31s" }}
      />
      <div
        className="absolute top-[35%] left-[45%] size-[48vmax] animate-drift rounded-full bg-nebula-3 blur-[130px] will-change-transform"
        style={{ animationDelay: "-16s", animationDuration: "27s" }}
      />

      <Starfield />

      {/* Vignette — pushes the corners back so foreground glass sits forward.
          Barely there in daylight; heavy in the dark, where it makes depth. */}
      <div className="absolute inset-0 bg-radial-[at_50%_35%] from-transparent to-black/[0.04] dark:to-black/40" />
    </div>
  );
}
