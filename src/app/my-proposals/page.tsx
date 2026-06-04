'use client';

// Legacy slug. The pro-side dashboard moved to /my-work in 2026-05;
// this page is kept as a stable redirect so any old bookmarks or
// outbound links still land in the right place. No client hooks or
// state - calling `redirect()` inside a client component is fine.
import { redirect } from 'next/navigation';

export default function MyProposalsPage() {
  redirect("/my-work");
}
