export function getPageFromPath(pathname) {
  if (pathname === '/start') return 'start';
  if (pathname === '/learn') return 'learn';
  if (pathname === '/lesson') return 'lesson';
  if (pathname === '/typing-lesson') return 'typing-lesson';
  if (pathname === '/big-add-lesson') return 'big-add-lesson';
  if (pathname === '/mc-first') return 'mc-first';
  if (pathname === '/parents') return 'parents';
  return 'home';
}
