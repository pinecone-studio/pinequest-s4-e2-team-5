export function getPageFromPath(pathname) {
  if (pathname === '/start') return 'start';
  if (pathname === '/learn') return 'learn';
  if (pathname === '/lesson') return 'lesson';
  if (pathname === '/typing-lesson') return 'typing-lesson';
  return 'home';
}
