'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Currency } from '@/types';

interface StockChartsProps {
  currency: Currency;
}

export function StockCharts({ currency }: StockChartsProps) {
  const [activeTab, setActiveTab] = useState<'quantity' | 'price' | 'value'>(
    'quantity'
  );

  // 주식 데이터
  const stockData = [
    {
      name: '삼성전자',
      quantity: 100,
      avgPrice: 70000,
      currentPrice: 75000,
      purchaseAmount: 7000000,
      currentValue: 7500000,
    },
    {
      name: '현대차',
      quantity: 20,
      avgPrice: 180000,
      currentPrice: 210000,
      purchaseAmount: 3600000,
      currentValue: 4200000,
    },
    {
      name: 'NAVER',
      quantity: 10,
      avgPrice: 350000,
      currentPrice: 320000,
      purchaseAmount: 3500000,
      currentValue: 3200000,
    },
    {
      name: '카카오',
      quantity: 50,
      avgPrice: 80000,
      currentPrice: 85000,
      purchaseAmount: 4000000,
      currentValue: 4250000,
    },
    {
      name: 'LG화학',
      quantity: 5,
      avgPrice: 700000,
      currentPrice: 750000,
      purchaseAmount: 3500000,
      currentValue: 3750000,
    },
  ];

  // 통화 포맷팅 함수
  const formatCurrency = (value: number) => {
    if (currency === 'usd') {
      const usdValue = value / 1350;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(usdValue);
    } else {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(value);
    }
  };

  // 가격 비교 데이터 생성
  const priceComparisonData = stockData.map((stock) => ({
    name: stock.name,
    평균단가: stock.avgPrice,
    현재가: stock.currentPrice,
    차이: stock.currentPrice - stock.avgPrice,
  }));

  // 수량 데이터
  const quantityData = stockData.map((stock) => ({
    name: stock.name,
    수량: stock.quantity,
  }));

  // 가치 데이터
  const valueData = stockData.map((stock) => ({
    name: stock.name,
    매수금액: stock.purchaseAmount,
    평가금액: stock.currentValue,
    수익금: stock.currentValue - stock.purchaseAmount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>주식 차트 분석</CardTitle>
        <CardDescription>
          주식 보유 현황에 대한 다양한 차트 분석
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setActiveTab(v as 'quantity' | 'price' | 'value')
          }
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="quantity">보유 수량</TabsTrigger>
            <TabsTrigger value="price">가격 비교</TabsTrigger>
            <TabsTrigger value="value">가치 분석</TabsTrigger>
          </TabsList>

          {activeTab === 'quantity' && (
            <div className="h-[400px]">
              <BarChart
                width={800}
                height={400}
                data={quantityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="수량" fill="#8884d8" />
              </BarChart>
            </div>
          )}

          {activeTab === 'price' && (
            <div className="h-[400px]">
              <BarChart
                width={800}
                height={400}
                data={priceComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tickFormatter={(value) =>
                    currency === 'usd'
                      ? `$${(value / 1350).toLocaleString()}`
                      : `₩${value.toLocaleString()}`
                  }
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), '']}
                />
                <Legend />
                <Bar dataKey="평균단가" fill="#8884d8" />
                <Bar dataKey="현재가" fill="#82ca9d" />
              </BarChart>
            </div>
          )}

          {activeTab === 'value' && (
            <div className="h-[400px]">
              <BarChart
                width={800}
                height={400}
                data={valueData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tickFormatter={(value) =>
                    currency === 'usd'
                      ? `$${(value / 1350 / 1000000).toFixed(1)}M`
                      : `${(value / 1000000).toFixed(1)}백만`
                  }
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), '']}
                />
                <Legend />
                <Bar dataKey="매수금액" fill="#8884d8" />
                <Bar dataKey="평가금액" fill="#82ca9d" />
                <Bar
                  dataKey="수익금"
                  fill={(data, index) => {
                    const item = valueData[index];
                    return item.수익금 >= 0 ? '#ff6b6b' : '#4dabf7';
                  }}
                />
              </BarChart>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
