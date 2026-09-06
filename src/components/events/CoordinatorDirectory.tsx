import { GraduationCap, Star, Users } from "lucide-react";

import { CoordinatorGrid } from "@/components/events/CoordinatorGrid";
import { DUTY_AREAS, type Coordinator, type DutyArea } from "@/lib/types";

function SectionLabel({
  icon: Icon,
  title,
  caption,
}: {
  icon: typeof Users;
  title: string;
  caption: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5 px-1">
      <Icon size={16} strokeWidth={2.2} className="text-ink-faint" aria-hidden />
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
        {title}
      </h3>
      <span className="text-[12px] text-ink-faint">{caption}</span>
    </div>
  );
}

/**
 * The event's organisational hierarchy: faculty at the top, main student
 * coordinators below, then sub-coordinators bucketed by the duty they own —
 * so a student with a stage question can find the stage person directly.
 */
export function CoordinatorDirectory({
  coordinators,
  eventName,
}: {
  coordinators: Coordinator[];
  eventName: string;
}) {
  const faculty = coordinators.filter((c) => c.role === "faculty");
  const main = coordinators.filter((c) => c.role === "main");
  const subs = coordinators.filter((c) => c.role === "sub");

  const byDuty = DUTY_AREAS.map((duty: DutyArea) => ({
    duty,
    people: subs.filter((c) => c.dutyArea === duty),
  })).filter((group) => group.people.length > 0);

  return (
    <div className="space-y-9">
      {faculty.length > 0 && (
        <section>
          <SectionLabel
            icon={GraduationCap}
            title="Faculty Coordinators"
            caption="Escalation and approvals"
          />
          <CoordinatorGrid
            coordinators={faculty}
            eventName={eventName}
            showCall
          />
        </section>
      )}

      {main.length > 0 && (
        <section>
          <SectionLabel
            icon={Star}
            title="Main Student Coordinators"
            caption="Overall ownership"
          />
          <CoordinatorGrid
            coordinators={main}
            eventName={eventName}
            showCall
          />
        </section>
      )}

      {byDuty.length > 0 && (
        <section>
          <SectionLabel
            icon={Users}
            title="Sub-Coordinators"
            caption={`${subs.length} people across ${byDuty.length} duties`}
          />

          <div className="space-y-5">
            {byDuty.map(({ duty, people }) => (
              <div key={duty}>
                <div className="mb-2.5 flex items-center gap-3 px-1">
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">
                    {duty}
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-white/25 dark:bg-white/10"
                  />
                  <span className="text-[11px] text-ink-faint tabular-nums">
                    {people.length}
                  </span>
                </div>
                <CoordinatorGrid coordinators={people} eventName={eventName} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
