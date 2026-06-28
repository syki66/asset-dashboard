'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { CsvStep, DateStep, BenchmarkStep } from '@/components/stepper';
import { useAccountStore } from '@/store/account';
import { useQuery } from '@tanstack/react-query';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import { createAccountData } from '@/utils/converter';
import { createBenchmarkData } from '@/utils/generator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSelectedAccountsStore } from '@/store/selectedAccounts';
import { initialDashboardData, useDashboardStore } from '@/store/dashboard';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    id: 'step-1',
    label: '데이터 가져오기',
    description: 'Import CSV',
  },
  {
    id: 'step-2',
    label: '계좌 조회일 설정',
    description: 'Account Date',
  },
  {
    id: 'step-3',
    label: '비교 지표 설정',
    description: 'Set Benchmark',
  },
];

const readFile = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일을 읽는 데 실패했습니다.'));
    reader.readAsText(file); // 파일을 텍스트로 읽음 (필요에 따라 readAsArrayBuffer 등 변경 가능)
  });
};

export default function Page() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const currentStep = steps[activeStep];
  const setupThemeStyle = {
    '--setup-primary': 'oklch(0.62 0.24 255)',
    '--setup-secondary': 'oklch(0.66 0.22 155)',
    '--setup-accent': 'oklch(0.78 0.16 82)',
    '--setup-danger': 'oklch(0.62 0.2 18)',
  } as CSSProperties;

  const router = useRouter();

  const setTotalAccountData = useAccountStore(
    (state) => state.setTotalAccountData
  );
  const setSelectedAccounts = useSelectedAccountsStore(
    (state) => state.setSelectedAccounts,
  );
  const setDashboardData = useDashboardStore((state) => state.setDashboardData);

  const {
    data: totalAccountData,
    refetch,
    isLoading,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ['accountData'],
    queryFn: async () => {
      const totalAccountData = await Promise.all(
        uploadedFiles.map(async (file) => {
          const fileContent = await readFile(file); // 파일 내용 읽기
          const shsecJson = shsecCsvToJson(fileContent); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
          const accountData = await createAccountData(transactions); // 거래내역을 계좌정보로 변환
          const benchmarkBestData = await createBenchmarkData(transactions, 'best');
          const benchmarkWorstData = await createBenchmarkData(
            transactions,
            'worst',
          );

          return {
            name: file.name,
            accountData,
            benchmarkBestData,
            benchmarkWorstData,
          };
        })
      );
      return totalAccountData;
    },
    enabled: false, // refetch를 이용해서 수동으로만 가져올 수 있도록 함
  });
  const isNextDisabled =
    isLoading || (activeStep === 0 && uploadedFiles.length === 0);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      refetch(); // 제출
    } else {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (step: number) => {
    // Only allow clicking on completed steps or the next available step
    if (step <= activeStep + 1) {
      setActiveStep(step);
    }
  };

  useEffect(() => {
    if (totalAccountData) {
      setDashboardData(initialDashboardData);
      setTotalAccountData(totalAccountData);
      setSelectedAccounts(totalAccountData.map((account) => account.name));
    }
  }, [
    setDashboardData,
    setSelectedAccounts,
    setTotalAccountData,
    totalAccountData,
  ]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('계좌 불러오기 성공', {
        description: '계좌 데이터를 성공적으로 불러왔습니다.',
      });
      router.push('/dashboard/settings?redirect=overview');
    }
    if (isError) {
      toast.error('계좌 불러오기 실패', {
        description: '계좌 데이터를 불러오는 데 실패했습니다.',
      });
    }
  }, [isSuccess, isError]);

  return (
    <div
      className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,oklch(0.94_0.05_250),oklch(0.96_0.04_160)_42%,oklch(0.96_0.04_82))] p-6'
      style={setupThemeStyle}
    >
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,oklch(0.62_0.24_255/0.22),transparent_28%),radial-gradient(circle_at_84%_18%,oklch(0.66_0.22_155/0.2),transparent_30%),radial-gradient(circle_at_70%_88%,oklch(0.78_0.16_82/0.18),transparent_32%),radial-gradient(circle_at_16%_88%,oklch(0.62_0.2_18/0.1),transparent_30%)]' />
      <Card className='relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/35 bg-white/[0.18] shadow-2xl shadow-black/10 backdrop-blur-2xl'>
        <div className='absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--setup-primary),var(--setup-secondary),var(--setup-accent),var(--setup-danger))]' />
        <CardHeader className='border-b border-white/25 bg-white/[0.06] px-8 py-7'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-[color:var(--setup-primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--setup-primary)] shadow-sm'>
                <CheckCircle2 className='h-3.5 w-3.5' />
                초기 설정
              </div>
              <CardTitle className='bg-[linear-gradient(90deg,var(--setup-primary),var(--setup-secondary),var(--setup-accent))] bg-clip-text text-3xl font-bold tracking-normal text-transparent'>
                대시보드 사전 설정
              </CardTitle>
              <CardDescription className='mt-2 text-sm leading-6 text-muted-foreground'>
                거래 데이터와 비교 기준을 설정하면 전체 계좌 기준으로 대시보드를
                계산합니다.
              </CardDescription>
            </div>
            <div className='rounded-xl border border-white/30 bg-white/[0.14] px-4 py-3 text-right shadow-sm backdrop-blur-md'>
              <p className='text-xs font-medium text-muted-foreground'>
                현재 단계
              </p>
              <p className='mt-1 text-sm font-bold text-[color:var(--setup-primary)]'>
                {activeStep + 1} / {steps.length} · {currentStep.label}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className='px-8 py-7'>
          <Stepper
            steps={steps}
            activeStep={activeStep}
            onStepClick={handleStepClick}
            className='mb-8'
          />

          <div className='min-h-[360px] rounded-2xl border border-white/25 bg-white/[0.1] p-6 shadow-inner shadow-black/5 backdrop-blur-md'>
            {activeStep === 0 && (
              <div className='space-y-5'>
                <div>
                  <h3 className='text-xl font-bold'>파일 불러오기</h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    신한투자증권 거래내역 CSV를 업로드합니다.
                  </p>
                </div>
                <CsvStep
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                />
              </div>
            )}

            {activeStep === 1 && (
              <div className='space-y-5'>
                <div>
                  <h3 className='text-xl font-bold'>조회할 날짜 선택</h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    선택한 날짜의 계좌 상태를 기준으로 대시보드를 조회합니다.
                  </p>
                </div>
                <DateStep />
              </div>
            )}

            {activeStep === 2 && (
              <div className='space-y-5'>
                <div>
                  <h3 className='text-xl font-bold'>벤치마크 설정</h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    포트폴리오 성과와 비교할 기준을 설정합니다.
                  </p>
                </div>
                <BenchmarkStep />
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className='flex items-center justify-between border-t border-white/25 bg-white/[0.05] px-8 py-5'>
          <Button
            variant='outline'
            onClick={handlePrevious}
            disabled={activeStep === 0}
            className='cursor-pointer rounded-xl border-white/30 bg-white/[0.14] text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/25 hover:text-foreground hover:shadow-md disabled:cursor-not-allowed'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={isNextDisabled}
            className={cn(
              'cursor-pointer rounded-xl bg-[color:var(--setup-primary)] px-5 font-semibold text-white shadow-md shadow-[color:var(--setup-primary)]/20 transition-all hover:-translate-y-0.5 hover:bg-[color:var(--setup-primary)]/90 hover:shadow-lg disabled:cursor-not-allowed',
              activeStep === steps.length - 1 && 'min-w-[132px]',
            )}
          >
            {activeStep === steps.length - 1
              ? isLoading
                ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      처리 중
                    </>
                  )
                : (
                    <>
                      완료
                      <CheckCircle2 className='ml-2 h-4 w-4' />
                    </>
                  )
              : (
                  <>
                    다음
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
          </Button>
        </CardFooter>
        {isLoading && (
          <div className='absolute inset-0 z-20 flex items-center justify-center bg-white/[0.18] backdrop-blur-md'>
            <div className='rounded-2xl border border-white/25 bg-white/[0.28] px-6 py-5 text-center shadow-xl backdrop-blur-xl'>
              <div className='mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--setup-primary)]/20 bg-[color:var(--setup-primary)]/10'>
                <Loader2 className='h-5 w-5 animate-spin text-[color:var(--setup-primary)]' />
              </div>
              <p className='mt-3 text-sm font-semibold text-foreground'>
                계좌 데이터를 계산하는 중입니다.
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                거래내역이 많으면 잠시 시간이 걸릴 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
