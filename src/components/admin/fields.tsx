import type { ReactNode } from "react";

import { ACCENT_KEYS } from "@/lib/accents";
import { cn } from "@/lib/utils";

export const FIELD =
  "w-full rounded-2xl border border-white/25 bg-white/45 px-3.5 py-2.5 text-[14px] " +
  "text-ink outline-none transition-colors placeholder:text-ink-faint " +
  "focus:border-amber-400/60 dark:border-white/12 dark:bg-white/[0.07]";

const LABEL =
  "mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-ink-faint uppercase";

/** Label + control wrapper. Plain markup, so it works in a server component. */
export function Field({
  label,
  name,
  children,
  hint,
  span,
}: {
  label: string;
  name: string;
  children?: ReactNode;
  hint?: string;
  span?: boolean;
}) {
  return (
    <div className={cn(span && "sm:col-span-2")}>
      <label htmlFor={name} className={LABEL}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  name,
  hint,
  span,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
  span?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} name={name} hint={hint} span={span}>
      <input id={name} name={name} className={FIELD} {...props} />
    </Field>
  );
}

export function TextArea({
  label,
  name,
  hint,
  ...props
}: {
  label: string;
  name: string;
  hint?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} name={name} hint={hint} span>
      <textarea id={name} name={name} rows={2} className={FIELD} {...props} />
    </Field>
  );
}

export function SelectField({
  label,
  name,
  options,
  hint,
  span,
  ...props
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  hint?: string;
  span?: boolean;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} name={name} hint={hint} span={span}>
      <select id={name} name={name} className={FIELD} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function AccentField({ defaultValue }: { defaultValue?: string }) {
  return (
    <SelectField
      label="Colour"
      name="accent"
      defaultValue={defaultValue ?? "amber"}
      options={ACCENT_KEYS.map((key) => ({
        value: key,
        label: key[0].toUpperCase() + key.slice(1),
      }))}
    />
  );
}

export function CheckField({
  label,
  name,
  hint,
  defaultChecked,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-white/25 bg-white/35 px-3.5 py-2.5 dark:border-white/12 dark:bg-white/[0.05]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-amber-500"
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[11.5px] text-ink-faint">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
