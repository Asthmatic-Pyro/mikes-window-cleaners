/**
 * Sleeping in a car, public camping, and printed fines for the Follow route.
 * Amounts are only those written in the cited law. Not legal advice.
 * City signs, park compendiums, and private property can be stricter.
 */

export type VehicleTopic = "vehicle" | "camping" | "fine";

export type VehicleFact = "no-ban" | "rest-limit" | "carved-out";
export type CampingFact = "local" | "highway" | "must-prohibit" | "reasonable";
export type FineFact = "no-dollar" | "one-to-200" | "misdemeanor-1000" | "infraction";

export type VehicleLaw = {
  state: string;
  topic: VehicleTopic;
  fact: VehicleFact | CampingFact | FineFact;
  blurb: string;
  citation: string;
  sourceUrl: string;
  asOf: string;
};

export type StopLaw = {
  stop: string;
  vehicle: string;
  camping: string;
  fine: string;
  citation: string;
  sourceUrl: string;
  asOf: string;
};

const AS_OF = "2026-10-11";

export const VEHICLE_TOPICS: { id: VehicleTopic; label: string }[] = [
  { id: "vehicle", label: "Sleeping in a car" },
  { id: "camping", label: "Public camping" },
  { id: "fine", label: "Fine" },
];

export const VEHICLE_CHOICES: { id: VehicleFact; label: string }[] = [
  { id: "no-ban", label: "No statewide ban on sleeping in a lawfully parked car" },
  { id: "rest-limit", label: "Statewide rule limits rest-area stays or camping" },
  { id: "carved-out", label: "Public-sleeping law excludes a lawfully parked, registered, insured vehicle" },
];

export const CAMPING_CHOICES: { id: CampingFact; label: string }[] = [
  { id: "local", label: "No statewide street-camping ban confirmed; cities write their own" },
  { id: "highway", label: "Camping on state highway property is a state misdemeanor" },
  { id: "must-prohibit", label: "State requires cities and counties to prohibit regular public camping" },
  { id: "reasonable", label: "Local sit-and-sleep rules must be objectively reasonable" },
];

export const FINE_CHOICES: { id: FineFact; label: string }[] = [
  { id: "no-dollar", label: "No statewide dollar fine for living in a car" },
  { id: "one-to-200", label: "Rest-area offense: $1 to $200" },
  { id: "misdemeanor-1000", label: "Misdemeanor, general cap of $1,000" },
  { id: "infraction", label: "First rest-area violation is an infraction (base fine up to $100)" },
];

export function choicesForVehicleTopic(topic: VehicleTopic) {
  if (topic === "vehicle") return VEHICLE_CHOICES;
  if (topic === "camping") return CAMPING_CHOICES;
  return FINE_CHOICES;
}

const THIN_CODE: Record<string, { name: string; url: string }> = {
  NY: { name: "N.Y. Consolidated Laws", url: "https://www.nysenate.gov/legislation/laws" },
  RI: { name: "R.I. Gen. Laws", url: "https://webserver.rilegislature.gov/Statutes/" },
  CT: { name: "Conn. Gen. Stat.", url: "https://www.cga.ct.gov/current/pub/titles.htm" },
  DE: { name: "Del. Code", url: "https://delcode.delaware.gov/" },
  DC: { name: "D.C. Code", url: "https://code.dccouncil.gov/" },
  SC: { name: "S.C. Code", url: "https://www.scstatehouse.gov/code/statmast.php" },
  AL: { name: "Ala. Code", url: "https://alison.legislature.state.al.us/code-of-alabama" },
  MS: { name: "Miss. Code", url: "https://law.justia.com/codes/mississippi/" },
  LA: { name: "La. Rev. Stat.", url: "https://www.legis.la.gov/legis/Laws_Toc.aspx?folder=75&level=Parent" },
  NM: { name: "N.M. Stat.", url: "https://nmonesource.com/nmos/nmsa/en/nav_date.do" },
  AZ: { name: "Ariz. Rev. Stat.", url: "https://www.azleg.gov/arstitle/" },
  NV: { name: "Nev. Rev. Stat.", url: "https://www.leg.state.nv.us/nrs/" },
  WA: { name: "Wash. Rev. Code", url: "https://app.leg.wa.gov/rcw/" },
  MA: { name: "Mass. Gen. Laws; 700 CMR 9.03", url: "https://www.law.cornell.edu/regulations/massachusetts/700-CMR-9.03" },
};

