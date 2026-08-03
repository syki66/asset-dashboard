const DEVICE_AUTH_STORAGE_KEY = 'asset-dashboard-device-auth-v1';

export const DEVICE_AUTH_CHANGE_EVENT = 'asset-dashboard-device-auth-change';
export const DEVICE_AUTH_PROMPT_ATTRIBUTE = 'data-device-auth-prompt';

type StoredDeviceCredential = {
  credentialId: string;
  createdAt: string;
};

const bytesToBase64Url = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
};

const base64UrlToBytes = (value: string) => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const createChallenge = () => crypto.getRandomValues(new Uint8Array(32));

const readStoredCredential = (): StoredDeviceCredential | null => {
  if (typeof window === 'undefined') return null;

  const value = window.localStorage.getItem(DEVICE_AUTH_STORAGE_KEY);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredDeviceCredential>;
    if (!parsed.credentialId || !parsed.createdAt) return null;
    return parsed as StoredDeviceCredential;
  } catch {
    return null;
  }
};

const runWithDevicePrompt = async <Result>(operation: () => Promise<Result>) => {
  document.documentElement.setAttribute(DEVICE_AUTH_PROMPT_ATTRIBUTE, 'true');

  try {
    return await operation();
  } finally {
    document.documentElement.removeAttribute(DEVICE_AUTH_PROMPT_ATTRIBUTE);
  }
};

export const hasDeviceAuthCredential = () => readStoredCredential() !== null;

export const isDeviceAuthSupported = async () => {
  if (
    typeof window === 'undefined' ||
    !window.isSecureContext ||
    !('PublicKeyCredential' in window) ||
    !navigator.credentials
  ) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const registerDeviceAuth = async () => {
  if (!(await isDeviceAuthSupported())) {
    throw new Error('이 브라우저에서는 기기 생체인증을 사용할 수 없습니다.');
  }

  const challenge = createChallenge();
  const credential = await runWithDevicePrompt(() =>
    navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: '자산 대시보드' },
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: 'asset-dashboard-device-lock',
          displayName: '자산 대시보드 잠금 해제',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'preferred',
          requireResidentKey: false,
          userVerification: 'required',
        },
        timeout: 60_000,
        attestation: 'none',
      },
    }),
  );

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('기기 인증 정보를 만들지 못했습니다.');
  }

  const storedCredential: StoredDeviceCredential = {
    credentialId: bytesToBase64Url(credential.rawId),
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    DEVICE_AUTH_STORAGE_KEY,
    JSON.stringify(storedCredential),
  );
  window.dispatchEvent(new Event(DEVICE_AUTH_CHANGE_EVENT));
};

export const authenticateDevice = async () => {
  const storedCredential = readStoredCredential();
  if (!storedCredential) {
    throw new Error('이 기기에 등록된 생체인증 정보가 없습니다.');
  }

  if (!(await isDeviceAuthSupported())) {
    throw new Error('현재 환경에서는 기기 생체인증을 사용할 수 없습니다.');
  }

  const challenge = createChallenge();
  const encodedChallenge = bytesToBase64Url(challenge);
  const credentialId = base64UrlToBytes(storedCredential.credentialId);
  const credential = await runWithDevicePrompt(() =>
    navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: credentialId,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60_000,
      },
    }),
  );

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('기기 인증에 실패했습니다.');
  }

  if (bytesToBase64Url(credential.rawId) !== storedCredential.credentialId) {
    throw new Error('등록되지 않은 인증 정보입니다.');
  }

  const response = credential.response as AuthenticatorAssertionResponse;
  const clientData = JSON.parse(
    new TextDecoder().decode(response.clientDataJSON),
  ) as { challenge?: string; origin?: string; type?: string };
  const flags = new Uint8Array(response.authenticatorData)[32] ?? 0;
  const isUserPresent = (flags & 0x01) !== 0;
  const isUserVerified = (flags & 0x04) !== 0;

  if (
    clientData.type !== 'webauthn.get' ||
    clientData.challenge !== encodedChallenge ||
    clientData.origin !== window.location.origin ||
    !isUserPresent ||
    !isUserVerified
  ) {
    throw new Error('기기에서 사용자를 확인하지 못했습니다.');
  }
};

export const removeDeviceAuth = () => {
  window.localStorage.removeItem(DEVICE_AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(DEVICE_AUTH_CHANGE_EVENT));
};

export const getDeviceAuthErrorMessage = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return '인증이 취소되었거나 제한 시간 안에 완료되지 않았습니다.';
    }
    if (error.name === 'InvalidStateError') {
      return '이미 등록된 기기 인증 정보가 있습니다.';
    }
    if (error.name === 'SecurityError') {
      return 'HTTPS 보안 연결에서만 생체인증을 사용할 수 있습니다.';
    }
    if (error.name === 'NotSupportedError') {
      return '이 기기 또는 브라우저가 생체인증을 지원하지 않습니다.';
    }
  }

  return error instanceof Error
    ? error.message
    : '기기 인증 중 문제가 발생했습니다.';
};
