import { redirect } from 'next/navigation';

// `/pro/orders` was a third, orphaned view of the pro's accepted work (same
// /jobs/my-proposals/list data as My Space). Consolidated into My Space; kept
// as a redirect so any old link resolves instead of 404ing.
export default function ProOrdersRedirect() {
  redirect('/my-space');
}