function thin(state: string): VehicleLaw[] {
  const code = THIN_CODE[state];
  return [
    {
      state,
      topic: "vehicle",
      fact: "no-ban",
      blurb: `No statewide statute was confirmed that makes sleeping in a lawfully parked car its own offense in ${code.name}. Posted parking signs, city ordinances, and private property can still forbid an overnight stay.`,
      citation: code.name,
      sourceUrl: code.url,
      asOf: AS_OF,
    },
    {
      state,
      topic: "camping",
      fact: "local",
      blurb: `No statewide ban on camping or sleeping on ordinary city streets was confirmed in ${code.name}. Cities and park agencies write those rules. A highway rest area can still post its own limit.`,
      citation: code.name,
      sourceUrl: code.url,
      asOf: AS_OF,
    },
    {
      state,
      topic: "fine",
      fact: "no-dollar",
      blurb: `${code.name} does not, in the sections reviewed for this page, print a statewide dollar fine for living in a car. Any fine would come from a city ordinance, a posted parking rule, or a trespass charge.`,
      citation: code.name,
      sourceUrl: code.url,
      asOf: AS_OF,
    },
  ];
}

export const VEHICLE_LAWS: VehicleLaw[] = [
  {
    state: "OH",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "Ohio has no confirmed statewide ban on sleeping in a car on a city street. At ODOT rest areas and roadside parks, camping is prohibited. A vehicle left unattended for three hours without permission may be towed at the owner's expense. The rule sets no hour cap for a vehicle that is occupied.",
    citation: "Ohio Admin. Code 5501:2-4-01",
    sourceUrl: "https://codes.ohio.gov/ohio-administrative-code/rule-5501:2-4-01",
    asOf: AS_OF,
  },
  {
    state: "OH",
    topic: "camping",
    fact: "local",
    blurb:
      "The rest-area rule bans camping at those ODOT sites. It is not a statewide ban on sleeping on city streets. Cincinnati, Cleveland, and other cities can write their own ordinances.",
    citation: "Ohio Admin. Code 5501:2-4-01",
    sourceUrl: "https://codes.ohio.gov/ohio-administrative-code/rule-5501:2-4-01",
    asOf: AS_OF,
  },
  {
    state: "OH",
    topic: "fine",
    fact: "no-dollar",
    blurb:
      "The rest-area rule does not print a dollar fine for sleeping in a car. The stated consequence for an unattended vehicle left three hours is a tow at the owner's expense.",
    citation: "Ohio Admin. Code 5501:2-4-01",
    sourceUrl: "https://codes.ohio.gov/ohio-administrative-code/rule-5501:2-4-01",
    asOf: AS_OF,
  },
  {
    state: "PA",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "At a PennDOT roadside rest area, parking or standing more than 2 hours in a 24-hour period is prohibited. The same rule prohibits camping overnight, sleeping anywhere except in a legally parked vehicle, and remaining at the rest area more than 2 hours.",
    citation: "67 Pa. Code § 443.2",
    sourceUrl: "https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/067/chapter443/s443.2.html",
    asOf: AS_OF,
  },
  {
    state: "PA",
    topic: "camping",
    fact: "local",
    blurb:
      "The 2-hour rest-area rule is not a statewide ban on city streets. Philadelphia and other cities set their own public-space and parking rules. State parks, including Presque Isle, limit camping to designated sites.",
    citation: "67 Pa. Code § 443.2",
    sourceUrl: "https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/067/chapter443/s443.2.html",
    asOf: AS_OF,
  },
  {
    state: "PA",
    topic: "fine",
    fact: "no-dollar",
    blurb:
      "Section 443.2 does not print a dollar fine for sleeping in a car. It prohibits the stay. A separate enforcement section or a city ordinance would have to supply any amount.",
    citation: "67 Pa. Code § 443.2",
    sourceUrl: "https://www.pacodeandbulletin.gov/Display/pacode?file=/secure/pacode/data/067/chapter443/s443.2.html",
    asOf: AS_OF,
  },
  ...thin("NY"),
  {
    state: "MA",
    topic: "vehicle",
    fact: "no-ban",
    blurb:
      "No Massachusetts statute was confirmed that bans sleeping in a lawfully parked car. On a state-highway safety rest area, a vehicle left unattended more than 30 consecutive minutes may be removed if signs announce that limit.",
    citation: "700 CMR 9.03",
    sourceUrl: "https://www.law.cornell.edu/regulations/massachusetts/700-CMR-9.03",
    asOf: AS_OF,
  },
  {
    state: "MA",
    topic: "camping",
    fact: "local",
    blurb:
      "No statewide street-camping ban was confirmed. Boston and other cities write their own rules for parks, sidewalks, and overnight parking.",
    citation: "Mass. Gen. Laws",
    sourceUrl: "https://malegislature.gov/Laws/GeneralLaws",
    asOf: AS_OF,
  },
  {
    state: "MA",
    topic: "fine",
    fact: "no-dollar",
    blurb:
      "700 CMR 9.03 does not print a dollar fine for sleeping in a car. The rest-area clause is about removing an unattended vehicle when signs are posted.",
    citation: "700 CMR 9.03",
    sourceUrl: "https://www.law.cornell.edu/regulations/massachusetts/700-CMR-9.03",
    asOf: AS_OF,
  },
  ...thin("RI"),
  ...thin("CT"),
  ...thin("DE"),
  {
    state: "MD",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "Maryland prohibits camping and overnight parking at State Highway Administration rest areas. That one-line rule does not mention a dollar fine and is not a statewide ban on every city street.",
    citation: "COMAR 11.04.07.11",
    sourceUrl: "https://dsd.maryland.gov/regulations/Pages/11.04.07.11.aspx",
    asOf: AS_OF,
  },
  {
    state: "MD",
    topic: "camping",
    fact: "local",
    blurb:
      "The rest-area ban is limited to those highway facilities. Baltimore and other cities set street and park rules separately. Assateague Island National Seashore is federal land and uses the National Park Service camping rule.",
    citation: "COMAR 11.04.07.11",
    sourceUrl: "https://dsd.maryland.gov/regulations/Pages/11.04.07.11.aspx",
    asOf: AS_OF,
  },
  {
    state: "MD",
    topic: "fine",
    fact: "no-dollar",
    blurb: "COMAR 11.04.07.11 does not print a dollar fine. It prohibits camping and overnight parking at rest areas.",
    citation: "COMAR 11.04.07.11",
    sourceUrl: "https://dsd.maryland.gov/regulations/Pages/11.04.07.11.aspx",
    asOf: AS_OF,
  },
  ...thin("DC"),
  {
    state: "VA",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "Virginia prohibits overnight parking in rest areas and prohibits sleeping in any section of the rest-area building. The regulation does not set a statewide ban on sleeping in a car on a city street.",
    citation: "24 VAC 30-51-30",
    sourceUrl: "https://law.lis.virginia.gov/admincode/title24/agency30/chapter51/section30/",
    asOf: AS_OF,
  },
  {
    state: "VA",
    topic: "camping",
    fact: "local",
    blurb:
      "The rest-area chapter is the statewide highway rule reviewed here. Richmond, Virginia Beach, and other cities can add their own ordinances. Shenandoah National Park uses the federal camping rule.",
    citation: "24 VAC 30-51-30",
    sourceUrl: "https://law.lis.virginia.gov/admincode/title24/agency30/chapter51/section30/",
    asOf: AS_OF,
  },
  {
    state: "VA",
    topic: "fine",
    fact: "no-dollar",
    blurb: "24 VAC 30-51-30 does not print a dollar fine for overnight rest-area parking or for sleeping in a car.",
    citation: "24 VAC 30-51-30",
    sourceUrl: "https://law.lis.virginia.gov/admincode/title24/agency30/chapter51/section30/",
    asOf: AS_OF,
  },
  {
    state: "NC",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "At a North Carolina scenic overlook, rest area, or other designated highway parking area, it is unlawful to erect tents, booths, or structures for camping or any other activity. The rule does not, in the text reviewed, name sleeping inside a vehicle as its own offense.",
    citation: "19A NCAC 02E .0407",
    sourceUrl: "https://www.ncdot.gov/about-us/how-we-operate/policy-process/rules/Documents/19a-ncac-02e-0407.pdf",
    asOf: AS_OF,
  },
  {
    state: "NC",
    topic: "camping",
    fact: "local",
    blurb:
      "The rest-area rule bans tents and structures at those highway sites. It is not a statewide city-street camping ban. Nags Head and Wilmington can write their own ordinances.",
    citation: "19A NCAC 02E .0407",
    sourceUrl: "https://www.ncdot.gov/about-us/how-we-operate/policy-process/rules/Documents/19a-ncac-02e-0407.pdf",
    asOf: AS_OF,
  },
  {
    state: "NC",
    topic: "fine",
    fact: "no-dollar",
    blurb: "19A NCAC 02E .0407 does not print a dollar fine for sleeping in a car.",
    citation: "19A NCAC 02E .0407",
    sourceUrl: "https://www.ncdot.gov/about-us/how-we-operate/policy-process/rules/Documents/19a-ncac-02e-0407.pdf",
    asOf: AS_OF,
  },
  ...thin("SC"),
  {
    state: "GA",
    topic: "vehicle",
    fact: "no-ban",
    blurb:
      "Georgia does not ban ordinary temporary resting or sleeping at a safety rest area, welcome center, or tourist center by a person traveling by vehicle. Outdoor camping on a state-highway road or on Department of Transportation property is a separate misdemeanor.",
    citation: "O.C.G.A. § 32-6-6",
    sourceUrl: "https://law.justia.com/codes/georgia/title-32/chapter-6/article-1/section-32-6-6/",
    asOf: AS_OF,
  },
  {
    state: "GA",
    topic: "camping",
    fact: "highway",
    blurb:
      "Knowingly camping on a state-highway road or on GDOT property is a misdemeanor. Camping means outdoor habitation shown by a tent or shelter, bedding, stored belongings, a fire, or cooking. The rest-area exception above is written into the same section.",
    citation: "O.C.G.A. § 32-6-6",
    sourceUrl: "https://law.justia.com/codes/georgia/title-32/chapter-6/article-1/section-32-6-6/",
    asOf: AS_OF,
  },
  {
    state: "GA",
    topic: "fine",
    fact: "misdemeanor-1000",
    blurb:
      "Section 32-6-6 says a conviction is a misdemeanor and does not print its own dollar amount. Georgia's general misdemeanor punishment is a fine not to exceed $1,000, confinement up to 12 months, or both.",
    citation: "O.C.G.A. § 32-6-6; § 17-10-3",
    sourceUrl: "https://law.justia.com/codes/georgia/title-17/chapter-10/article-1/section-17-10-3/",
    asOf: AS_OF,
  },
  {
    state: "FL",
    topic: "vehicle",
    fact: "carved-out",
    blurb:
      "Florida's public-camping statute excludes lodging overnight in a motor vehicle that is registered, insured, and parked where it may lawfully be. Separately, FDOT rest areas and welcome centers prohibit camping and limit general public parking to 3 hours, or 10 hours for a commercial driver under hours-of-service rules.",
    citation: "Fla. Stat. § 125.0231; Fla. Admin. Code r. 14-28.002",
    sourceUrl: "https://www.flsenate.gov/Laws/Statutes/2025/125.0231",
    asOf: AS_OF,
  },
  {
    state: "FL",
    topic: "camping",
    fact: "must-prohibit",
    blurb:
      "A county or municipality may not authorize anyone to regularly camp or sleep on public property, including a public building, its grounds, or a public right-of-way, except on a property the county designates under the statute's standards. The statute's remedy is a civil suit against the county or city, not a fine printed against the person sleeping.",
    citation: "Fla. Stat. § 125.0231",
    sourceUrl: "https://www.flsenate.gov/Laws/Statutes/2025/125.0231",
    asOf: AS_OF,
  },
  {
    state: "FL",
    topic: "fine",
    fact: "no-dollar",
    blurb:
      "Section 125.0231 does not sentence the person in the vehicle, and the rest-area rule prints no fine. If a city ordinance makes the conduct a crime, the usual municipal maximum is a fine not exceeding $500 and jail not exceeding 60 days. A county ordinance has the same usual maximum. A civil-infraction path caps the civil penalty at $500. The local ordinance has to be the one that actually imposes it.",
    citation: "Fla. Stat. §§ 125.0231, 125.69, 162.21, 162.22",
    sourceUrl: "https://www.flsenate.gov/Laws/Statutes/2026/162.22",
    asOf: AS_OF,
  },
  ...thin("AL"),
  ...thin("MS"),
  ...thin("LA"),
  {
    state: "TX",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "Texas has no confirmed statewide ban on sleeping in a car on a city street. At a TxDOT rest area it is an offense, after notice, to remain longer than 24 hours or to erect a tent, shelter, booth, or structure.",
    citation: "Tex. Transp. Code § 545.411",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/TN/htm/TN.545.htm#545.411",
    asOf: AS_OF,
  },
  {
    state: "TX",
    topic: "camping",
    fact: "local",
    blurb:
      "The rest-area offense is not a statewide city-street camping ban. Galveston, Corpus Christi, Brownsville, El Paso, and other cities can add ordinances. Big Bend National Park uses the federal camping rule.",
    citation: "Tex. Transp. Code § 545.411",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/TN/htm/TN.545.htm#545.411",
    asOf: AS_OF,
  },
  {
    state: "TX",
    topic: "fine",
    fact: "one-to-200",
    blurb:
      "The rest-area offense is a fine only. The general penalty is $1 to $200, and these sections do not authorize jail. A conviction also adds a $3 fine and a $50 state traffic fine. Court costs are separate.",
    citation: "Tex. Transp. Code §§ 542.401, 542.403, 542.4031",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/TN/htm/TN.542.htm#542.401",
    asOf: AS_OF,
  },
  ...thin("NM"),
  ...thin("AZ"),
  ...thin("NV"),
  {
    state: "CA",
    topic: "vehicle",
    fact: "rest-limit",
    blurb:
      "At a California highway safety roadside rest area or vista point, vehicles may not be parked and people may not remain more than 8 hours in any 24-hour period. No statewide statute was confirmed that bans sleeping in a car on every city street. Cities write those ordinances.",
    citation: "Cal. Code Regs. tit. 21, § 2205",
    sourceUrl: "https://www.law.cornell.edu/regulations/california/21-CCR-2205",
    asOf: AS_OF,
  },
  {
    state: "CA",
    topic: "camping",
    fact: "local",
    blurb:
      "The 8-hour rule is a rest-area and vista-point rule. San Francisco, Santa Barbara, Monterey, and other cities have their own street rules. Death Valley, Joshua Tree, and Redwood National Park use the federal camping rule.",
    citation: "Cal. Code Regs. tit. 21, § 2205",
    sourceUrl: "https://www.law.cornell.edu/regulations/california/21-CCR-2205",
    asOf: AS_OF,
  },
  {
    state: "CA",
    topic: "fine",
    fact: "infraction",
    blurb:
      "A first rest-area violation is an infraction. The general vehicle-infraction maximum is a base fine of $100, $200 for a second infraction within a year, or $250 for a later one. A second or later conviction of this rest-area section is a misdemeanor: up to a $1,000 fine, up to 6 months in county jail, or both. Penalty assessments are added on top of the base fine.",
    citation: "Cal. Veh. Code §§ 22520.6, 42001, 42002",
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=VEH&sectionNum=42002",
    asOf: AS_OF,
  },
  {
    state: "OR",
    topic: "vehicle",
    fact: "no-ban",
    blurb:
      "Oregon does not print a statewide ban on sleeping in a car. A city or county may allow an entity to host overnight vehicle camping by people who are homeless, and that host must provide a toilet, handwashing, and trash disposal.",
    citation: "ORS 195.520",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors195.html",
    asOf: AS_OF,
  },
  {
    state: "OR",
    topic: "camping",
    fact: "reasonable",
    blurb:
      "A city or county law that regulates sitting, lying, sleeping, or keeping warm and dry outdoors on public property open to the public must be objectively reasonable as to time, place, and manner for people experiencing homelessness. A 2026 bill to repeal this statute died in committee.",
    citation: "ORS 195.530",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors195.html",
    asOf: AS_OF,
  },
  {
    state: "OR",
    topic: "fine",
    fact: "no-dollar",
    blurb:
      "ORS 195.520 and 195.530 do not print a dollar fine for living in a car. Portland's camping ordinance is a separate city rule and, in the section reviewed, also prints no dollar amount.",
    citation: "ORS 195.520; ORS 195.530",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors195.html",
    asOf: AS_OF,
  },
  ...thin("WA"),
];

