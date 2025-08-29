import { useState } from 'react';
import { toast } from 'sonner';
import { Check, FileUp, Upload, X, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CsvStepProps {
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function CsvStep({
  uploadedFiles,
  setUploadedFiles,
}: CsvStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [csvIndex, setCsvIndex] = useState(0);
  const csvFiles = ['a.csv', 'b.csv', 'c.csv', 'd.csv'];

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
    } catch (err) {
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
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUp className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">
            파일을 끌어다 놓거나 클릭하여 업로드
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            신한투자증권의 CSV 파일만 지원됩니다
          </p>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
            multiple
          />
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            파일 선택
          </Button>

          <Button
            variant="secondary"
            className="mt-2 ml-2"
            onClick={loadDummyCsv}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            더미 CSV 불러오기
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="font-medium">업로드된 파일</h4>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted p-2 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
