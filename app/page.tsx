import { redirect } from 'next/navigation';
import { getSetupMode } from '@/lib/setup-mode';

const getFirstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
}) {
  const { mode } = await searchParams;
  const setupMode = getSetupMode(getFirstValue(mode));

  redirect(
    setupMode === 'default' ? '/setup' : `/setup?mode=${setupMode}`,
  );
}
