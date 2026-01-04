'use client';

import { redirect } from 'next/navigation';

// Redirect to /my-work - the new unified page for pros
export default function MyProposalsPage() {
  redirect('/my-work');
}
