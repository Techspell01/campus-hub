"use server";

import { revalidatePath } from "next/cache";

import type { Role } from "@/lib/types";
import { getCurrentUser, requireCoordinator } from "@/server/auth/current-user";
import {
  countCoordinators,
  dismissCoordinatorRequest,
  findUserById,
  requestCoordinatorAccess,
  setUserRole,
} from "@/server/repositories/accounts";

export interface AccessState {
  error?: string;
  success?: string;
}

/* --- Student side -------------------------------------------------------- */

/** A student asking to be made a coordinator. */
export async function requestAccessAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return;

  await requestCoordinatorAccess(user.id);
  revalidatePath("/not-authorised");
}

/* --- Coordinator side ---------------------------------------------------- */

/**
 * Grants or revokes coordinator access.
 *
 * Two guards stop an admin locking everyone out of the admin area: you cannot
 * change your own role, and the last remaining coordinator cannot be demoted.
 * Without those, one wrong click leaves the app with no way back in short of
 * editing the database by hand.
 */
export async function setRoleAction(formData: FormData): Promise<void> {
  const actor = await requireCoordinator("/admin/people");

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;

  if (!userId || (role !== "student" && role !== "coordinator")) return;
  if (userId === actor.id) return;

  const target = await findUserById(userId);
  if (!target) return;

  if (
    target.role === "coordinator" &&
    role === "student" &&
    (await countCoordinators()) <= 1
  ) {
    return;
  }

  await setUserRole(userId, role);
  revalidatePath("/admin/people");
  revalidatePath("/admin");
}

/** Turns down a request without granting anything. */
export async function dismissRequestAction(formData: FormData): Promise<void> {
  await requireCoordinator("/admin/people");

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  await dismissCoordinatorRequest(userId);
  revalidatePath("/admin/people");
}
