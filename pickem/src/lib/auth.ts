/**
 * Optional shared passcode.
 *
 * The board is one operator entering both columns, so there are no accounts.
 * Setting PICKEM_PASSCODE stops anyone who stumbles onto the URL from editing
 * picks or results; leaving it unset keeps the board open.
 */
export function passcodeRequired(): boolean {
  return Boolean(process.env.PICKEM_PASSCODE);
}

export function checkPasscode(supplied: string | null | undefined): boolean {
  const expected = process.env.PICKEM_PASSCODE;
  if (!expected) return true;
  if (!supplied) return false;

  // Constant-time-ish compare so the check does not leak length by timing.
  const a = Buffer.from(String(supplied));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const PASSCODE_HEADER = "x-pickem-passcode";
