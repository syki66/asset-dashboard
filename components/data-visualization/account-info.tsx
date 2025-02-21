import { AccountProps } from '@/types';
import { useEffect } from 'react';

type AccountInfoProps = {
  accountData: AccountProps[];
};

export default function AccountInfo({ accountData }: AccountInfoProps) {
  useEffect(() => {}, [accountData]);

  return <>accountInfo</>;
}
