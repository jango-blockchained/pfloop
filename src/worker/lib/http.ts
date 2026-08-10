/**
 * Small HTTP helpers — consistent `{ error: string }` responses.
 */

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** JSON error body used by the whole API. */
export type ApiErrorBody = { error: string };

export function jsonError(
	c: Context,
	error: string,
	status: ContentfulStatusCode = 400,
) {
	return c.json({ error } satisfies ApiErrorBody, status);
}

/** Log server-side; return a generic German message (no internals). */
export function jsonInternalError(
	c: Context,
	err: unknown,
	event = "unhandled_error",
) {
	console.error(
		JSON.stringify({
			event,
			message: err instanceof Error ? err.message : String(err),
			path: c.req.path,
			method: c.req.method,
		}),
	);
	return c.json(
		{ error: "Interner Fehler — bitte später erneut versuchen" } satisfies ApiErrorBody,
		500,
	);
}
