import { useState } from 'react';
import { toast } from 'sonner';
import { Check, FileUp, Upload, X, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CsvStepProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function CsvStep({ uploadedFiles, setUploadedFiles }: CsvStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [csvIndex, setCsvIndex] = useState(0);
  const csvFiles = ['dummy-3y.csv', 'dummy-5y.csv', 'dummy-10y.csv'];

  // 체험용 더미 CSV 데이터 불러오기 (순차적으로)
  const loadDummyCsv = async () => {
    if (csvIndex >= csvFiles.length) {
      toast.error('더 이상 불러올 CSV가 없습니다.');
      return;
    }
    try {
      const fileName = csvFiles[csvIndex];
      const res = await fetch(`/${fileName}`); // public 폴더에 있는 csv 파일 불러오기
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'text/csv' });
      handleFiles([file]);
      setCsvIndex((prev) => prev + 1);
    } catch {
      toast.error('더미 CSV 로드 실패');
    }
  };

  // 파일 처리 로직
  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'csv' || ext === 'xlsx';
    });

    if (validFiles.length !== files.length) {
      toast.error('파일 형식 오류', {
        description: '신한투자증권의 CSV 파일만 업로드 가능합니다.',
      });
      // toast.error('파일 형식 오류: CSV 또는 XLSX 파일만 업로드 가능합니다.');
    }

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success('파일 업로드 성공', {
        description: `${validFiles.length}개의 파일이 업로드되었습니다.`,
      });
    }
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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
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
        </div>

        {uploadedFiles.length > 0 && (
          <div className='mt-4 space-y-2 rounded-2xl border border-white/15 bg-transparent p-4 shadow-sm backdrop-blur-md'>
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
    </>
  );
}
