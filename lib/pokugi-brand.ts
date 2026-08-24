const LOCAL_DEVELOPMENT_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Pokugi 브랜딩은 공식 도메인과 로컬 개발 환경에서만 노출합니다.
 * 포트가 포함된 host 값도 받을 수 있도록 URL로 정규화합니다.
 */
export function shouldShowPokugiBrand(host: string) {
  const hostname = normalizeHostname(host);

  return (
    LOCAL_DEVELOPMENT_HOSTS.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname === 'pokugi.com' ||
    hostname.endsWith('.pokugi.com')
  );
}

function normalizeHostname(host: string) {
  const trimmedHost = host.trim().toLowerCase();

  if (!trimmedHost) return '';

  try {
    return new URL(`http://${trimmedHost}`).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return trimmedHost.split(':')[0];
  }
}
