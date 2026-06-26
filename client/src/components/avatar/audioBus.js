// Бүх AI дуу хоолойг нэг цэгээс удирдах module-level singleton.
// Зорилго: хэсэг хооронд шилжихэд (landing / username / bodoh) өмнөх дуу
// үргэлжлэн тоглохоос сэргийлж, хэзээ ч нэгээс олон дуу зэрэг тоглохгүй байх.

let currentAudio = null;
let currentUrl = "";
// navEpoch — шилжилт бүрт нэмэгддэг тоологч. await fetch-ийн өмнө барьж аваад
// дараа нь дахин шалгаснаар unmount/шилжсэн component-ийн дуу эхлэхээс сэргийлнэ.
let navEpoch = 0;

export function registerAudio(audio, url) {
  currentAudio = audio;
  currentUrl = url || "";
}

export function getNavEpoch() {
  return navEpoch;
}

export function stopAllAudio() {
  navEpoch++;
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* аль хэдийн зогссон бол алгасна */
    }
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.onplay = null;
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = "";
  }
}

// Байгаа element нь яг өөрөө бол л цэвэрлэнэ — шинэ дууг гэмтээхгүй.
export function clearAudio(audio) {
  if (currentAudio === audio) {
    currentAudio = null;
    currentUrl = "";
  }
}