export function vehicleLawsForState(state: string) {
  return VEHICLE_LAWS.filter((row) => row.state === state.toUpperCase());
}

const NPS_STOPS = new Set([
  "Cuyahoga Valley",
  "Shenandoah",
  "Assateague Island",
  "Big Bend",
  "White Sands",
  "Petrified Forest",
  "Grand Canyon",
  "Death Valley",
  "Joshua Tree",
  "Redwoods",
  "Mount Rainier",
]);

const FL_STOPS = new Set([
  "Jacksonville",
  "St. Augustine",
  "Daytona Beach",
  "Space Coast",
  "Miami",
  "Naples",
  "Pensacola",
]);

const TX_CITY_STOPS = new Set(["Galveston", "Corpus Christi", "Brownsville", "El Paso"]);

function npsCard(stop: string): StopLaw {
  const seashore =
    stop === "Assateague Island"
      ? " This covers the national seashore. Maryland also runs a state park on the island with its own campground."
      : "";
  return {
    stop,
    vehicle: `${stop} is National Park Service land. Camping includes parking a motor vehicle, motor home, or trailer for the apparent purpose of overnight occupancy. Doing that outside a designated site is prohibited.${seashore}`,
    camping:
      "Camping outside designated sites or areas is prohibited. The superintendent can require a permit and add conditions for that park. A tent is not required for the definition to apply.",
    fine:
      "A violation is punishable by up to 6 months in prison, a fine under Title 18, or both. For an individual, a Class B misdemeanor that does not result in death is not more than $5,000, unless a higher gain-or-loss fine applies. An on-the-spot ticket can be lower than that maximum.",
    citation: "36 C.F.R. §§ 1.4, 2.10; 18 U.S.C. §§ 1865, 3571",
    sourceUrl: "https://www.law.cornell.edu/cfr/text/36/2.10",
    asOf: AS_OF,
  };
}

