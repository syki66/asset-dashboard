import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Check,
  CloudDownload,
  CloudUpload,
  FileUp,
  Upload,
  X,
  FilePlus,
  ShieldCheck,
  Sparkles,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { isShsecTransactionCsv } from '@/utils/shsec-adapter';
import { useAuth } from '@/components/auth/auth-provider';
import { decryptCsvFiles, encryptCsvFiles } from '@/lib/asset-data-crypto';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface CsvStepProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  // 데모 진입 시 더미 CSV 버튼에 스포트라이트 안내를 표시합니다.
  showDemoPrompt?: boolean;
  // admin 모드에서만 Supabase 암호화 저장 영역을 노출합니다.
  showSecureStorage?: boolean;
}

// 데모 스포트라이트 구멍을 실제 버튼과 같은 위치와 모양으로 그리기 위한 값입니다.
type SpotlightRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
  viewportWidth: number;
  viewportHeight: number;
};

type FileHandlingOptions = {
  // 복호화 파일은 기존 목록에 추가하지 않고 전체를 교체합니다.
  replace?: boolean;
  showSuccessToast?: boolean;
};

type SecureAction = 'save' | 'load' | 'sign-out';

export function CsvStep({
  uploadedFiles,
  setUploadedFiles,
  showDemoPrompt = false,
  showSecureStorage = false,
}: CsvStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  // 암호는 서버나 브라우저 저장소에 보관하지 않고 현재 화면의 메모리에만 유지합니다.
  const [encryptionPassword, setEncryptionPassword] = useState('');
  // 저장·불러오기·로그아웃 중 중복 요청과 버튼 입력을 막습니다.
  const [secureAction, setSecureAction] = useState<SecureAction>();
  // 아래 상태와 ref는 데모 스포트라이트가 실제 버튼을 따라가도록 사용합니다.
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect>();
  const dummyButtonRef = useRef<HTMLButtonElement>(null);
  const dummyCsvFileNames = ['dummy-3y.csv', 'dummy-5y.csv', 'dummy-10y.csv'];
  const showDemoSpotlight = showDemoPrompt && uploadedFiles.length === 0;
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isConfigured } = useAuth();

  // 데모에서는 실제 버튼의 위치와 곡률을 측정해 버튼만 드러나는 안내 영역을 만듭니다.
  useEffect(() => {
    if (!showDemoSpotlight) {
      setSpotlightRect(undefined);
      return;
    }

    const updateSpotlight = () => {
      const button = dummyButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const borderRadius = Number.parseFloat(
        window.getComputedStyle(button).borderTopLeftRadius,
      );
      const effectiveBorderRadius = Number.isFinite(borderRadius)
        ? Math.min(borderRadius, rect.width / 2, rect.height / 2)
        : 0;

      setSpotlightRect({
        top: Math.max(0, rect.top),
        right: Math.min(window.innerWidth, rect.right),
        bottom: Math.min(window.innerHeight, rect.bottom),
        left: Math.max(0, rect.left),
        width: rect.width,
        height: rect.height,
        borderRadius: effectiveBorderRadius,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
      document.body.style.overflow = '';
    };
  }, [showDemoSpotlight]);

  // 체험용 더미 CSV 데이터 불러오기 (순차적으로)
  const loadDummyCsv = async () => {
    const fileName = dummyCsvFileNames.find(
      (name) => !uploadedFiles.some((file) => file.name === name),
    );

    if (!fileName) {
      toast.error('더 이상 불러올 CSV가 없습니다.');
      return;
    }
    try {
      const res = await fetch(`/${fileName}`); // public 폴더에 있는 csv 파일 불러오기
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'text/csv' });
      await handleFiles([file]);
    } catch {
      toast.error('더미 CSV 로드 실패');
    }
  };

  // 로컬 선택, 더미 데이터, Supabase 복호화 파일이 모두 이 검증 흐름을 사용합니다.
  const handleFiles = async (
    files: File[],
    {
      replace = false,
      showSuccessToast = true,
    }: FileHandlingOptions = {},
  ) => {
    // 실제 파서는 CSV만 읽으므로 확장자 단계에서 먼저 걸러냅니다.
    const csvFiles = files.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'csv';
    });

    if (csvFiles.length !== files.length) {
      const unsupportedFileNames = files
        .filter((file) => !csvFiles.includes(file))
        .map((file) => file.name)
        .join(', ');

      toast.error('파일 형식 오류', {
        description: unsupportedFileNames,
      });
    }

    // 파일을 업로드 목록에 넣기 전에 신한 거래내역의 헤더와 필수 컬럼을 검증합니다.
    const results = await Promise.all(
      csvFiles.map(async (file) => ({
        file,
        isSupported: isShsecTransactionCsv(await file.text()),
      })),
    );
    const validFiles = results
      .filter(({ isSupported }) => isSupported)
      .map(({ file }) => file);

    if (validFiles.length !== csvFiles.length) {
      const unsupportedFileNames = results
        .filter(({ isSupported }) => !isSupported)
        .map(({ file }) => file.name)
        .join(', ');

      toast.error('지원하지 않는 CSV 형식', {
        description: unsupportedFileNames,
      });
    }

    if (
      validFiles.length > 0 &&
      (!replace || validFiles.length === files.length)
    ) {
      // 복호화 데이터는 일부 파일만 반영하지 않고 전부 유효할 때 한 번에 교체합니다.
      setUploadedFiles((prev) =>
        replace ? validFiles : [...prev, ...validFiles],
      );
      if (showSuccessToast) {
        toast.success('파일 업로드 성공', {
          description: `${validFiles.length}개의 파일이 업로드되었습니다.`,
        });
      }
    }

    return validFiles.length;
  };

  // Drag & Drop 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // 업로드 취소
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const requireEncryptionPassword = () => {
    if (!encryptionPassword) {
      toast.error('암호화 비밀번호를 입력해 주세요.');
      return false;
    }

    return true;
  };

  // 현재 CSV 묶음을 gzip 압축·AES-GCM 암호화한 뒤 사용자별 한 행으로 upsert합니다.
  const saveEncryptedCsv = async () => {
    if (!user) {
      router.push('/login?next=%2Fsetup%3Fmode%3Dadmin');
      return;
    }
    if (uploadedFiles.length === 0) {
      toast.error('저장할 CSV 파일이 없습니다.');
      return;
    }
    if (!requireEncryptionPassword()) return;

    setSecureAction('save');

    try {
      const encryptedPayload = await encryptCsvFiles(
        uploadedFiles,
        encryptionPassword,
        user.id,
      );
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from('asset_data').upsert(
        {
          user_id: user.id,
          encrypted_payload: encryptedPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      if (error) throw error;

      setEncryptionPassword('');
      toast.success('암호화 CSV 저장 완료', {
        description: '이 계정의 기존 저장 행을 새 데이터로 덮어썼습니다.',
      });
    } catch (error) {
      toast.error('암호화 CSV 저장 실패', {
        description:
          error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSecureAction(undefined);
    }
  };

  // 버튼을 누른 시점에만 본인 암호문을 조회하고 브라우저에서 복호화·압축 해제합니다.
  const loadEncryptedCsv = async () => {
    if (!user) {
      router.push('/login?next=%2Fsetup%3Fmode%3Dadmin');
      return;
    }
    if (!requireEncryptionPassword()) return;

    setSecureAction('load');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('asset_data')
        .select('encrypted_payload')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data?.encrypted_payload) {
        throw new Error('이 계정에 저장된 CSV가 없습니다.');
      }

      const decryptedFiles = await decryptCsvFiles(
        data.encrypted_payload,
        encryptionPassword,
        user.id,
      );
      // 복원된 File 객체를 일반 업로드와 같은 검증 및 이후 계산 흐름에 연결합니다.
      const validFileCount = await handleFiles(decryptedFiles, {
        replace: true,
        showSuccessToast: false,
      });

      if (validFileCount !== decryptedFiles.length) {
        throw new Error('저장된 파일에 지원하지 않는 CSV가 포함되어 있습니다.');
      }

      setEncryptionPassword('');
      toast.success('암호화 CSV 불러오기 완료', {
        description: `${validFileCount}개의 CSV가 기존 처리 흐름에 연결되었습니다.`,
      });
    } catch (error) {
      toast.error('암호화 CSV 불러오기 실패', {
        description:
          error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setSecureAction(undefined);
    }
  };

  // 다른 계정에 복호화된 파일이 남지 않도록 로컬 상태를 비우고 페이지를 새로 엽니다.
  const signOut = async () => {
    setSecureAction('sign-out');

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUploadedFiles([]);
      setEncryptionPassword('');
      window.location.assign('/login?next=%2Fsetup%3Fmode%3Dadmin');
    } catch (error) {
      toast.error('로그아웃 실패', {
        description:
          error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
      setSecureAction(undefined);
    }
  };

  return (
    <>
      {showDemoSpotlight &&
        spotlightRect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className='pointer-events-none fixed inset-0 z-[200]'>
            {/* SVG 마스크로 더미 CSV 버튼과 같은 모양의 구멍을 냅니다. */}
            <svg
              className='absolute inset-0 h-full w-full'
              viewBox={`0 0 ${spotlightRect.viewportWidth} ${spotlightRect.viewportHeight}`}
              preserveAspectRatio='none'
              aria-hidden='true'
            >
              <defs>
                <mask
                  id='demo-csv-spotlight-mask'
                  maskUnits='userSpaceOnUse'
                >
                  <rect
                    width={spotlightRect.viewportWidth}
                    height={spotlightRect.viewportHeight}
                    fill='white'
                  />
                  <rect
                    x={spotlightRect.left}
                    y={spotlightRect.top}
                    width={spotlightRect.width}
                    height={spotlightRect.height}
                    rx={spotlightRect.borderRadius}
                    ry={spotlightRect.borderRadius}
                    fill='black'
                  />
                </mask>
              </defs>
              <rect
                width={spotlightRect.viewportWidth}
                height={spotlightRect.viewportHeight}
                fill='rgb(0 0 0 / 0.55)'
                mask='url(#demo-csv-spotlight-mask)'
              />
            </svg>
            {/* 버튼 바깥의 네 영역만 클릭을 차단해 안내된 버튼은 그대로 누를 수 있습니다. */}
            <div
              className='pointer-events-auto absolute inset-x-0 top-0'
              style={{ height: spotlightRect.top }}
            />
            <div
              className='pointer-events-auto absolute inset-x-0 bottom-0'
              style={{ top: spotlightRect.bottom }}
            />
            <div
              className='pointer-events-auto absolute left-0'
              style={{
                top: spotlightRect.top,
                width: spotlightRect.left,
                height: spotlightRect.bottom - spotlightRect.top,
              }}
            />
            <div
              className='pointer-events-auto absolute right-0'
              style={{
                top: spotlightRect.top,
                left: spotlightRect.right,
                height: spotlightRect.bottom - spotlightRect.top,
              }}
            />
            <div
              className='absolute flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg bg-black/85 px-3 py-2 text-sm font-semibold text-white shadow-lg'
              style={{
                top: Math.max(12, spotlightRect.top - 48),
                left: spotlightRect.left + spotlightRect.width / 2 + 8,
              }}
            >
              <Sparkles className='h-4 w-4 text-[oklch(0.78_0.16_82)]' />
              더미 CSV 불러오기를 눌러주세요
            </div>
          </div>,
          document.body,
        )}
      <div className='space-y-4'>
        <div
          className={cn(
            'rounded-2xl border border-dashed p-8 text-center shadow-sm backdrop-blur-md transition-all duration-200',
            isDragging
              ? 'border-[color:var(--setup-primary,var(--primary))] bg-[color:var(--setup-primary,var(--primary))]/5 shadow-[color:var(--setup-primary,var(--primary))]/10'
              : 'border-white/15 bg-transparent hover:border-[color:var(--setup-primary,var(--primary))]/35 hover:bg-white/[0.03]',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] shadow-sm'>
            <FileUp className='h-7 w-7 text-[color:var(--setup-primary,var(--primary))]' />
          </div>
          <h3 className='mt-4 text-lg font-bold'>
            파일을 끌어다 놓거나 클릭하여 업로드
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            신한투자증권의 CSV 파일만 지원됩니다
          </p>
          <input
            id='file-upload'
            type='file'
            className='hidden'
            accept='.csv'
            onChange={handleFileChange}
            multiple
          />
          <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
            <Button
              variant='outline'
              className='cursor-pointer rounded-xl border-white/15 bg-white/[0.04] text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-foreground hover:shadow-md'
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className='mr-2 h-4 w-4' />
              파일 선택
            </Button>

            <Button
              ref={dummyButtonRef}
              variant='secondary'
              className={cn(
                'cursor-pointer rounded-xl border border-white/15 bg-[linear-gradient(135deg,var(--setup-primary,var(--primary)),var(--setup-secondary,var(--secondary)))] text-white shadow-sm shadow-[color:var(--setup-primary,var(--primary))]/20 transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md',
                showDemoSpotlight &&
                  'ring-2 ring-inset ring-white/70 hover:translate-y-0',
              )}
              onClick={loadDummyCsv}
            >
              <FilePlus className='mr-2 h-4 w-4' />
              더미 CSV 불러오기
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className='mx-auto mt-6 max-w-2xl space-y-2 rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-left shadow-sm'>
              <h4 className='text-sm font-bold'>업로드된 파일</h4>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] p-2.5 shadow-sm'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <Check className='h-4 w-4 shrink-0 text-green-500' />
                    <span className='truncate text-sm font-medium'>
                      {file.name}
                    </span>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 cursor-pointer rounded-lg'
                    onClick={() => removeFile(index)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supabase 저장 UI는 mode=admin에서만 렌더링됩니다. */}
        {showSecureStorage && (
          <div className='rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-sm backdrop-blur-md'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex gap-3'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]'>
                <LockKeyhole className='h-5 w-5 text-[color:var(--setup-primary,var(--primary))]' />
              </div>
              <div>
                <h4 className='text-sm font-bold'>Supabase 암호화 저장</h4>
                <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>
                  gzip 압축 후 암호화하며, 사용자별 한 행만 유지합니다.
                </p>
              </div>
            </div>
            {user && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='cursor-pointer rounded-xl'
                disabled={Boolean(secureAction)}
                onClick={() => void signOut()}
              >
                {secureAction === 'sign-out' ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <LogOut />
                )}
                로그아웃
              </Button>
            )}
          </div>

          <div className='mt-4'>
            {isAuthLoading ? (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                로그인 상태 확인 중
              </div>
            ) : !isConfigured ? (
              <p className='rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive'>
                Supabase 환경변수를 설정해야 암호화 저장을 사용할 수 있습니다.
              </p>
            ) : !user ? (
              <div className='flex flex-col gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-sm text-muted-foreground'>
                  로그인하지 않은 사용자는 저장된 암호화 데이터도 조회할 수
                  없습니다.
                </p>
                <Button
                  type='button'
                  variant='outline'
                  className='shrink-0 cursor-pointer rounded-xl bg-white/[0.04]'
                  onClick={() =>
                    router.push('/login?next=%2Fsetup%3Fmode%3Dadmin')
                  }
                >
                  <LogIn />
                  로그인
                </Button>
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm'>
                  <span className='font-semibold'>{user.email}</span>
                  <span className='text-muted-foreground'> 계정으로 연결됨</span>
                </div>
                <Input
                  type='password'
                  autoComplete='current-password'
                  value={encryptionPassword}
                  onChange={(event) =>
                    setEncryptionPassword(event.target.value)
                  }
                  placeholder='암호화 비밀번호'
                  disabled={Boolean(secureAction)}
                  className='h-11 rounded-xl border-white/15 bg-white/[0.04]'
                />
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Button
                    type='button'
                    className='cursor-pointer rounded-xl sm:flex-1'
                    disabled={
                      Boolean(secureAction) || uploadedFiles.length === 0
                    }
                    onClick={() => void saveEncryptedCsv()}
                  >
                    {secureAction === 'save' ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <CloudUpload />
                    )}
                    암호화하여 저장
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='cursor-pointer rounded-xl border-white/15 bg-white/[0.04] sm:flex-1'
                    disabled={Boolean(secureAction)}
                    onClick={() => void loadEncryptedCsv()}
                  >
                    {secureAction === 'load' ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <CloudDownload />
                    )}
                    저장 CSV 불러오기
                  </Button>
                </div>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  암호화 비밀번호는 브라우저 암복호화에만 사용되며 asset_data
                  행에 저장되지 않습니다. 새 저장은 기존 행을 덮어쓰며, 암호를
                  바꾸면 이전 데이터는 이전 암호가 있어야 복호화할 수 있습니다.
                  암호를 분실하면 서버에서도 복구할 수 없습니다.
                </p>
              </div>
            )}
          </div>
          </div>
        )}

        <div className='flex gap-3 rounded-xl border border-border bg-[oklch(0.7_0.18_150_/_0.025)] p-4 text-left shadow-sm backdrop-blur-md'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card'>
            <ShieldCheck className='h-5 w-5 text-[oklch(0.62_0.18_150)]' />
          </div>
          <div className='space-y-1'>
            <h4 className='text-sm font-bold text-[oklch(0.62_0.18_150)]'>
              데이터 처리 안내
            </h4>
            <p className='text-sm leading-relaxed text-[oklch(0.62_0.18_150)]'>
              {showSecureStorage ? (
                <>
                  CSV는 기본적으로 브라우저에서만 처리됩니다. 로그인 후 저장
                  버튼을 누른 경우에만 브라우저에서 암호화된 묶음이 Supabase에
                  올라가며, 복호화된 CSV와 암호는 저장되지 않습니다.
                </>
              ) : (
                <>
                  CSV와 계좌 거래내역은 서버에 저장되거나 외부로 업로드되지
                  않습니다. 보유 종목의 가격·히스토리·ETF 구성·섹터 정보를
                  표시하기 위해 필요한 종목 코드/심볼 기준의 공개 시장 데이터만
                  조회합니다.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
