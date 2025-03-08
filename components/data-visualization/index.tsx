'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MainChart } from './main-chart';
import { AccountProps } from '@/types';
import AccountInfo from './account-info';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import { createAccountData, mergeAccountData } from '@/utils/converter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import CheckboxGroup from './checkbox-group';

const readFile = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일을 읽는 데 실패했습니다.'));
    reader.readAsText(file); // 파일을 텍스트로 읽음 (필요에 따라 readAsArrayBuffer 등 변경 가능)
  });
};

export default function DataVisualization() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedCheckboxValues, setSelectedCheckboxValues] = useState<
    string[]
  >([]);

  const {
    data: totalAccountData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['accountData', files],
    queryFn: async () => {
      if (files.length === 0) return Promise.reject('No files selected');

      const totalAccountData = await Promise.all(
        files.map(async (file) => {
          const fileContent = await readFile(file); // 파일 내용 읽기
          const shsecJson = shsecCsvToJson(fileContent); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
          const accountData = await createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환
          return { name: file.name, accountData };
        })
      );

      return totalAccountData;
    },
    enabled: files.length > 0, // 파일이 없을 때 실행 방지
  });

  // totalAccountData와 선택된 체크박스에 따라 합산된 데이터를 메모이제이션
  const mergedAccountData = useMemo(() => {
    if (!totalAccountData) return [];
    // 체크박스가 비어있으면 전체 데이터 사용
    const filteredData =
      selectedCheckboxValues.length > 0
        ? totalAccountData.filter((data) =>
            selectedCheckboxValues.includes(data.name)
          )
        : totalAccountData;
    return mergeAccountData(filteredData);
  }, [totalAccountData, selectedCheckboxValues]);

  // 체크박스 변경시 선택된 값 업데이트
  const handleCheckboxChange = useCallback((values: string[]) => {
    setSelectedCheckboxValues(values);
  }, []);

  useEffect(() => {
    // mergedAccountData가 변경될 때 로그 출력 혹은 다른 작업 수행
    console.log(mergedAccountData);
  }, [mergedAccountData]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="picture">import CSV Files</Label>
        <Input
          id="picture"
          type="file"
          accept=".csv"
          multiple
          onChange={(e) => {
            if (e.target.files) {
              setFiles(Array.from(e.target.files)); // 파일 선택
              refetch(); // 파일 선택 시 query 재실행
            }
          }}
        />
      </div>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Checkbox Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup
            options={
              totalAccountData?.map((data) => ({
                id: data.name,
                label: data.name,
              })) ?? []
            }
            onChange={handleCheckboxChange}
            allCheckedByDefault={true}
          />
        </CardContent>
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
      <AccountInfo accountData={accountData} />
    </>
  );
}
