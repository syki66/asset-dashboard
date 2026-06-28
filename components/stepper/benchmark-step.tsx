import { InterestRatePanel } from './interest-rate-panel';

const upcomingBenchmarks = [
  'S&P 500',
  'NASDAQ 100',
  'Dow Jones',
  'Russell 2000',
  'MSCI World',
  'MSCI ACWI',
  'MSCI Emerging Markets',
  '니케이 225',
  'TOPIX',
  'Euro Stoxx 50',
  'FTSE 100',
  'DAX',
  '항셍지수',
  'KOSPI',
  'KOSDAQ',
];

interface BenchmarkStepProps {
  startYear?: number;
}

export const BenchmarkStep = ({ startYear }: BenchmarkStepProps) => {
  return (
    <div className='space-y-4'>
      <div className='space-y-4 rounded-2xl border border-white/20 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--setup-primary,var(--primary))_8%,transparent),color-mix(in_oklch,var(--setup-secondary,var(--primary))_6%,transparent))] p-4 shadow-sm backdrop-blur-md'>
        <div className='rounded-xl border border-white/15 bg-white/[0.04] p-4'>
          <div className='inline-flex items-center rounded-full border border-[color:var(--setup-primary,var(--primary))]/20 bg-[color:var(--setup-primary,var(--primary))]/10 px-2.5 py-1 text-xs font-semibold text-[color:var(--setup-primary,var(--primary))]'>
            현재 지원
          </div>
          <h3 className='mt-3 bg-[linear-gradient(90deg,var(--setup-primary,var(--primary)),var(--setup-secondary,var(--primary)))] bg-clip-text text-base font-semibold text-transparent'>
            예금 벤치마크
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            월별 최상/최하 예금 금리를 기준으로 포트폴리오 성과와 비교합니다.
            단위는 %이며, 월 헤더를 클릭해 해당 월을 활성화하거나 비활성화할 수 있습니다.
            최상/최하 입력칸을 비우면 해당 시나리오만 직전 월 금리를 사용합니다.
          </p>
        </div>
        <InterestRatePanel startYear={startYear} />
      </div>
      <div className='rounded-xl border border-dashed border-[color:var(--setup-secondary,var(--primary))]/30 bg-[color-mix(in_oklch,var(--setup-secondary,var(--primary))_6%,transparent)] p-4 shadow-sm backdrop-blur-md'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='inline-flex items-center rounded-full border border-[color:var(--setup-secondary,var(--primary))]/20 bg-[color-mix(in_oklch,var(--setup-secondary,var(--primary))_8%,transparent)] px-2.5 py-1 text-xs font-semibold text-[color:var(--setup-secondary,var(--primary))]'>
              추후 지원
            </div>
            <p className='mt-2 text-xs text-muted-foreground'>
              현재는 예금 벤치마크만 사용하며, 대표지수 비교는 이후 확장 예정입니다.
            </p>
          </div>
        </div>
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {upcomingBenchmarks.map((benchmark) => (
            <span
              key={benchmark}
              className='cursor-not-allowed rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-xs text-muted-foreground/60 opacity-70 backdrop-blur-sm'
            >
              {benchmark}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
