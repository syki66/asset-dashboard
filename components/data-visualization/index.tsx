'use client';

import { useEffect, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardControls } from './dashboard-controls';
import { DashboardSummary } from './dashboard-summary';
import { DashboardDetail } from './dashboard-detail';
import { Disclaimer } from './disclaimer';
import type { DateRange } from 'react-day-picker';
import { Currency, DashboardProps } from '@/types';
import { DEFAULT_FX_RATE } from '@/constants/keywords';
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
import CsvStep from './stepper/csv-step';
import BenchmarkStep from './stepper/benchmark-step';
import DateStep from './stepper/date-step';
import { useAccountStore } from '@/store/account';
import { useQuery } from '@tanstack/react-query';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import { createAccountData } from '@/utils/converter';
import { toast } from 'sonner';

const steps = [
  {
    id: 'step-1',
    label: '데이터 가져오기',
    description: 'Import CSV',
  },
  {
    id: 'step-2',
    label: '날짜 범위 설정',
    description: 'Date Range',
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

export default function DataVisualization() {
  const [currency, setCurrency] = useState<Currency>('krw');

  const [activeStep, setActiveStep] = useState(0);

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const setTotalAccountData = useAccountStore(
    (state) => state.setTotalAccountData
  );

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
          const accountData = await createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환
          return { name: file.name, accountData };
        })
      );

      return totalAccountData;
    },
    enabled: false, // refetch를 이용해서 수동으로만 가져올 수 있도록 함
  });

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
    console.log(dateRange);
    console.log(uploadedFiles);
  }, [dateRange]);

  useEffect(() => {
    if (totalAccountData) {
      setTotalAccountData(totalAccountData);
    }
  }, [totalAccountData, setTotalAccountData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success('계좌 불러오기 성공', {
        description: '계좌 데이터를 성공적으로 불러왔습니다.',
      });
    }
    if (isError) {
      toast.error('계좌 불러오기 실패', {
        description: '계좌 데이터를 불러오는 데 실패했습니다.',
      });
    }
  }, [isSuccess, isError]);

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>대시보드 사전 설정</CardTitle>
          <CardDescription>
            대시보드의 초기 설정을 진행합니다. 각 단계별로 필요한 정보를
            입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Stepper
            steps={steps}
            activeStep={activeStep}
            onStepClick={handleStepClick}
            className="mb-10"
          />

          <div className="mt-8 min-h-40">
            {activeStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <p className="text-muted-foreground">
                  Enter your personal details to get started with your
                  application.
                </p>
                {/* Form fields would go here */}
                {/* <div className="h-20 rounded-md border border-dashed border-muted-foreground/20 flex items-center justify-center text-sm text-muted-foreground">
                  Form fields for personal information
                </div> */}
                <CsvStep
                  uploadedFiles={uploadedFiles}
                  setUploadedFiles={setUploadedFiles}
                />
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <p className="text-muted-foreground">
                  Enter your personal details to get started with your
                  application.
                </p>
                <DateStep
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Confirmation</h3>
                <p className="text-muted-foreground">
                  Review your information and confirm your submission.
                </p>
                {/* Summary would go here */}
                <div className="h-20 rounded-md border border-dashed border-muted-foreground/20 flex items-center justify-center text-sm text-muted-foreground">
                  Summary of submitted information
                </div>
                <BenchmarkStep />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={activeStep === 0}
          >
            Previous
          </Button>
          <Button onClick={handleNext} disabled={isLoading}>
            {activeStep === steps.length - 1
              ? isLoading
                ? 'Loading...'
                : 'Submit'
              : 'Next'}
          </Button>
        </CardFooter>
      </Card>
      {/* <MainChart
        chartData={chartData}
        chartConfig={{
          evaluationAmount: {
            label: '평가금액',
            color: 'hsl(var(--chart-1))',
          },
          principalAmount: {
            label: '원금',
            color: 'hsl(var(--chart-2))',
          },
        }}
      /> */}
      {/* <AccountInfo accountData={mergedAccountData} /> */}

      <>
        <div className="container mx-auto py-8 px-4 relative">
          <h1 className="text-3xl font-bold mb-8">자산 대시보드</h1>

          <DashboardControls
            currency={currency}
            onCurrencyChange={setCurrency}
          />

          <div className="grid gap-8 dashboard-content">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
                <TabsTrigger value="summary">요약</TabsTrigger>
                <TabsTrigger value="detail">상세</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <DashboardSummary dateRange={dateRange} currency={currency} />
              </TabsContent>

              <TabsContent value="detail">
                <DashboardDetail dateRange={dateRange} currency={currency} />
              </TabsContent>
            </Tabs>

            <Disclaimer />
          </div>
        </div>
      </>
    </>
  );
}
