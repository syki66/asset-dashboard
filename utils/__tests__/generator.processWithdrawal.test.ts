import { describe, it, expect } from '@jest/globals';
import { TermsProps } from '@/types';
// processWithdrawal 함수는 generator.ts에서 import
import { processWithdrawal } from '../generator';

// processWithdrawal 함수 테스트
// - 출금액이 원금보다 작으면 원금만 차감
// - 출금액이 원금 초과 시 이자에서 차감
// - 출금액이 원금+이자 초과 시 상품 삭제
// - 여러 상품이 있을 때 만기일이 늦은 상품부터 차감

describe('processWithdrawal', () => {
  it('출금액이 원금보다 작으면 원금만 차감한다', () => {
    const terms: TermsProps[] = [
      {
        startDate: '2024-01-01',
        maturityDate: '2025-01-01',
        principal: 1000,
        interest: 100,
        interestRate: 2,
      },
    ];
    processWithdrawal(terms, 800);
    expect(terms[0].principal).toBe(200);
    expect(terms[0].interest).toBe(100);
  });

  it('출금액이 원금 초과 시 이자에서 차감한다', () => {
    const terms: TermsProps[] = [
      {
        startDate: '2024-01-01',
        maturityDate: '2025-01-01',
        principal: 500,
        interest: 200,
        interestRate: 2,
      },
    ];
    processWithdrawal(terms, 600);
    expect(terms[0].principal).toBe(0);
    expect(terms[0].interest).toBe(100);
  });

  it('만기일이 늦은 상품부터 차감한다.', () => {
    const terms: TermsProps[] = [
      {
        startDate: '2023-01-01',
        maturityDate: '2024-01-01',
        principal: 200,
        interest: 50,
        interestRate: 2,
      },
      {
        startDate: '2024-01-01',
        maturityDate: '2025-01-01',
        principal: 300,
        interest: 100,
        interestRate: 2,
      },
      {
        startDate: '2022-01-01',
        maturityDate: '2023-01-01',
        principal: 100,
        interest: 30,
        interestRate: 2,
      },
    ];
    processWithdrawal(terms, 770);
    expect(terms.length).toBe(1);
    expect(terms[0].principal).toBe(0);
    expect(terms[0].interest).toBe(10);
  });

  it('원금이 0인 상품이 있으면 해당 이자부터 소비하고 남은 금액은 다음 상품에 적용한다', () => {
    const terms: TermsProps[] = [
      {
        startDate: '2023-12-01',
        maturityDate: '2024-12-01',
        principal: 1000,
        interest: 100,
        interestRate: 2,
      },
      {
        startDate: '2024-01-01',
        maturityDate: '2025-01-01',
        principal: 0,
        interest: 200,
        interestRate: 2,
      },
    ];
    processWithdrawal(terms, 250);
    // 첫번째(이자만 있는) 상품이 먼저 소모되고 배열에서 제거
    expect(terms.length).toBe(1);
    expect(terms[0].principal).toBe(950);
    expect(terms[0].interest).toBe(100);
  });

  it('출금액이 원금+이자 초과 시 상품을 삭제한다', () => {
    const terms: TermsProps[] = [
      {
        startDate: '2024-01-01',
        maturityDate: '2025-01-01',
        principal: 300,
        interest: 100,
        interestRate: 2,
      },
    ];
    processWithdrawal(terms, 400);
    expect(terms.length).toBe(0);
  });

  it('이자 없이 원금만 있는 상품이 출금액보다 작을 때 해당 상품이 삭제되고 남은 출금액이 다음 상품에 적용된다', () => {
    const terms: TermsProps[] = [
      {
        startDate: '2024-02-01',
        maturityDate: '2025-02-01',
        principal: 200,
        interest: 0,
        interestRate: 2,
      },
      {
        startDate: '2024-01-01',
        maturityDate: '2025-01-01',
        principal: 300,
        interest: 100,
        interestRate: 2,
      },
    ];
    processWithdrawal(terms, 250);
    // 첫번째 상품이 삭제되고 남은 출금액이 다음 상품에 적용
    expect(terms.length).toBe(1);
    expect(terms[0].principal).toBe(250);
    expect(terms[0].interest).toBe(100);
  });
});
