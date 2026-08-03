import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: '비밀번호 재설정',
  description: '자산 대시보드 계정의 비밀번호를 안전하게 재설정하세요.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm isRecoveryFlow={false} />;
}
