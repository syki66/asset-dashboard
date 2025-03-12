'use client';

import type React from 'react';

import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  Check,
  FileUp,
  Upload,
  X,
  CalendarRange,
  DollarSign,
  AwardIcon as Won,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/data-visualization/date-range-picker';
import { useQuery } from '@tanstack/react-query';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import {
  convertToDashboardData,
  createAccountData,
  mergeAccountData,
} from '@/utils/converter';
import { AccountProps, Currency, DashboardProps } from '@/types';

// 샘플 계좌 데이터 위에 환율 상수 추가
const EXCHANGE_RATE = 1350; // 1 USD = 1,350 KRW (예시 환율)

// 샘플 계좌 데이터
const accounts = [
  { id: '1', name: '증권계좌 A', balance: 25000000 },
  { id: '2', name: '증권계좌 B', balance: 15000000 },
  { id: '3', name: '은행계좌', balance: 10000000 },
  { id: '4', name: '연금계좌', balance: 7500000 },
];

const readFile = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일을 읽는 데 실패했습니다.'));
    reader.readAsText(file); // 파일을 텍스트로 읽음 (필요에 따라 readAsArrayBuffer 등 변경 가능)
  });
};

interface DashboardControlsProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  onDashboardDataChange: (dashboardData: DashboardProps[]) => void;
}

export function DashboardControls({
  dateRange,
  onDateRangeChange,
  currency,
  onCurrencyChange,
  onDashboardDataChange,
}: DashboardControlsProps) {
  const [isPostTax, setIsPostTax] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

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

  const handleAccountToggle = (accountName: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountName)
        ? prev.filter((name) => name !== accountName)
        : [...prev, accountName]
    );
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccounts.length === totalAccountData?.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(totalAccountData?.map((acc) => acc.name) || []);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // 파일 확장자 검증 (CSV, XLSX만 허용)
    const validFiles = files.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'csv' || ext === 'xlsx';
    });

    if (validFiles.length !== files.length) {
      toast.error('파일 형식 오류', {
        description: '신한투자증권의 CSV 파일만 업로드 가능합니다.',
      });
      // toast.error('파일 형식 오류: CSV 또는 XLSX 파일만 업로드 가능합니다.');
    }

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success('파일 업로드 성공', {
        description: `${validFiles.length}개의 파일이 업로드되었습니다.`,
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSubmit = () => {
    refetch();
  };

  // totalAccountData와 선택된 체크박스에 따라 병합된 데이터를 메모이제이션
  const mergedAccountData = useMemo(() => {
    if (!totalAccountData) return [];

    const filteredData =
      selectedAccounts.length > 0
        ? totalAccountData.filter((data) =>
            selectedAccounts.includes(data.name)
          )
        : [];
    return mergeAccountData(filteredData);
  }, [totalAccountData, selectedAccounts]);

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

  // 계좌 데이터가 변경될 때마다 부모 컴포넌트로 데이터 전달
  useEffect(() => {
    const dashboardData = convertToDashboardData(mergedAccountData, currency);
    onDashboardDataChange(dashboardData);
  }, [mergedAccountData, currency]);

  return (
    <div className="relative mb-8">
      <Card className="relative z-10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>대시보드 설정</CardTitle>
            <CardDescription>
              데이터 표시 방식과 계좌 설정을 관리합니다
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">{isExpanded ? '접기' : '펼치기'}</span>
          </Button>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings">기본 설정</TabsTrigger>
                <TabsTrigger value="date">날짜 범위</TabsTrigger>
                <TabsTrigger value="import">데이터 가져오기</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-6">
                {/* 세금 설정과 통화 설정을 가로로 배치 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">세금 설정</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tax-mode"
                        checked={isPostTax}
                        onCheckedChange={setIsPostTax}
                      />
                      <Label htmlFor="tax-mode">
                        {isPostTax ? '세후 금액 표시' : '세전 금액 표시'}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPostTax
                        ? '모든 금액은 세금이 공제된 후의 금액으로 표시됩니다.'
                        : '모든 금액은 세금이 공제되기 전의 금액으로 표시됩니다.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">통화 설정</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="currency-mode"
                        checked={currency === 'usd'}
                        onCheckedChange={(checked) =>
                          onCurrencyChange(checked ? 'usd' : 'krw')
                        }
                      />
                      <Label
                        htmlFor="currency-mode"
                        className="flex items-center"
                      >
                        {currency === 'usd' ? (
                          <>
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>달러 (USD) 표시</span>
                          </>
                        ) : (
                          <>
                            <Won className="h-4 w-4 mr-1" />
                            <span>원화 (KRW) 표시</span>
                          </>
                        )}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currency === 'usd'
                        ? `모든 금액은 달러(USD)로 표시됩니다. 적용 환율: 1 USD = ${EXCHANGE_RATE.toLocaleString()} KRW`
                        : '모든 금액은 원화(KRW)로 표시됩니다.'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">계좌 선택</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={
                          selectedAccounts.length === totalAccountData?.length
                        }
                        onCheckedChange={handleSelectAllAccounts}
                      />
                      <Label htmlFor="select-all" className="text-sm">
                        전체 선택
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {totalAccountData?.map((account) => (
                      <div
                        key={account.name}
                        className="flex items-center justify-between border p-3 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`account-${account.name}`}
                            checked={selectedAccounts.includes(account.name)}
                            onCheckedChange={() =>
                              handleAccountToggle(account.name)
                            }
                          />
                          <Label htmlFor={`account-${account.name}`}>
                            {account.name}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    선택한 계좌의 데이터만 대시보드에 표시됩니다.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="date" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">날짜 범위 설정</h3>
                  <p className="text-sm text-muted-foreground">
                    대시보드에 표시할 데이터의 날짜 범위를 선택하세요. 이 설정은
                    모든 차트와 데이터에 적용됩니다.
                  </p>

                  <div className="mt-4">
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={onDateRangeChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        onDateRangeChange({
                          from: addDays(today, -30),
                          to: today,
                        });
                      }}
                    >
                      최근 1개월
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        onDateRangeChange({
                          from: addDays(today, -90),
                          to: today,
                        });
                      }}
                    >
                      최근 3개월
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        onDateRangeChange({
                          from: addDays(today, -180),
                          to: today,
                        });
                      }}
                    >
                      최근 6개월
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        onDateRangeChange({
                          from: addDays(today, -365),
                          to: today,
                        });
                      }}
                    >
                      최근 1년
                    </Button>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onDateRangeChange(undefined);
                      }}
                    >
                      날짜 범위 초기화
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      날짜 범위를 초기화하면 모든 데이터가 표시됩니다.
                    </p>
                  </div>

                  {dateRange?.from && dateRange?.to && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      <div className="flex items-center">
                        <CalendarRange className="h-5 w-5 mr-2 text-primary" />
                        <span className="font-medium">
                          현재 선택된 날짜 범위:
                        </span>
                      </div>
                      <p className="mt-1">
                        {format(dateRange.from, 'yyyy년 MM월 dd일')} -{' '}
                        {format(dateRange.to, 'yyyy년 MM월 dd일')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="import" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">데이터 가져오기</h3>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-semibold">
                      파일을 끌어다 놓거나 클릭하여 업로드
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      신한투자증권의 CSV 파일만 지원됩니다
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={handleFileChange}
                      multiple
                    />
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() =>
                        document.getElementById('file-upload')?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      파일 선택
                    </Button>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium">업로드된 파일</h4>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted p-2 rounded-md"
                        >
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-end mt-2">
                        <Button onClick={handleFileSubmit} disabled={isLoading}>
                          {isLoading ? '가져오는중' : '계좌 불러오기'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
