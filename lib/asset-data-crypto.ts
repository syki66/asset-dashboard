// 암호화 포맷과 키 파생 비용을 고정해 저장·복호화 양쪽이 같은 규칙을 사용합니다.
const ASSET_DATA_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const MIN_PBKDF2_ITERATIONS = 100_000;
const MAX_PBKDF2_ITERATIONS = 1_000_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;
const BASE64_CHUNK_SIZE = 0x8000;

type CsvFilePayload = {
  name: string;
  type: string;
  lastModified: number;
  // 원본 CSV 바이트를 그대로 복원할 수 있도록 Base64로 보관합니다.
  data: string;
};

type CsvAssetBundle = {
  version: typeof ASSET_DATA_VERSION;
  files: CsvFilePayload[];
};

type EncryptedAssetDataEnvelope = {
  // 복호화에 필요한 비밀이 아닌 메타데이터이며 실제 CSV 내용은 ciphertext에만 있습니다.
  version: typeof ASSET_DATA_VERSION;
  algorithm: 'AES-GCM';
  compression: 'gzip';
  keyDerivation: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getWebCrypto = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('이 브라우저에서는 안전한 암호화를 사용할 수 없습니다.');
  }

  return globalThis.crypto;
};

// 압축은 암호화 전에 수행해야 반복되는 CSV 문자열을 효과적으로 줄일 수 있습니다.
const compressBytes = async (bytes: Uint8Array) => {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('이 브라우저에서는 gzip 압축을 사용할 수 없습니다.');
  }

  const compressedStream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));

  return new Uint8Array(await new Response(compressedStream).arrayBuffer());
};

const decompressBytes = async (bytes: Uint8Array) => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('이 브라우저에서는 gzip 압축 해제를 사용할 수 없습니다.');
  }

  try {
    const decompressedStream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));

    return new Uint8Array(await new Response(decompressedStream).arrayBuffer());
  } catch {
    throw new Error('압축된 CSV 데이터가 손상되었습니다.');
  }
};

// JSON 문자열에 바이너리 값을 넣기 위해 Uint8Array와 Base64를 상호 변환합니다.
const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + BASE64_CHUNK_SIZE),
    );
  }

  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

// 사용자 ID를 AES-GCM 추가 인증 데이터에 포함해 다른 계정으로 암호문을 옮겨도 복호화되지 않게 합니다.
const getAdditionalData = (userId: string) =>
  textEncoder.encode(`asset-data:v${ASSET_DATA_VERSION}:${userId}`);

// 입력 암호와 행마다 생성한 salt로 256비트 AES 키를 파생하며 원본 암호는 키에 포함하지 않습니다.
const deriveEncryptionKey = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
  usages: KeyUsage[],
) => {
  const webCrypto = getWebCrypto();
  const passwordKey = await webCrypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    usages,
  );
};

// 복호화 이후 예상하지 못한 객체가 File로 생성되지 않도록 각 파일 구조를 검사합니다.
const isCsvFilePayload = (value: unknown): value is CsvFilePayload => {
  if (!value || typeof value !== 'object') return false;

  const file = value as Partial<CsvFilePayload>;

  return (
    typeof file.name === 'string' &&
    typeof file.type === 'string' &&
    typeof file.lastModified === 'number' &&
    Number.isFinite(file.lastModified) &&
    typeof file.data === 'string'
  );
};

// 외부 저장소에서 받은 값이 지원 중인 암호화 규격과 반복 횟수 범위인지 먼저 확인합니다.
const parseEnvelope = (encryptedPayload: string) => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(encryptedPayload);
  } catch {
    throw new Error('저장된 암호화 데이터 형식이 올바르지 않습니다.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('저장된 암호화 데이터 형식이 올바르지 않습니다.');
  }

  const envelope = parsed as Partial<EncryptedAssetDataEnvelope>;

  if (
    envelope.version !== ASSET_DATA_VERSION ||
    envelope.algorithm !== 'AES-GCM' ||
    envelope.compression !== 'gzip' ||
    envelope.keyDerivation !== 'PBKDF2-SHA-256' ||
    typeof envelope.iterations !== 'number' ||
    envelope.iterations < MIN_PBKDF2_ITERATIONS ||
    envelope.iterations > MAX_PBKDF2_ITERATIONS ||
    typeof envelope.salt !== 'string' ||
    typeof envelope.iv !== 'string' ||
    typeof envelope.ciphertext !== 'string'
  ) {
    throw new Error('지원하지 않는 암호화 데이터 형식입니다.');
  }

  return envelope as EncryptedAssetDataEnvelope;
};

