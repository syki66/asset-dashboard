'use client';

import type React from 'react';
import { useMemo } from 'react';
import {
  Wallet,
  Calendar,
  Coins,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAccountStore } from '@/store/account';
import { useSelectedAccountsStore } from '@/store/selectedAccounts';
import { formatCurrency, formatDateKr, timeAgo } from '@/utils/format';
import { cn } from '@/lib/utils';

export default function Page() {
  const themeColor = 'var(--settings-theme)';
  const totalAccountData = useAccountStore((state) => state.totalAccountData);
  const { selectedAccounts, setSelectedAccounts } = useSelectedAccountsStore();

  const handleAccountToggle = (accountName: string) => {
    setSelectedAccounts(
      selectedAccounts.includes(accountName)
        ? selectedAccounts.filter((name) => name !== accountName)
        : [...selectedAccounts, accountName],
    );
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccounts.length === totalAccountData?.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(totalAccountData?.map((acc) => acc.name) || []);
    }
  };

  // Convert account list into formatted stats cards
  const accountCards = useMemo(() => {
    if (!totalAccountData) return [];

    return totalAccountData.map((account) => {
      const { name, accountData } = account;
      const latestRecord =
        accountData && accountData.length > 0 ? accountData.at(-1) : null;

      const krwPrincipal = latestRecord?.krw?.principalAmount || 0;
      const usdPrincipal = latestRecord?.usd?.principalAmount || 0;
      const krwCash = latestRecord?.krw?.cash || 0;
      const usdCash = latestRecord?.usd?.cash || 0;
      const krwStocks = latestRecord?.krw?.stocks || [];
      const usdStocks = latestRecord?.usd?.stocks || [];

      // Total holdings count
      const totalStocksCount = krwStocks.length + usdStocks.length;

      // Top holdings sample
      const stockSnippets = [
        ...krwStocks.map((s) => s.shortName || s.symbol),
        ...usdStocks.map((s) => s.symbol || s.shortName),
      ].slice(0, 3);

      // Range period
      const startDate = accountData[0]?.date
        ? formatDateKr(accountData[0].date)
        : '-';
      const endDate = latestRecord?.date
        ? formatDateKr(latestRecord.date)
        : '-';

      const lastUpdated = latestRecord?.lastUpdated || latestRecord?.date || '';

      return {
        name,
        krwPrincipal,
        usdPrincipal,
        krwCash,
        usdCash,
        totalStocksCount,
        stockSnippets,
        startDate,
        endDate,
        lastUpdated,
      };
    });
  }, [totalAccountData]);

  return (
    <div className='relative mb-8'>
      <Card className='relative z-10 border border-white/10 bg-card/30 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden'>
        <CardHeader className='pb-4 border-b border-white/5'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CardTitle className='text-2xl font-bold text-foreground flex items-center gap-2'>
                <Sparkles className='h-5 w-5' style={{ color: themeColor }} />{' '}
                대시보드 설정
              </CardTitle>
              <CardDescription className='text-muted-foreground mt-1'>
                대시보드에 표시할 계좌를 선택해주세요. 선택된 계좌들은 합산해서
                표시되며, 데이터가 많으면 반영까지 시간이 걸릴 수 있습니다.
              </CardDescription>
            </div>

            <div className='flex items-center gap-4'>
              <div className='text-xs font-semibold text-muted-foreground'>
                선택됨:{' '}
                <span className='font-bold' style={{ color: themeColor }}>
                  {selectedAccounts.length}
                </span>{' '}
                / {totalAccountData?.length || 0}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleSelectAllAccounts}
                className='h-8 cursor-pointer rounded-lg border-white/10 text-xs font-semibold shadow-sm transition-all hover:bg-white/10 hover:text-foreground'
              >
                {selectedAccounts.length === totalAccountData?.length
                  ? '전체 선택 해제'
                  : '전체 선택'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6'>
          {accountCards.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm'>
              <div className='p-4 rounded-full bg-white/5 text-muted-foreground mb-4 border border-white/10'>
                <FolderOpen className='h-8 w-8' />
              </div>
              <h3 className='text-lg font-bold text-foreground mb-1'>
                연동된 계좌 정보가 없습니다
              </h3>
              <p className='text-sm text-muted-foreground max-w-sm'>
                대시보드를 활성화하기 위해 먼저 메인 화면에서 거래 내역 또는
                계좌 데이터를 업로드해 주세요.
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* selection UI moved to header */}

              {/* Account Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {accountCards.map((card) => {
                  const isSelected = selectedAccounts.includes(card.name);
                  return (
                    <div
                      key={card.name}
                      onClick={() => handleAccountToggle(card.name)}
                      className={cn(
                        'group relative cursor-pointer overflow-hidden rounded-2xl border bg-card/30 backdrop-blur-md p-6 shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between min-h-[220px]',
                        isSelected
                          ? 'border-[color:var(--settings-theme)]/50 bg-[color:var(--settings-theme)]/5 shadow-[color:var(--settings-theme)]/10'
                          : 'border-white/10 hover:border-white/20 hover:bg-card/50',
                      )}
                    >
                      <div>
                        {/* Card Header Info */}
                        <div className='flex items-center gap-3 mb-4'>
                          <div
                            className={cn(
                              'relative p-2.5 rounded-xl border transition-colors',
                              isSelected
                                ? 'border-[color:var(--settings-theme)]/20 bg-[color:var(--settings-theme)]/10 text-[color:var(--settings-theme)]'
                                : 'bg-white/5 border-white/10 text-muted-foreground',
                            )}
                          >
                            <Wallet className='h-4 w-4' />
                            {isSelected && (
                              <span
                                className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white shadow-sm'
                                style={{ backgroundColor: themeColor }}
                              >
                                <CheckCircle2 className='h-3 w-3 stroke-[3]' />
                              </span>
                            )}
                          </div>

                          <div className='flex min-w-0 flex-1 items-center justify-between gap-2'>
                            <h3 className='font-bold text-base text-foreground group-hover:text-primary transition-colors break-all'>
                              {card.name.replace(/\.csv$/i, '')}
                            </h3>
                            <span className='shrink-0 rounded-full border border-blue-300/40 bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-blue-500/30'>
                              신한투자증권
                            </span>
                          </div>
                        </div>

                        {/* Stats block */}
                        <div className='my-4 rounded-xl border border-white/20 bg-white/[0.075] p-3.5 text-sm shadow-lg shadow-black/10 backdrop-blur-xl ring-1 ring-white/5'>
                          <div className='space-y-2'>
                          {/* Principal row */}
                          {(card.krwPrincipal > 0 || card.usdPrincipal > 0) && (
                            <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-2 shadow-sm shadow-black/5 backdrop-blur-md'>
                              <span className='text-muted-foreground text-xs flex items-center gap-1.5'>
                                <TrendingUp className='h-3.5 w-3.5 text-muted-foreground/75' />{' '}
                                원금
                              </span>
                              <div className='text-right font-medium text-foreground text-xs'>
                                {card.krwPrincipal > 0 && (
                                  <div>
                                    {formatCurrency(card.krwPrincipal, 'krw')}
                                  </div>
                                )}
                                {card.usdPrincipal > 0 && (
                                  <div className='text-[11px] text-muted-foreground mt-0.5'>
                                    {formatCurrency(card.usdPrincipal, 'usd')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cash balance row */}
                          {(card.krwCash > 0 || card.usdCash > 0) && (
                            <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-2 shadow-sm shadow-black/5 backdrop-blur-md'>
                              <span className='text-muted-foreground text-xs flex items-center gap-1.5'>
                                <Coins className='h-3.5 w-3.5 text-muted-foreground/75' />{' '}
                                예수금
                              </span>
                              <div className='text-right font-medium text-foreground text-xs'>
                                {card.krwCash > 0 && (
                                  <div>
                                    {formatCurrency(card.krwCash, 'krw')}
                                  </div>
                                )}
                                {card.usdCash > 0 && (
                                  <div className='text-[11px] text-muted-foreground mt-0.5'>
                                    {formatCurrency(card.usdCash, 'usd')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stocks holdings count row */}
                          <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.055] px-2.5 py-2 shadow-sm shadow-black/5 backdrop-blur-md'>
                            <span className='text-muted-foreground text-xs flex items-center gap-1.5'>
                              <BarChart3 className='h-3.5 w-3.5 text-muted-foreground/75' />{' '}
                              보유 종목
                            </span>
                            <span className='font-semibold text-foreground text-xs flex items-center gap-1.5'>
                              {card.totalStocksCount > 0 ? (
                                card.totalStocksCount > 3 ? (
                                  <span>{card.totalStocksCount}개</span>
                                ) : (
                                  <div className='flex items-center gap-1'>
                                    {card.stockSnippets.map((s, idx) => (
                                      <span
                                        key={s + idx}
                                        className='rounded-md border border-white/15 bg-white/[0.09] px-1.5 py-0.5 text-[10px] font-semibold text-foreground/80 shadow-sm shadow-black/10 backdrop-blur-md ring-1 ring-white/5'
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )
                              ) : (
                                <span className='text-xs text-muted-foreground font-normal'>
                                  보유 주식 없음
                                </span>
                              )}
                            </span>
                          </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer timestamps */}
                      <div className='mt-auto rounded-xl border border-white/20 bg-white/[0.075] p-3.5 text-[10px] text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-xl ring-1 ring-white/5'>
                        <div className='space-y-1.5'>
                        <div className='flex items-center gap-1.5'>
                          <Calendar className='h-3 w-3 text-muted-foreground/50' />
                          <span>
                            {card.startDate} ~ {card.endDate}
                          </span>
                        </div>
                        {card.lastUpdated && (
                          <div className='flex items-center gap-1.5'>
                            <Clock className='h-3 w-3 text-muted-foreground/50' />
                            <span>
                              최근 업로드: {timeAgo(card.lastUpdated)}
                            </span>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
