import { setVapidDetails } from "web-push";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from "./env.js";

let pushConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  try {
    setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    pushConfigured = true;
    console.log("[Push] Web Push configured successfully with VAPID details.");
  } catch (err) {
    console.warn("[Push] Failed to initialize VAPID details:", err);
    pushConfigured = false;
  }
} else {
  console.warn(
    "[Push] Web Push disabled: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT is missing."
  );
}

export function isPushConfigured(): boolean {
  return pushConfigured;
}

export function getVapidPublicKey(): string | null {
  return pushConfigured && VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY : null;
}
