"use client";

import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Coffee,
  Cpu,
  GraduationCap,
  HeartHandshake,
  Mail,
  MessageCircle,
  Mic2,
  Phone,
  Radio,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { ACCENTS } from "@/lib/accents";
import { riseIn } from "@/lib/motion";
import type { Coordinator, DutyArea } from "@/lib/types";
import { cn, initialsOf } from "@/lib/utils";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

const DUTY_ICONS: Record<DutyArea, LucideIcon> = {
  "Stage Management": Mic2,
  Discipline: ShieldCheck,
  Refreshment: Coffee,
  Technical: Cpu,
  Hospitality: HeartHandshake,
  Registration: ClipboardCheck,
  "Media & Coverage": Radio,
};

const ROLE_META = {
  faculty: { label: "Faculty Coordinator", Icon: GraduationCap },
  main: { label: "Main Coordinator", Icon: Star },
  sub: { label: "Sub-Coordinator", Icon: MessageCircle },
} as const;

export interface GlassProfileCardProps {
  coordinator: Coordinator;
  /** Threaded into the pre-filled WhatsApp message. */
  eventName?: string;
  /** Override the message. Supports `{name}`, `{dutyArea}`, `{eventName}`. */
  messageTemplate?: string;
  showEmail?: boolean;
  showCall?: boolean;
  className?: string;
}

/**
 * Directory mini-card for one coordinator.
 *
 * The WhatsApp button is the point of the card: it hands the student a chat
 * that already says who they are contacting and why, so the coordinator gets a
 * useful first message instead of "hi sir".
 */
export function GlassProfileCard({
  coordinator,
  eventName,
  messageTemplate,
  showEmail = true,
  showCall = false,
  className,
}: GlassProfileCardProps) {
  const { name, title, role, dutyArea, phone, email, accent } = coordinator;
  const palette = ACCENTS[accent];

  const roleMeta = ROLE_META[role];
  const BadgeIcon = dutyArea ? DUTY_ICONS[dutyArea] : roleMeta.Icon;
  const badgeLabel = dutyArea ?? roleMeta.label;

  // Faculty and main coordinators have no duty area — the message then leans on
  // the event alone, which `buildWhatsAppMessage` handles.
  const whatsAppUrl = phone
    ? buildWhatsAppUrl({
        phone,
        name,
        dutyArea,
        eventName,
        template: messageTemplate,
      })
    : null;

  const previewText = buildWhatsAppMessage({
    name,
    dutyArea,
    eventName,
    template: messageTemplate,
  });

  return (
    <motion.article
      variants={riseIn}
      className={cn(
        "glass glass-shine relative isolate overflow-hidden rounded-glass p-4",
        className,
      )}
    >
      {/* Accent wash bleeding in from the top-right corner. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-16 -right-12 -z-10 size-40 rounded-full",
          "bg-gradient-to-br opacity-25 blur-2xl",
          palette.gradient,
        )}
      />

      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl",
            "bg-gradient-to-br text-[15px] font-semibold text-white",
            "shadow-lg ring-1 ring-white/25",
            palette.gradient,
            palette.glow,
          )}
          aria-hidden
        >
          {initialsOf(name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] leading-tight font-semibold text-ink">
            {name}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted">{title}</p>

          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1",
              "text-[11px] font-medium tracking-[0.01em]",
              palette.chip,
            )}
          >
            <BadgeIcon size={12} strokeWidth={2.4} aria-hidden />
            {badgeLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {whatsAppUrl ? (
          <GlassButton
            href={whatsAppUrl}
            external
            variant="whatsapp"
            size="sm"
            icon={<MessageCircle />}
            fullWidth
            title={previewText}
            aria-label={`WhatsApp ${name}: ${previewText}`}
          >
            WhatsApp
          </GlassButton>
        ) : (
          <GlassButton
            size="sm"
            variant="ghost"
            icon={<MessageCircle />}
            fullWidth
            disabled
            title="No number on file"
          >
            No number
          </GlassButton>
        )}

        {showCall && phone ? (
          <GlassButton
            href={`tel:${phone.replace(/\s/g, "")}`}
            external
            variant="glass"
            size="icon"
            icon={<Phone />}
            aria-label={`Call ${name}`}
            className="size-9 shrink-0"
          />
        ) : null}

        {showEmail && email ? (
          <GlassButton
            href={`mailto:${email}`}
            external
            variant="glass"
            size="icon"
            icon={<Mail />}
            aria-label={`Email ${name}`}
            className="size-9 shrink-0"
          />
        ) : null}
      </div>
    </motion.article>
  );
}
