export const SLIDES = [
  {
    kicker: "The company",
    title: "I'm starting it",
    body: "I'm starting a window cleaning company. Right now I'm only worth an idea. There will be two locations, summer and winter. Two houses. It is not going to be easy.",
  },
  {
    kicker: "You",
    title: "If you see it now",
    body: "The woman who sees my worth now won't regret it. She will build it with me.",
  },
  {
    kicker: "Why",
    title: "Kids, and a good mom",
    body: "I want kids. I want a good mom. There's no reason to do any of this without that.",
  },
] as const;

export const TONES = [
  { id: "platonic", label: "Platonic" },
  { id: "romantic", label: "Romantic" },
] as const;

export const MEETS = [
  { id: "meetup", label: "A meetup" },
  { id: "date", label: "A date" },
] as const;

export type ToneId = (typeof TONES)[number]["id"];
export type MeetId = (typeof MEETS)[number]["id"];

export type Answers = {
  name: string;
  dob: string;
  city: string;
  job: string;
  tone: ToneId | "";
  meet: MeetId | "";
  why: string;
  contact: string;
  photo: string;
  consent: boolean;
};

export const EMPTY_ANSWERS: Answers = {
  name: "",
  dob: "",
  city: "",
  job: "",
  tone: "",
  meet: "",
  why: "",
  contact: "",
  photo: "",
  consent: false,
};

export { applicationScore, contactKind, easternDateString, yearsOld } from "../../../api/_lib/interestedRules";

export function toneLabel(id: ToneId | "") {
  return TONES.find((item) => item.id === id)?.label ?? "";
}

export function meetLabel(id: MeetId | "") {
  return MEETS.find((item) => item.id === id)?.label ?? "";
}
