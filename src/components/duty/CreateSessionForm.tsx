"use client";

import { useRouter } from "next/navigation";
import { Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { GlassButton } from "@/components/ui/GlassButton";
import { DUTY_AREAS, type DutyArea } from "@/lib/types";

const FIELD =
  "w-full rounded-2xl border border-white/25 bg-white/45 px-3.5 py-2.5 text-[14px] " +
  "text-ink outline-none transition-colors placeholder:text-ink-faint " +
  "focus:border-white/45 dark:border-white/12 dark:bg-white/[0.07]";

const LABEL =
  "mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase";

const DURATIONS = [
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

export function CreateSessionForm({
  events,
}: {
  events: { id: string; title: string }[];
}) {
  const router = useRouter();

  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [dutyArea, setDutyArea] = useState<DutyArea>(DUTY_AREAS[0]);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [expectedVolunteers, setExpectedVolunteers] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/duty/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No `createdBy`: the server stamps ownership from the session.
        body: JSON.stringify({
          eventId,
          dutyArea,
          durationMinutes,
          expectedVolunteers,
        }),
      });

      const data = (await response.json()) as {
        session?: { id: string };
        error?: string;
      };

      if (!response.ok || !data.session) {
        setError(data.error ?? "Couldn't create the duty group.");
        return;
      }

      router.push(`/duty/${data.session.id}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass glass-shine relative isolate overflow-hidden rounded-glass-lg p-5"
    >
      <h2 className="text-[15px] font-semibold text-ink">Open a duty group</h2>
      <p className="mt-1 text-[13px] text-ink-muted">
        Creates a session with its own rotating QR for volunteers to scan.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="duty-event" className={LABEL}>
            Event
          </label>
          <select
            id="duty-event"
            className={FIELD}
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duty-area" className={LABEL}>
            Duty
          </label>
          <select
            id="duty-area"
            className={FIELD}
            value={dutyArea}
            onChange={(e) => setDutyArea(e.target.value as DutyArea)}
          >
            {DUTY_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duty-duration" className={LABEL}>
            Open for
          </label>
          <select
            id="duty-duration"
            className={FIELD}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          >
            {DURATIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duty-expected" className={LABEL}>
            Volunteers expected
          </label>
          <input
            id="duty-expected"
            type="number"
            min={1}
            max={500}
            className={FIELD}
            value={expectedVolunteers}
            onChange={(e) => setExpectedVolunteers(Number(e.target.value))}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-[13px] text-rose-700 dark:text-rose-300"
        >
          <TriangleAlert size={15} className="shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <GlassButton
        type="submit"
        variant="primary"
        size="lg"
        icon={<Plus />}
        disabled={pending || !eventId}
        className="mt-5"
      >
        {pending ? "Creating…" : "Create duty group"}
      </GlassButton>
    </form>
  );
}