// 압축 해제된 평문도 버전과 파일 구조를 다시 검증한 뒤에만 사용합니다.
const parseBundle = (value: string) => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('복호화된 CSV 데이터 형식이 올바르지 않습니다.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('복호화된 CSV 데이터 형식이 올바르지 않습니다.');
  }

  const bundle = parsed as Partial<CsvAssetBundle>;

  if (
    bundle.version !== ASSET_DATA_VERSION ||
    !Array.isArray(bundle.files) ||
    !bundle.files.every(isCsvFilePayload)
  ) {
    throw new Error('복호화된 CSV 데이터 형식이 올바르지 않습니다.');
  }

  return bundle as CsvAssetBundle;
};

// File[] → 바이트 보존 묶음 → gzip → AES-GCM → DB 저장용 JSON 순서로 변환합니다.
export const encryptCsvFiles = async (
  files: File[],
  password: string,
  userId: string,
) => {
  if (files.length === 0) {
    throw new Error('암호화할 CSV 파일이 없습니다.');
  }
  if (!password) {
    throw new Error('암호를 입력해 주세요.');
  }

  const webCrypto = getWebCrypto();
  const salt = webCrypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = webCrypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  // salt와 IV는 저장할 때마다 새로 생성해 같은 파일과 암호라도 다른 암호문이 만들어집니다.
  const key = await deriveEncryptionKey(
    password,
    salt,
    PBKDF2_ITERATIONS,
    ['encrypt'],
  );
  const filePayloads = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type || 'text/csv',
      lastModified: file.lastModified,
      data: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
    })),
  );
  const bundle: CsvAssetBundle = {
    version: ASSET_DATA_VERSION,
    files: filePayloads,
  };
  const compressedBundle = await compressBytes(
    textEncoder.encode(JSON.stringify(bundle)),
  );
  const ciphertext = await webCrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: getAdditionalData(userId),
    },
    key,
    compressedBundle,
  );
  const envelope: EncryptedAssetDataEnvelope = {
    version: ASSET_DATA_VERSION,
    algorithm: 'AES-GCM',
    compression: 'gzip',
    keyDerivation: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(envelope);
};

// DB JSON → AES-GCM 검증·복호화 → gzip 해제 → 원본 File[] 순서로 복원합니다.
export const decryptCsvFiles = async (
  encryptedPayload: string,
  password: string,
  userId: string,
) => {
  if (!password) {
    throw new Error('암호를 입력해 주세요.');
  }

  const envelope = parseEnvelope(encryptedPayload);
  const webCrypto = getWebCrypto();
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const key = await deriveEncryptionKey(
    password,
    salt,
    envelope.iterations,
    ['decrypt'],
  );
  let compressedBundle: ArrayBuffer;

  try {
    // 암호, 사용자 ID, 인증 태그 중 하나라도 다르면 AES-GCM이 평문을 반환하지 않습니다.
    compressedBundle = await webCrypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: getAdditionalData(userId),
      },
      key,
      base64ToBytes(envelope.ciphertext),
    );
  } catch {
    throw new Error('암호가 다르거나 저장된 데이터가 손상되었습니다.');
  }

  const plaintext = await decompressBytes(new Uint8Array(compressedBundle));
  const bundle = parseBundle(textDecoder.decode(plaintext));

  return bundle.files.map(
    (file) =>
      new File([base64ToBytes(file.data)], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      }),
  );
};
