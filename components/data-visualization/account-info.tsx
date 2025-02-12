import { AccountProps } from '@/types';
import { getStockInfo } from '@/utils/converter';
import { useEffect } from 'react';

type AccountInfoProps = {
  accountData: AccountProps[];
};

export default function AccountInfo({ accountData }: AccountInfoProps) {
  useEffect(() => {}, [accountData]);

  return <>accountInfo</>;
}
