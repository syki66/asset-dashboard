import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: '새 비밀번호 설정',
  description: '자산 대시보드 계정에 사용할 새 비밀번호를 설정하세요.',
  robots: { index: false, follow: false },
};

export default function PasswordRecoveryPage() {
  return <ResetPasswordForm isRecoveryFlow />;
}
