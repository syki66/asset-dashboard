import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string | string[] }>;
}) {
  // 데모 링크로 진입한 경우 Setup에서도 데모 안내를 이어갈 수 있도록 쿼리를 유지합니다.
  const { demo } = await searchParams;
  const demoValue = Array.isArray(demo) ? demo[0] : demo;
  const isDemo = demoValue === '' || demoValue === 'true' || demoValue === '1';

  redirect(isDemo ? '/setup?demo=true' : '/setup');
}
