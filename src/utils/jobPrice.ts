// Total of a job's selected services (Σ unitPrice × quantity).
//
// Used by the share-link preview (OG metadata + OG image) so the card shows
// the REAL total — e.g. 2310₾ for a 385₾ + 1925₾ job — instead of a single
// service's price or the legacy `budgetAmount` (which showed e.g. 110₾).
//
// Returns null when the job has no fixed-priced services, so callers fall
// back to their existing budgetType/budgetAmount formatting. Pure + edge-safe
// (no imports) so the edge OG route can use it too.
interface JobServiceLite {
  quantity?: number;
  unitPrice?: number;
}

export function jobServicesTotal(job: Record<string, unknown>): number | null {
  const services = job?.services as JobServiceLite[] | undefined;
  if (!Array.isArray(services) || services.length === 0) return null;

  let total = 0;
  for (const s of services) {
    if (s && typeof s.unitPrice === "number" && s.unitPrice > 0) {
      total += s.unitPrice * (s.quantity || 1);
    }
  }
  return total > 0 ? total : null;
}
