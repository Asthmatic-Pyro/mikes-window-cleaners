import assert from "node:assert/strict";
import test from "node:test";
import { applicationScore, contactKind, yearsOld } from "./interestedRules.ts";

test("age uses the Eastern calendar, including the birthday itself", () => {
  const beforeBirthday = new Date("2026-11-10T04:30:00.000Z");
  const onBirthday = new Date("2026-11-10T05:30:00.000Z");
  assert.equal(yearsOld("2005-11-10", beforeBirthday), 20);
  assert.equal(yearsOld("2005-11-10", onBirthday), 21);
});

test("age rejects a calendar date that does not exist", () => {
  assert.equal(yearsOld("2026-02-31"), null);
  assert.equal(yearsOld("nope"), null);
});

test("contact accepts a phone, an email, or a Telegram name", () => {
  assert.equal(contactKind("(513) 628-4128"), "phone");
  assert.equal(contactKind("+1 513 628 4128"), "phone");
  assert.equal(contactKind("jane@example.com"), "email");
  assert.equal(contactKind("@mikenotes"), "telegram");
  assert.equal(contactKind("https://t.me/mikenotes"), "telegram");
  assert.equal(contactKind("hello"), null);
  assert.equal(contactKind("@mike"), null);
  assert.equal(contactKind("12345"), null);
});

test("score counts a longer note and a photo", () => {
  const empty = applicationScore({ why: "short note here ok", photo: "" });
  assert.equal(empty.points, 0);
  assert.equal(empty.of, 2);
  const full = applicationScore({
    why: "I want to build the company with you and I mean that.",
    photo: "data:image/jpeg;base64,abc",
  });
  assert.equal(full.points, 2);
});
