'use client';

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ComparisonData = {
  metric: string;
  investment: string;
  benchmark: string;
};

export type ComparisonTableProps = {
  comparisonData: ComparisonData[];
  themeColor?: string;
  title?: string;
  icon?: React.ReactNode;
};

export function ComparisonTable({
  comparisonData,
  themeColor = "var(--overview-theme)",
  title = "벤치마크 비교",
  icon,
}: ComparisonTableProps) {
  // Derive the hover background color variable from the theme color variable
  const hoverBgVar = themeColor.replace("-theme)", "-hover-bg)");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-1/3">지표</TableHead>
              <TableHead
                style={{ color: themeColor }}
                className="w-1/3 text-right"
              >
                내 포트폴리오
              </TableHead>
              <TableHead className="w-1/3 text-right">벤치마크</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            style={{ "--row-hover-bg": hoverBgVar } as React.CSSProperties}
          >
            {comparisonData.map((data) => (
              <TableRow
                key={data.metric}
                className="transition-colors hover:bg-[var(--row-hover-bg)]"
              >
                <TableCell>{data.metric}</TableCell>
                <TableCell style={{ color: themeColor }} className="text-right">
                  {data.investment}
                </TableCell>
                <TableCell className="text-right">{data.benchmark}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