function floridaCard(stop: string): StopLaw {
  return {
    stop,
    vehicle: `In ${stop}, overnight lodging in a motor vehicle is outside Florida's definition of public camping or sleeping when the vehicle is registered, insured, and parked where it may lawfully be. FDOT rest areas and welcome centers still prohibit camping and limit general parking to 3 hours.`,
    camping: `${stop}'s county and city may not authorize regular public camping or sleeping on public property, except on a site designated under the statute. The statute lets a resident, a business, or the Attorney General sue the local government. It does not itself fine the person sleeping.`,
    fine: "Section 125.0231 does not jail or fine the person in the lawfully parked vehicle. If the city or county ordinance makes public camping a crime, the usual maximum the state allows is $500 and 60 days. A civil citation path caps the penalty at $500. No local ordinance for this stop was confirmed to impose that maximum.",
    citation: "Fla. Stat. §§ 125.0231, 162.22; Fla. Admin. Code r. 14-28.002",
    sourceUrl: "https://www.flsenate.gov/Laws/Statutes/2025/125.0231",
    asOf: AS_OF,
  };
}

function texasCityCard(stop: string): StopLaw {
  return {
    stop,
    vehicle: `${stop} has no confirmed citywide ban, in the sources checked, on sleeping in a car. At a TxDOT rest area it is an offense, after notice, to stay longer than 24 hours or to put up a tent, shelter, booth, or structure.`,
    camping:
      "That rest-area offense is not a citywide camping ban. A local ordinance or posted sign can still restrict a particular street, beach, or park.",
    fine: "The rest-area offense is a fine only: $1 to $200, plus a required $3 fine and a $50 state traffic fine. Those sections do not authorize jail. No separate city jail sentence for living in a car was confirmed for this stop.",
    citation: "Tex. Transp. Code §§ 545.411, 542.401, 542.403, 542.4031",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/TN/htm/TN.545.htm#545.411",
    asOf: AS_OF,
  };
}

