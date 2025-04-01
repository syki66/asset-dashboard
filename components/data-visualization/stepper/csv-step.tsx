import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shsecCsvToJson, createShsecTransactions } from '@/utils/shsec-adapter';
import { createAccountData } from '@/utils/converter';
import { toast } from 'sonner';
import { Check, FileUp, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccountStore } from '@/store/account';

const readFile = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일을 읽는 데 실패했습니다.'));
    reader.readAsText(file); // 파일을 텍스트로 읽음 (필요에 따라 readAsArrayBuffer 등 변경 가능)
  });
};

export default function CsvStep() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const setTotalAccountData = useAccountStore(
    (state) => state.setTotalAccountData
  );

  const {
    data: totalAccountData,
    refetch,
    isLoading,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ['accountData'],
    queryFn: async () => {
      const totalAccountData = await Promise.all(
        uploadedFiles.map(async (file) => {
          const fileContent = await readFile(file); // 파일 내용 읽기
          const shsecJson = shsecCsvToJson(fileContent); // 신한증권 csv 데이터를 json으로 변환
          const transactions = createShsecTransactions(shsecJson); // 신한증권 json 데이터를 거래내역으로 변환
          const accountData = await createAccountData(transactions); // 거래내역을 날짜별 계좌정보로 변환
          return { name: file.name, accountData };
        })
      );

      return totalAccountData;
    },
    enabled: false, // refetch를 이용해서 수동으로만 가져올 수 있도록 함
  });

  if (totalAccountData) {
    setTotalAccountData(totalAccountData);
  }

  const handleFiles = (files: File[]) => {
    // 파일 확장자 검증 (CSV, XLSX만 허용)
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

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

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSubmit = () => {
    refetch();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('계좌 불러오기 성공', {
        description: '계좌 데이터를 성공적으로 불러왔습니다.',
      });
    }
    if (isError) {
      toast.error('계좌 불러오기 실패', {
        description: '계좌 데이터를 불러오는 데 실패했습니다.',
      });
    }
  }, [isSuccess, isError]);

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">데이터 가져오기</h3>
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
            <div className="flex justify-end mt-2">
              <Button onClick={handleFileSubmit} disabled={isLoading}>
                {isLoading ? '가져오는중' : '계좌 불러오기'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
