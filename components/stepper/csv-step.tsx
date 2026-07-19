import { useState } from 'react';
import { toast } from 'sonner';
import { Check, FileUp, Upload, X, FilePlus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isShsecTransactionCsv } from '@/utils/shsec-adapter';

interface CsvStepProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function CsvStep({ uploadedFiles, setUploadedFiles }: CsvStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dummyCsvFileNames = ['dummy-3y.csv', 'dummy-5y.csv', 'dummy-10y.csv'];

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
              variant='secondary'
              className='cursor-pointer rounded-xl border border-white/15 bg-[linear-gradient(135deg,var(--setup-primary,var(--primary)),var(--setup-secondary,var(--secondary)))] text-white shadow-sm shadow-[color:var(--setup-primary,var(--primary))]/20 transition-all hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md'
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
