/** Domain rules for GrabMe (Pfand pickup). */

/** Minimum one-shot offer value in euro cents (€3.00). */
export const MIN_PFAND_CENTS = 300;

/**
 * Minimum recurring (weekly) estimate in euro cents (€2.50).
 * Future weekly amounts are uncertain; collectors treat the listed value as a
 * rough estimate with up to RECURRING_VALUE_THRESHOLD downside.
 */
export const MIN_RECURRING_PFAND_CENTS = 250;

/**
 * Max downside on a weekly estimate (0.5 = −50 %).
 * Example: 20×0,25 € = 5,00 € estimate → floor 2,50 €.
 */
export const RECURRING_VALUE_THRESHOLD = 0.5;

/** How long a collector has to pick up after accepting (before auto-reopen). */
export const RESERVATION_HOURS = 6;

/**
 * Unfinished reservations block new accepts.
 * unfinished = active (accepted, not yet collected) OR collected (waiting for poster).
 * Max 1 so the last offer must be finished before the next.
 */
export const MAX_UNFINISHED_RESERVATIONS_PER_USER = 1;

/** Max active (open or assigned) recurring weekly offers per poster. */
export const MAX_RECURRING_OFFERS_PER_USER = 2;

/** ISO weekday: 1=Monday … 7=Sunday. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Map / list query caps (rate-limit friendly). */
export const MAX_MAP_OFFERS = 200;
export const MAX_MINE_OFFERS = 100;
export const MAX_MINE_RESERVATIONS = 100;

/** Input size limits — reject abusive payloads early. */
export const MAX_JSON_BODY_BYTES = 16_384; // 16 KiB
export const MAX_TITLE_LEN = 120;
export const MAX_NOTE_LEN = 1000;
export const MAX_ADDRESS_TEXT_LEN = 300;
export const MAX_ADDRESS_HINT_LEN = 120;
export const MAX_EMAIL_LEN = 254;
export const MAX_DISPLAY_NAME_LEN = 80;
export const MAX_TOKEN_LEN = 128;
export const MAX_ADDRESS_LABEL_LEN = 40;
/** Saved addresses per user (profile). */
export const MAX_USER_ADDRESSES = 8;

/** Geographic bounds. */
export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;
/**
 * Max bbox span in degrees (anti-scrape / abuse).
 * ~25° covers all of Germany zoomed out; still rejects world-scale queries.
 */
export const MAX_BBOX_SPAN_DEG = 25;

export const OFFER_STATUSES = [
	"open",
	"reserved",
	"collected",
	"completed",
	"cancelled",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const RESERVATION_STATUSES = [
	"active",
	"collected",
	"completed",
	"released",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
