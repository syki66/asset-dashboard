'use client';

import { useEffect, useState } from 'react';
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
  const [selectedValues, setSelectedValues] = useState<string[]>([]); // 계좌 체크박스 선택 값들

  const options = [
    { id: 'option1', label: 'Option 1' },
    { id: 'option2', label: 'Option 2' },
    { id: 'option3', label: 'Option 3' },
    { id: 'option4', label: 'Option 4' },
  ];

  const { data: accountData, refetch } = useQuery({
    queryKey: ['accountData'],
    queryFn: async () => {
      if (files.length === 0) return Promise.reject('No files selected');

      const allAccountData = await Promise.all(
        files.map(async (file) => {
          const fileContent = await readFile(file); // 파일 내용 읽기
          const shsecJson = shsecCsvToJson(fileContent); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
          const accountData = await createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환
          return { name: file.name, accountData };
        })
      );

      return allAccountData;
    },
    enabled: files.length > 0, // 파일이 없을 때 실행 방지
  });
  const handleCheckboxChange = (values: string[]) => {
    setSelectedValues(values);
    console.log('Selected values:', values);
  };

  useEffect(() => {
    if (accountData) {
      console.log(accountData);
      const test = mergeAccountData(accountData);
      console.log(test);
    }
  }, [accountData]);

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
            options={options}
            onChange={handleCheckboxChange}
            defaultSelected={['option1']}
          />

          <div className="mt-6 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Selected Values:</h3>
            {selectedValues.length > 0 ? (
              <ul className="list-disc pl-5">
                {selectedValues.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            ) : (
              <p>No options selected</p>
            )}
          </div>
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
