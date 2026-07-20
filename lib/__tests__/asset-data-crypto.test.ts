import { decryptCsvFiles, encryptCsvFiles } from '../asset-data-crypto';

describe('asset data crypto', () => {
  const userId = 'ec4930d5-8f96-48d2-a428-dac2c6476aab';
  const password = 'test-password-1234';

  it('CSV 파일을 암호화한 뒤 원본 메타데이터와 바이트로 복원한다', async () => {
    const sourceFiles = [
      new File(['날짜,종목\n2026-01-01,테스트\n'], 'account-a.csv', {
        type: 'text/csv',
        lastModified: 1_700_000_000_000,
      }),
      new File([new Uint8Array([0xef, 0xbb, 0xbf, 65, 44, 66])], 'b.csv', {
        type: 'text/csv',
        lastModified: 1_710_000_000_000,
      }),
    ];

    const encryptedPayload = await encryptCsvFiles(
      sourceFiles,
      password,
      userId,
    );
    const restoredFiles = await decryptCsvFiles(
      encryptedPayload,
      password,
      userId,
    );
    const envelope = JSON.parse(encryptedPayload) as {
      compression?: string;
    };

    expect(encryptedPayload).not.toContain('테스트');
    expect(envelope.compression).toBe('gzip');
    expect(restoredFiles).toHaveLength(sourceFiles.length);

    for (const [index, restoredFile] of restoredFiles.entries()) {
      const sourceFile = sourceFiles[index];

      expect(restoredFile.name).toBe(sourceFile.name);
      expect(restoredFile.type).toBe(sourceFile.type);
      expect(restoredFile.lastModified).toBe(sourceFile.lastModified);
      expect(new Uint8Array(await restoredFile.arrayBuffer())).toEqual(
        new Uint8Array(await sourceFile.arrayBuffer()),
      );
    }
  });

  it('반복이 많은 CSV의 저장 크기를 원본보다 줄인다', async () => {
    const csv = `날짜,계좌,종목,거래구분,수량,금액\n${
      '2026-01-01,12345678,005930,매수,10,100000\n'.repeat(20_000)
    }`;
    const sourceFile = new File([csv], 'large-account.csv', {
      type: 'text/csv',
    });

    const encryptedPayload = await encryptCsvFiles(
      [sourceFile],
      password,
      userId,
    );

    expect(encryptedPayload.length).toBeLessThan(sourceFile.size);
  });

  it('암호나 사용자 계정이 다르면 복호화하지 못한다', async () => {
    const encryptedPayload = await encryptCsvFiles(
      [new File(['a,b\n1,2'], 'account.csv', { type: 'text/csv' })],
      password,
      userId,
    );

    await expect(
      decryptCsvFiles(encryptedPayload, 'wrong-password', userId),
    ).rejects.toThrow('암호가 다르거나 저장된 데이터가 손상되었습니다.');
    await expect(
      decryptCsvFiles(
        encryptedPayload,
        password,
        '97f11c5b-312d-4418-88b5-258c361f98fa',
      ),
    ).rejects.toThrow('암호가 다르거나 저장된 데이터가 손상되었습니다.');
  });
});
