import "server-only";

import {
  randomBytes,
  scrypt as scryptCallback,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with scrypt from `node:crypto`.
 *
 * scrypt rather than a plain digest because it is deliberately slow and
 * memory-hard: SHA-256 over a password is guessable at billions of tries per
 * second on a GPU, scrypt at these parameters is not. It ships with Node, so
 * this needs no dependency.
 *
 * The parameters are stored alongside each hash, so they can be raised later
 * without invalidating existing passwords — `verifyPassword` reads whatever
 * the stored record was made with.
 */

const scryptAsync = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

// N=16384, r=8 needs ~16MB per hash and takes roughly 50–100ms.
const PARAMS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const encode = (salt: Buffer, derived: Buffer) =>
  [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64url"),
    derived.toString("base64url"),
  ].join("$");

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(password, salt, KEY_LENGTH, PARAMS);
  return encode(salt, derived);
}

/** Blocking variant, used only for the one-off dev account seed. */
export function hashPasswordSync(password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const derived = scryptSync(password, salt, KEY_LENGTH, PARAMS);
  return encode(salt, derived);
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, n, r, p, saltText, hashText] = stored.split("$");
  if (scheme !== "scrypt" || !saltText || !hashText) return false;

  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(hashText, "base64url");

  try {
    const derived = await scryptAsync(password, salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: PARAMS.maxmem,
    });

    // Constant-time: a byte-by-byte early exit would leak the hash prefix.
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  } catch {
    // Corrupt record or absurd parameters — treat as a failed login.
    return false;
  }
}
