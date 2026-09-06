import { Trash2 } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";

/**
 * Delete control.
 *
 * A plain form posting to a server action rather than a fetch — it keeps the
 * mutation on the server side of the boundary and works without JavaScript.
 */
export function DeleteButton({
  action,
  id,
  label = "Delete",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <GlassButton
        type="submit"
        variant="ghost"
        size="sm"
        icon={<Trash2 />}
        aria-label={label}
        title={label}
        className="text-rose-600 dark:text-rose-300"
      >
        {label}
      </GlassButton>
    </form>
  );
}
