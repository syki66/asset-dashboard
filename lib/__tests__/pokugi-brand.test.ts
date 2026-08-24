import { shouldShowPokugiBrand } from '@/lib/pokugi-brand';

describe('shouldShowPokugiBrand', () => {
  it.each([
    'pokugi.com',
    'asset.pokugi.com',
    'localhost',
    'localhost:3000',
    'dashboard.localhost:3000',
    '127.0.0.1:3000',
    '[::1]:3000',
    'asset-visualizer.vercel.app',
    'asset-visualizer-git-develop.vercel.app',
  ])('%s에서는 Pokugi 브랜딩을 노출한다', (host) => {
    expect(shouldShowPokugiBrand(host)).toBe(true);
  });

  it.each([
    'example.com',
    'pokugi.com.example.com',
    'notpokugi.com',
    'customer.example.com:3000',
  ])('%s에서는 Pokugi 브랜딩을 숨긴다', (host) => {
    expect(shouldShowPokugiBrand(host)).toBe(false);
  });
});
