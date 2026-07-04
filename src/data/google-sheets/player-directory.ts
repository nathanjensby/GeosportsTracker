import type { Player } from "@/types";

/**
 * Maps raw sender identifiers from the synced iMessage data — phone numbers,
 * emails, or the SELF_NAME set in sync_geosports.py — to a friendly Player.
 * The sheet only knows raw identifiers, so add an entry here for everyone in
 * the group chat as they show up (an unmapped sender still works, just shows
 * up on the dashboard under their raw phone number/email until you add them).
 */
export const SENDER_DIRECTORY: Record<string, Player> = {
  Nathan: { id: "nathan", name: "Nathan Jensby" },
  "19032378621": { id: "garrett", name: "Garrett Goode" },
  "15127397704": { id: "steve", name: "Steve Miller"},
  "18432603030": { id: "chris", name: "Chris Chewning" },
  "15129716942": { id: "justin", name: "Justin Wiseman" },
  "18062362938": { id: "lincoln", name: "Lincoln Youree" },
  "15122030590": { id: "eric", name: "Eric Sherrill" },
  // "+15551234567": { id: "jake", name: "Jake" },
};

const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

/**
 * Resolves a raw sender string to a Player. Unmapped senders are registered
 * on the fly under a slugified version of their raw identifier, so new
 * people in the chat still appear instead of being silently dropped.
 */
export function resolveSenderToPlayer(rawSender: string): Player {
  const known = SENDER_DIRECTORY[rawSender];
  if (known) return known;

  const id = rawSender.trim().toLowerCase().replace(NON_ALPHANUMERIC, "-").replace(/^-+|-+$/g, "");
  return { id: id || rawSender, name: rawSender };
}
