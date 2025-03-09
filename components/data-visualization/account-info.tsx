import { AccountProps } from '@/types';
import { useEffect } from 'react';

type AccountInfoProps = {
  accountData: AccountProps[];
};

export default function AccountInfo({ accountData }: AccountInfoProps) {
  useEffect(() => {
    console.log(accountData);
  }, [accountData]);

  return <>accountInfo</>;
}
