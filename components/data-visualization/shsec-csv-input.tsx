import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/adapter';
import { formatJsonForGraph, createAccountData } from '@/utils/converter';
import { ChangeEvent } from 'react';

export default function CsvInput({ setChartData }) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const shsecJson = shsecCsvToJson(text); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
          const accountData = createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환
          const graphData = formatJsonForGraph(transactions); // 정제된 거래내역을 그래프용 데이터로 변환

          console.log(accountData);
          setChartData(graphData);
        }
      };
      reader.readAsText(file);
    } else {
      console.log('Please upload a valid CSV file.');
    }
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">import CSV File</Label>
      <Input
        id="picture"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
    </div>
  );
}
