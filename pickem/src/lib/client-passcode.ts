"use client";

/**
 * The passcode, if the deployment sets one, lives in localStorage so it is
 * typed once per device rather than on every tap.
 */
const KEY = "pickem-passcode";

export function getPasscode(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function setPasscode(value: string): void {
  try { window.localStorage.setItem(KEY, value); } catch { /* private mode */ }
}

/** POST with the stored passcode, prompting once and retrying if it is rejected. */
export async function post(url: string, body: unknown): Promise<Response> {
  const send = (code: string) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-pickem-passcode": code },
      body: JSON.stringify(body),
    });

  let res = await send(getPasscode());
  if (res.status === 401 && typeof window !== "undefined") {
    const entered = window.prompt("Passcode for this board:");
    if (!entered) return res;
    setPasscode(entered);
    res = await send(entered);
  }
  return res;
}