const STOP_OVERRIDES: Record<string, StopLaw> = {
  Erie: {
    stop: "Erie",
    vehicle:
      "Presque Isle is a Pennsylvania state park, not a city street and not a PennDOT rest area. Overnight stays belong in designated campground sites. The PennDOT rule is separate: at a roadside rest area, remaining more than 2 hours is prohibited, and sleeping is limited to a legally parked vehicle.",
    camping:
      "State-park camping is a designated-site system run by the Department of Conservation and Natural Resources. The park page lists the campground; it is not a rule allowing sleep anywhere on the peninsula.",
    fine: "67 Pa. Code § 443.2 does not print a dollar fine, and it governs roadside rest areas rather than the state-park campground. No Presque Isle fine for sleeping in a car was confirmed beyond the park's own posted rules.",
    citation: "67 Pa. Code § 443.2; Presque Isle State Park",
    sourceUrl: "https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/presque-isle-state-park.html",
    asOf: AS_OF,
  },
  "New York City": {
    stop: "New York City",
    vehicle:
      "No New York City ordinance was confirmed that makes sleeping in a lawfully parked car its own offense. Leaving a motor vehicle that is not otherwise lawfully parked on a public street is unlawful. A disabled vehicle may remain up to three hours.",
    camping:
      "New York State has no confirmed statewide street-camping ban. New York City park and sidewalk rules are local and can still order a person to move.",
    fine: "For leaving a vehicle that is not lawfully parked, the criminal fine is not less than $50 or more than $250, imprisonment up to 10 days, or both, plus a civil penalty of not less than $25 or more than $100. That is a parking offense, not a fine printed for living in a car.",
    citation: "N.Y.C. Admin. Code § 16-122",
    sourceUrl: "https://codelibrary.amlegal.com/codes/newyorkcity/latest/NYCadmin/0-0-0-26202",
    asOf: AS_OF,
  },
  "San Francisco": {
    stop: "San Francisco",
    vehicle:
      "Police Code section 97 prohibits using a house car, camper, or trailer for habitation, including sleeping, on a public street or park from 10:00 p.m. to 6:00 a.m. It also prohibits using another motor vehicle as a dwelling during those hours in a residential zone. Police guidance says a citation is for lodging, which is more than merely sleeping, and that mere sleeping is deprioritized.",
    camping:
      "The same overnight window is what officers are told to use for Penal Code section 647(e), lodging in a vehicle without permission of the person who controls it. A highway rest area is a separate rule: 8 hours in any 24.",
    fine: "Police Code section 98 makes an article violation a misdemeanor: a fine not to exceed $1,000, county jail not to exceed 6 months, or both. Penal Code section 647(e) is also a misdemeanor, and the general misdemeanor maximum is the same 6 months and $1,000. A first rest-area violation is only an infraction, with a base fine up to $100.",
    citation: "S.F. Police Code §§ 97, 98; Cal. Penal Code §§ 647(e), 19",
    sourceUrl: "https://www.sanfranciscopolice.org/your-sfpd/policies/department-bulletins-notices/24-126",
    asOf: AS_OF,
  },
  "New Orleans": {
    stop: "New Orleans",
    vehicle:
      "A vehicle equipped with living accommodations and longer than 22 feet may not be parked on a street between 7:00 p.m. and 7:00 a.m. Living accommodations include a sink, wash facility, lavatory, mattress, stove, table, or refrigerator that can still be used for that purpose. A shorter car is not covered by this section.",
    camping:
      "This is a parking limit on large live-in vehicles, not a confirmed citywide ban on a person sleeping in an ordinary car. Louisiana has no confirmed statewide fine for living in a car.",
    fine: "The parking fine schedule lists section 154-1037 at $20, then $40 after 30 days and $80 after 60 days.",
    citation: "New Orleans Code §§ 154-1037, 154-699",
    sourceUrl: "https://library.municode.com/la/new_orleans/codes/code_of_ordinances",
    asOf: AS_OF,
  },
  Portland: {
    stop: "Portland",
    vehicle:
      "Oregon does not ban sleeping in a car statewide. A local host of overnight vehicle camping must provide a toilet, handwashing, and trash disposal. Portland's own street rules can still limit where a vehicle sits.",
    camping:
      "Portland makes it unlawful to camp on public property or a public right-of-way in listed ways, including blocking a sidewalk or driveway, fires, gas heaters, and leaving garbage. The city says camping is also barred when a person has access to reasonable alternate shelter, and that enforcement resumed in November 2025.",
    fine: "ORS 195.530 and the Portland section reviewed do not print a dollar fine for living in a car.",
    citation: "Portland City Code 14A.50.160; ORS 195.530",
    sourceUrl: "https://www.portland.gov/code/14/a50/160",
    asOf: AS_OF,
  },
  Seattle: {
    stop: "Seattle",
    vehicle:
      "Seattle does not, in the ordinance reviewed, make sleeping in a car its own crime. A vehicle may not be parked on a city street or other municipal property longer than 72 hours, unless a posted sign sets a shorter time. The city tells people living in a vehicle about assistance before ordinary enforcement.",
    camping:
      "Washington has no confirmed statewide street-camping ban. Seattle park and sidewalk rules are separate from the 72-hour parking rule. A 2026 council bill would later restrict motor homes and travel trailers; it is not the rule in force for an ordinary car on this page.",
    fine: "A vehicle over the 72-hour limit may be impounded. The municipal code's published base penalty for that line has been listed at $44. The court can change the schedule, so confirm the current amount before relying on it.",
    citation: "Seattle Municipal Code § 11.72.440",
    sourceUrl: "https://seattle.gov/transportation/projects-and-programs/programs/parking-program/parking-regulations/72-hour-on-street-parking-ordinance",
    asOf: AS_OF,
  },
  "Las Vegas": {
    stop: "Las Vegas",
    vehicle:
      "No Nevada statute was confirmed that sets a statewide fine for sleeping in a car. On a public right-of-way, Las Vegas makes it unlawful to sit, lie down, or camp or lodge. Camping includes sleeping outdoors, sleeping in a temporary shelter, cooking over a flame, or laying out bedding.",
    camping:
      "Before a warning, citation, or arrest, an officer must say the conduct violates the section, that resources are available, and that later violations have consequences. Stopping within a reasonable time after that notice is a defense.",
    fine: "The section does not print its own maximum. Nevada's general misdemeanor maximum is jail for not more than 6 months, a fine of not more than $1,000, or both. A third conviction within 12 months has a minimum of 10 days in jail, unless the court orders a treatment program instead.",
    citation: "Las Vegas Municipal Code §§ 10.86.010, 10.86.020; NRS 193.150",
    sourceUrl: "https://library.municode.com/nv/las_vegas/codes/code_of_ordinances?nodeId=TIT10PUPEMOWE_DIVXMICR_CH10.86CALOSIACWIPURI-WSPLO_10.86.010PR",
    asOf: AS_OF,
  },
  "Finger Lakes": {
    stop: "Finger Lakes",
    vehicle:
      "Finger Lakes is a region, not one city code. No New York statewide ban on sleeping in a lawfully parked car was confirmed. Each town's parking signs control the particular street.",
    camping: "State parks in the region limit camping to designated sites. That is a park rule, not a fine printed for living in a car on a village street.",
    fine: "No statewide dollar fine for living in a car was confirmed.",
    citation: "N.Y. Consolidated Laws",
    sourceUrl: "https://www.nysenate.gov/legislation/laws",
    asOf: AS_OF,
  },
  Adirondacks: {
    stop: "Adirondacks",
    vehicle:
      "Lake Placid and the Adirondack Park are not one municipal code. No New York statewide ban on sleeping in a lawfully parked car was confirmed. Forest Preserve and town rules can still close a pullout.",
    camping:
      "Camping on Forest Preserve and in state campgrounds follows Department of Environmental Conservation site rules. Those rules are not a statewide city-street fine.",
    fine: "No statewide dollar fine for living in a car was confirmed.",
    citation: "N.Y. Consolidated Laws",
    sourceUrl: "https://www.nysenate.gov/legislation/laws",
    asOf: AS_OF,
  },
  "Columbia River Gorge": {
    stop: "Columbia River Gorge",
    vehicle:
      "The Gorge is a national scenic area, not one city. On the Oregon side, state law does not ban sleeping in a car. A local vehicle-camping host must provide a toilet, handwashing, and trash disposal.",
    camping:
      "Oregon city and county rules on sitting, lying, or sleeping outdoors on public property must be objectively reasonable as to time, place, and manner. The federal scenic-area rules can also close a particular site.",
    fine: "ORS 195.520 and 195.530 do not print a dollar fine for living in a car.",
    citation: "ORS 195.520; ORS 195.530",
    sourceUrl: "https://www.oregonlegislature.gov/bills_laws/ors/ors195.html",
    asOf: AS_OF,
  },
};

export function stopLaw(stop: string | null | undefined): StopLaw | null {
  if (!stop) return null;
  if (STOP_OVERRIDES[stop]) return STOP_OVERRIDES[stop];
  if (NPS_STOPS.has(stop)) return npsCard(stop);
  if (FL_STOPS.has(stop)) return floridaCard(stop);
  if (TX_CITY_STOPS.has(stop)) return texasCityCard(stop);
  return null;
}

export function defaultStopNote(stop: string, state: string) {
  return `${stop} has no separate city fine, confirmed in the sources checked for this page, for sleeping in a car. Use the ${state} statutes below, plus posted signs and private-property rules.`;
}
