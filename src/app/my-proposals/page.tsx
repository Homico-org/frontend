'use client';

import { redirect } from 'next/navigation';
import { useLanguage } from "@/contexts/LanguageContext";

// Redirect to /my-work - the new unified page for pros
export default function MyProposalsPage() {
  const { t } = useLanguage();
  redirect('/my-work');
}
