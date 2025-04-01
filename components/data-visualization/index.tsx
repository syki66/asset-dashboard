'use client';

import { useState } from 'react';

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

const defaultDashboardData: DashboardProps = {
  date: '1970-01-01',
  lastUpdated: '1970-01-01',
  fxRate: DEFAULT_FX_RATE,
  currentValue: 0,
  principal: 0,
  profit: 0,
  returnRate: 0,
  totalTaxFee: 0,
  dividends: 0,
  yieldOnCost: 0,
  dividendYield: 0,
  cash: 0,
  usdCash: 0,
  krwCash: 0,
  maxDrawdown: 0,
  maxDrawdownPeriod: '1970-01-01 ~ 1970-01-01',
  maxDailyDrawdown: 0,
  maxDailyDrawdownDate: '1970-01-01',
};

export default function DataVisualization() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currency, setCurrency] = useState<Currency>('krw');
  const [selectedDashboardData, setSelectedDashboardData] =
    useState<DashboardProps>(defaultDashboardData);

  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
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

  const handleDashboardDataChange = (dashboardData: DashboardProps[]) => {
    setSelectedDashboardData(dashboardData.at(-1) || defaultDashboardData); // 선택된 날짜에 맞는 데이터 넣으면 됨
  };

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
                <div className="h-20 rounded-md border border-dashed border-muted-foreground/20 flex items-center justify-center text-sm text-muted-foreground">
                  Form fields for personal information
                </div>
                <CsvStep />
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Setup</h3>
                <p className="text-muted-foreground">
                  Create your account credentials and preferences.
                </p>
                {/* Form fields would go here */}
                <div className="h-20 rounded-md border border-dashed border-muted-foreground/20 flex items-center justify-center text-sm text-muted-foreground">
                  Form fields for account setup
                </div>
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
          <Button
            onClick={handleNext}
            disabled={activeStep === steps.length - 1}
          >
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
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
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            currency={currency}
            onCurrencyChange={setCurrency}
            onDashboardDataChange={handleDashboardDataChange}
          />

          <div className="grid gap-8 dashboard-content">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
                <TabsTrigger value="summary">요약</TabsTrigger>
                <TabsTrigger value="detail">상세</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <DashboardSummary
                  dateRange={dateRange}
                  currency={currency}
                  data={selectedDashboardData}
                />
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
