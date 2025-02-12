'use client';

import { useEffect, useState } from 'react';
import { MainChart } from './main-chart';
import { AccountProps } from '@/types';
import AccountInfo from './account-info';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import { createAccountData, getStockInfo } from '@/utils/converter';
import { ChangeEvent } from 'react';

export default function DataVisualization() {
  const [accountData, setAccountData] = useState<AccountProps[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const shsecJson = shsecCsvToJson(text); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
          const accountData = createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환

          // api 호출용 날짜 범위 추출
          const startDate = accountData[0]?.date;
          const endDate = accountData[accountData.length - 1]?.date;

          // 주식 종목 코드 데이터 가져오기 (중복제거 및 빈값 제거)
          const stockCodes = [
            ...new Set(transactions.map((transaction) => transaction.ISIN)),
          ].filter((code) => code !== '');

          const { stockData, currencyData, stockKrDict } = await getStockInfo(
            startDate,
            endDate,
            stockCodes
          ); // api 데이터 가져오기

          console.log(stockData, currencyData, stockKrDict);
          setAccountData(accountData);
        }
      };
      reader.readAsText(file);
    } else {
      console.log('Please upload a valid CSV file.');
    }
  };

  const init = async () => {};

  useEffect(() => {
    init();
  }, [accountData]);

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="picture">import CSV File</Label>
        <Input
          id="picture"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
      </div>
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
