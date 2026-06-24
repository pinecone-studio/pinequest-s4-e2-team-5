export function getPageFromPath(pathname) {
  if (pathname === '/learn') return 'learn';
  if (pathname === '/lesson') return 'lesson';
  return 'home';
}
