import { test, expect } from "bun:test";
import { numberToMongolian, normalizeForSpeech } from "./mn-speech";

test("нэгж тоонууд", () => {
  expect(numberToMongolian(0)).toBe("тэг");
  expect(numberToMongolian(3)).toBe("гурав");
  expect(numberToMongolian(9)).toBe("ес");
});

test("аравтын тоонууд", () => {
  expect(numberToMongolian(10)).toBe("арав");
  expect(numberToMongolian(30)).toBe("гуч");
  expect(numberToMongolian(31)).toBe("гучин нэг");
  expect(numberToMongolian(45)).toBe("дөчин тав");
});

test("зуутын тоонууд", () => {
  expect(numberToMongolian(100)).toBe("нэг зуун");
  expect(numberToMongolian(114)).toBe("нэг зуун арван дөрөв");
  expect(numberToMongolian(313)).toBe("гурван зуун арван гурав");
  expect(numberToMongolian(315)).toBe("гурван зуун арван тав");
});

test("мянгатын тоонууд", () => {
  expect(numberToMongolian(1000)).toBe("нэг мянга");
  expect(numberToMongolian(2025)).toBe("хоёр мянга хорин тав");
});

test("гол кэйс: 31+3= зөв уншигдана", () => {
  expect(normalizeForSpeech("31+3=")).toBe("гучин нэг нэмэх гурав тэнцүү");
});

test("математик үйлдлүүд", () => {
  expect(normalizeForSpeech("5-2=3")).toBe("тав хасах хоёр тэнцүү гурав");
  expect(normalizeForSpeech("4×2")).toBe("дөрөв үржих хоёр");
  expect(normalizeForSpeech("10/2")).toBe("арав хуваах хоёр");
});

test("монгол текст хэвээр үлдэнэ, тоо нь хөрвөнө", () => {
  expect(normalizeForSpeech("Хариу нь 12 байна")).toBe(
    "Хариу нь арван хоёр байна",
  );
  expect(normalizeForSpeech("Намайг Жой гэдэг")).toBe("Намайг Жой гэдэг");
});
