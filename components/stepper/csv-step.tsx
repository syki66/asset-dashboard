import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Check,
  FileUp,
  Upload,
  X,
  FilePlus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isShsecTransactionCsv } from '@/utils/shsec-adapter';

interface CsvStepProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  // 데모 진입 시 더미 CSV 버튼에 스포트라이트 안내를 표시합니다.
  showDemoPrompt?: boolean;
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

export function CsvStep({
  uploadedFiles,
  setUploadedFiles,
  showDemoPrompt = false,
}: CsvStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  // 아래 상태와 ref는 데모 스포트라이트가 실제 버튼을 따라가도록 사용합니다.
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect>();
  const dummyButtonRef = useRef<HTMLButtonElement>(null);
  const dummyCsvFileNames = ['dummy-3y.csv', 'dummy-5y.csv', 'dummy-10y.csv'];
  const showDemoSpotlight = showDemoPrompt && uploadedFiles.length === 0;

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

  // 파일 처리 로직
  const handleFiles = async (files: File[]) => {
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

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success('파일 업로드 성공', {
        description: `${validFiles.length}개의 파일이 업로드되었습니다.`,
      });
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

        <div className='flex gap-3 rounded-xl border border-border bg-[oklch(0.7_0.18_150_/_0.025)] p-4 text-left shadow-sm backdrop-blur-md'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card'>
            <ShieldCheck className='h-5 w-5 text-[oklch(0.62_0.18_150)]' />
          </div>
          <div className='space-y-1'>
            <h4 className='text-sm font-bold text-[oklch(0.62_0.18_150)]'>
              데이터 처리 안내
            </h4>
            <p className='text-sm leading-relaxed text-[oklch(0.62_0.18_150)]'>
              CSV와 계좌 거래내역은 서버에 저장되거나 외부로 업로드되지
              않습니다. 보유 종목의 가격·히스토리·ETF 구성·섹터 정보를 표시하기
              위해 필요한 종목 코드/심볼 기준의 공개 시장 데이터만 조회합니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
