import { redirect } from 'next/navigation';

// `/my-work` was consolidated into the pro dashboard - active + completed work
// now live as tabs under `/my-space`. Keep this route as a redirect so old
// links and bookmarks don't 404.
export default function MyWorkRedirect() {
  redirect('/my-space');
}
