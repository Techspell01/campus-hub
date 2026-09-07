import { Starfield } from "@/components/layout/Starfield";

/**
 * The backdrop everything else floats over.
 *
 * Three layers, in order:
 *
 *  1. the void — near-black, not pure black
 *  2. nebulae — large, soft colour fields that drift
 *  3. stars — a canvas of drifting points
 *
 * The nebulae are not decoration. `backdrop-filter` works by sampling what is
 * behind an element, so glass over flat black has nothing to refract and reads
 * as grey plastic. The colour fields are what give every frosted panel in the
 * app something to pick up.
 *
 * They are radial gradients rather than blurred circles. The blurred version
 * looked identical but cost a `filter: blur(110px)` across a 70vmax element,
 * recomputed every frame because the shapes drift — the single most expensive
 * thing on the page, and why iOS crawled while Android coped. A gradient with
 * a soft falloff rasterises once and then only moves.
 *
 * A server component: only the canvas needs to be interactive.
 */
export function SpaceBackground() {
  return (
    <div
      aria-hidden
      style={{ viewTransitionName: "app-backdrop" }}
      className="pointer-events-none fixed inset-0 -z-50 overflow-hidden bg-void"
    >
      <div className="nebula-a absolute -top-[20%] -left-[15%] size-[80vmax] animate-drift will-change-transform" />
      <div
        className="nebula-b absolute -right-[18%] bottom-[-15%] size-[72vmax] animate-drift will-change-transform"
        style={{ animationDelay: "-8s", animationDuration: "31s" }}
      />
      <div
        className="nebula-c absolute top-[30%] left-[40%] size-[58vmax] animate-drift will-change-transform"
        style={{ animationDelay: "-16s", animationDuration: "27s" }}
      />

      <Starfield />

      {/* Vignette — pushes the corners back so foreground glass sits forward.
          Barely there in daylight; heavier in the dark, where it makes depth. */}
      <div className="absolute inset-0 bg-radial-[at_50%_35%] from-transparent to-black/[0.04] dark:to-black/40" />
    </div>
  );
}
