import { redirect } from 'next/navigation';

export default function Page() {
  // Immediately redirect this route to /dashboard/overview on the server
  redirect('/dashboard/overview');
}
