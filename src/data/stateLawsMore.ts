import type { LawFact, LawRecord, LawTopic } from "@/data/stateLaws";

const AS_OF = "2026-10-11";

function law(
  state: string,
  topic: LawTopic,
  fact: LawFact,
  blurb: string,
  citation: string,
  sourceUrl: string,
): LawRecord {
  return { state, topic, fact, blurb, citation, sourceUrl, asOf: AS_OF };
}

/**
 * Cited category rules for states that are not on the current route.
 * Audio follows the one-party / all-party split used on the route.
 * Hybrid states are filed under the rule that applies to a participant
 * recording their own in-person conversation, and the blurb says when a
 * phone call is stricter. Cannabis is adult-use, medical-only, or neither.
 * Firearms is whether a qualifying adult needs a permit to carry a handgun.
 * Not legal advice.
 */
export const MORE_STATE_LAWS: LawRecord[] = [
  law("AK", "recording", "one-party", "A participant may record a conversation. Alaska does not require every person’s consent.", "Alaska Stat. § 42.20.300", "https://www.akleg.gov/basis/statutes.asp"),
  law("AK", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use and unlicensed sale remain illegal.", "Alaska Stat. § 17.38.020", "https://www.akleg.gov/basis/statutes.asp"),
  law("AK", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a permit. Places such as schools and bars can still be off limits.", "Alaska Stat. § 11.61.220", "https://www.akleg.gov/basis/statutes.asp"),

  law("AR", "recording", "one-party", "A participant may record a conversation. Arkansas does not require every person’s consent.", "Ark. Code Ann. § 5-60-120", "https://www.arkleg.state.ar.us/"),
  law("AR", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "Ark. Const. amend. 98", "https://www.arkleg.state.ar.us/"),
  law("AR", "firearms", "permitless", "A qualifying adult may carry a handgun without a permit. A license is still available for travel in other states.", "Ark. Code Ann. § 5-73-120", "https://www.arkleg.state.ar.us/"),

  law("CO", "recording", "one-party", "A participant may record a conversation. Colorado does not require every person’s consent.", "Colo. Rev. Stat. § 18-9-303", "https://leg.colorado.gov/"),
  law("CO", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis under the state constitution. Public use remains restricted.", "Colo. Const. art. XVIII, § 16", "https://leg.colorado.gov/"),
  law("CO", "firearms", "permit", "Carrying a concealed handgun generally requires a permit. Local and building bans can still apply.", "Colo. Rev. Stat. § 18-12-105", "https://leg.colorado.gov/"),

  law("HI", "recording", "one-party", "A participant recording their own conversation is treated as one-party in practice. A hidden recording in a private place is the riskier case under the wiretap statute.", "Haw. Rev. Stat. § 803-42", "https://www.capitol.hawaii.gov/hrscurrent/"),
  law("HI", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "Haw. Rev. Stat. § 329-121", "https://www.capitol.hawaii.gov/hrscurrent/"),
  law("HI", "firearms", "permit", "Carrying a handgun requires a license. Hawaii’s carry rules remain among the stricter permit states.", "Haw. Rev. Stat. § 134-9", "https://www.capitol.hawaii.gov/hrscurrent/"),

  law("ID", "recording", "one-party", "A participant may record a conversation. Idaho does not require every person’s consent.", "Idaho Code § 18-6702", "https://legislature.idaho.gov/statutesrules/idstat/"),
  law("ID", "cannabis", "illegal", "Idaho has no medical or adult-use cannabis program. Possession remains a crime.", "Idaho Code § 37-2732", "https://legislature.idaho.gov/statutesrules/idstat/"),
  law("ID", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a permit.", "Idaho Code § 18-3302", "https://legislature.idaho.gov/statutesrules/idstat/"),

  law("IL", "recording", "all-party", "Recording a private conversation generally requires every person’s consent.", "720 ILCS 5/14-2", "https://www.ilga.gov/legislation/ilcs/ilcs.asp"),
  law("IL", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use and unlicensed sale remain illegal.", "410 ILCS 705/10-10", "https://www.ilga.gov/legislation/ilcs/ilcs.asp"),
  law("IL", "firearms", "permit", "Carrying a concealed handgun requires a concealed-carry license, and buying a gun requires a FOID card.", "430 ILCS 66/10", "https://www.ilga.gov/legislation/ilcs/ilcs.asp"),

  law("IN", "recording", "one-party", "A participant may record a conversation. Indiana does not require every person’s consent.", "Ind. Code ch. 35-33.5", "https://iga.in.gov/laws/current"),
  law("IN", "cannabis", "illegal", "Indiana has not legalized adult-use or a comprehensive medical program. Possession remains a crime. A narrow CBD exception is not a medical-marijuana program.", "Ind. Code § 35-48-4-11", "https://iga.in.gov/laws/current"),
  law("IN", "firearms", "permitless", "A qualifying adult may carry a handgun without a license.", "Ind. Code § 35-47-2-1", "https://iga.in.gov/laws/current"),

  law("IA", "recording", "one-party", "A participant may record a conversation. Iowa does not require every person’s consent.", "Iowa Code § 808B.2", "https://www.legis.iowa.gov/law/iowaCode"),
  law("IA", "cannabis", "illegal", "Iowa has not legalized adult-use cannabis. A limited CBD program is not a comprehensive medical program, and other possession remains a crime.", "Iowa Code § 124.401", "https://www.legis.iowa.gov/law/iowaCode"),
  law("IA", "firearms", "permitless", "A qualifying adult may carry a handgun without a permit.", "Iowa Code § 724.4", "https://www.legis.iowa.gov/law/iowaCode"),

  law("KS", "recording", "one-party", "A participant may record a conversation. Kansas does not require every person’s consent.", "Kan. Stat. Ann. § 21-6101", "https://www.ksrevisor.org/statutes/"),
  law("KS", "cannabis", "illegal", "Kansas has not legalized adult-use or a comprehensive medical program. Possession remains a crime.", "Kan. Stat. Ann. § 21-5706", "https://www.ksrevisor.org/statutes/"),
  law("KS", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a license.", "Kan. Stat. Ann. § 21-6302", "https://www.ksrevisor.org/statutes/"),

  law("KY", "recording", "one-party", "A participant may record a conversation. Kentucky does not require every person’s consent.", "Ky. Rev. Stat. § 526.020", "https://apps.legislature.ky.gov/law/statutes/"),
  law("KY", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "Ky. Rev. Stat. ch. 218B", "https://apps.legislature.ky.gov/law/statutes/"),
  law("KY", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a license.", "Ky. Rev. Stat. § 237.109", "https://apps.legislature.ky.gov/law/statutes/"),

  law("ME", "recording", "one-party", "A participant may record a conversation they could hear without a device. Maine’s statute is stricter for a recording the person could not have heard unaided.", "Me. Rev. Stat. tit. 15, § 710", "https://legislature.maine.gov/statutes/"),
  law("ME", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use remains restricted.", "Me. Rev. Stat. tit. 28-B, § 1501", "https://legislature.maine.gov/statutes/"),
  law("ME", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a permit.", "Me. Rev. Stat. tit. 25, § 2001-A", "https://legislature.maine.gov/statutes/"),

  law("MI", "recording", "one-party", "A participant may record their own conversation. The eavesdropping statute reads more broadly, but Sullivan v. Gray, 324 N.W.2d 58 (Mich. Ct. App. 1982), limits it to someone who is not part of the conversation.", "Mich. Comp. Laws § 750.539c", "https://www.legislature.mi.gov/"),
  law("MI", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use and unlicensed sale remain illegal.", "Mich. Comp. Laws § 333.27955", "https://www.legislature.mi.gov/"),
  law("MI", "firearms", "permit", "Carrying a concealed pistol generally requires a license.", "Mich. Comp. Laws § 28.425f", "https://www.legislature.mi.gov/"),

  law("MN", "recording", "one-party", "A participant may record a conversation. Minnesota does not require every person’s consent.", "Minn. Stat. § 626A.02", "https://www.revisor.mn.gov/statutes/"),
  law("MN", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use remains restricted.", "Minn. Stat. § 342.09", "https://www.revisor.mn.gov/statutes/"),
  law("MN", "firearms", "permit", "Carrying a pistol in public generally requires a permit to carry.", "Minn. Stat. § 624.714", "https://www.revisor.mn.gov/statutes/"),

  law("MO", "recording", "one-party", "Telephone recording is one-party under the wiretap statute. An in-person conversation where both people expect privacy has been treated as less clear by the Missouri Court of Appeals.", "Mo. Rev. Stat. § 542.402", "https://revisor.mo.gov/main/Home.aspx"),
  law("MO", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis under the state constitution. Public use remains restricted.", "Mo. Const. art. XIV, § 2", "https://revisor.mo.gov/main/Home.aspx"),
  law("MO", "firearms", "permitless", "A qualifying adult may carry a concealed firearm without a permit.", "Mo. Rev. Stat. § 571.030", "https://revisor.mo.gov/main/Home.aspx"),

  law("MT", "recording", "all-party", "Recording a conversation with a hidden device generally requires that the people in it know. An audible announcement can satisfy the statute.", "Mont. Code Ann. § 45-8-213", "https://leg.mt.gov/bills/mca/"),
  law("MT", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use remains restricted.", "Mont. Code Ann. § 16-12-106", "https://leg.mt.gov/bills/mca/"),
  law("MT", "firearms", "permitless", "A qualifying adult may carry a concealed firearm without a permit.", "Mont. Code Ann. § 45-8-316", "https://leg.mt.gov/bills/mca/"),

  law("NE", "recording", "one-party", "A participant may record a conversation. Nebraska does not require every person’s consent.", "Neb. Rev. Stat. § 86-290", "https://nebraskalegislature.gov/laws/browse-statutes.php"),
  law("NE", "cannabis", "medical-only", "Voters approved a medical cannabis program in 2024. Recreational possession is not legal. Licensed sales were not open as of October 2026.", "Nebraska Medical Cannabis Patient Protection Act (2024)", "https://nebraskalegislature.gov/laws/browse-statutes.php"),
  law("NE", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a permit.", "Neb. Rev. Stat. § 28-1202.01", "https://nebraskalegislature.gov/laws/browse-statutes.php"),

  law("NH", "recording", "all-party", "Recording a conversation generally requires every person’s consent.", "N.H. Rev. Stat. Ann. § 570-A:2", "https://www.gencourt.state.nh.us/rsa/html/indexes/default.html"),
  law("NH", "cannabis", "medical-only", "Registered patients may use therapeutic cannabis. Recreational possession is still a crime.", "N.H. Rev. Stat. Ann. ch. 126-X", "https://www.gencourt.state.nh.us/rsa/html/indexes/default.html"),
  law("NH", "firearms", "permitless", "A qualifying adult may carry a loaded handgun without a license.", "N.H. Rev. Stat. Ann. § 159:6", "https://www.gencourt.state.nh.us/rsa/html/indexes/default.html"),

  law("NJ", "recording", "one-party", "A participant may record a conversation. New Jersey does not require every person’s consent.", "N.J. Stat. Ann. § 2A:156A-4", "https://lis.njleg.state.nj.us/"),
  law("NJ", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use and unlicensed sale remain illegal.", "N.J. Stat. Ann. § 24:6I-31", "https://lis.njleg.state.nj.us/"),
  law("NJ", "firearms", "permit", "Carrying a handgun requires a permit to carry. New Jersey’s carry rules remain among the stricter permit states.", "N.J. Stat. Ann. § 2C:58-4", "https://lis.njleg.state.nj.us/"),

  law("ND", "recording", "one-party", "A participant may record a conversation. North Dakota does not require every person’s consent.", "N.D. Cent. Code § 12.1-15-02", "https://ndlegis.gov/general-information/north-dakota-century-code/"),
  law("ND", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "N.D. Cent. Code ch. 19-24.1", "https://ndlegis.gov/general-information/north-dakota-century-code/"),
  law("ND", "firearms", "permitless", "A qualifying adult may carry a concealed firearm without a license. The no-permit rule for nonresidents is narrower than for residents.", "N.D. Cent. Code § 62.1-04-02", "https://ndlegis.gov/general-information/north-dakota-century-code/"),

  law("OK", "recording", "one-party", "A participant may record a conversation. Oklahoma does not require every person’s consent.", "Okla. Stat. tit. 13, § 176.4", "https://www.oscn.net/applications/oscn/index.asp?ftdb=STOKST"),
  law("OK", "cannabis", "medical-only", "Licensed patients may use medical cannabis. Recreational possession is still a crime.", "Okla. Stat. tit. 63, § 420 et seq.", "https://www.oscn.net/applications/oscn/index.asp?ftdb=STOKST"),
  law("OK", "firearms", "permitless", "A qualifying adult may carry a handgun without a license.", "Okla. Stat. tit. 21, § 1272", "https://www.oscn.net/applications/oscn/index.asp?ftdb=STOKST"),

  law("SD", "recording", "one-party", "A participant may record a conversation. South Dakota does not require every person’s consent.", "S.D. Codified Laws § 23A-35A-20", "https://sdlegislature.gov/Statutes"),
  law("SD", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "S.D. Codified Laws ch. 34-20G", "https://sdlegislature.gov/Statutes"),
  law("SD", "firearms", "permitless", "A qualifying adult may carry a concealed pistol without a permit.", "S.D. Codified Laws § 22-14-9", "https://sdlegislature.gov/Statutes"),

  law("TN", "recording", "one-party", "A participant may record a conversation. Tennessee does not require every person’s consent.", "Tenn. Code Ann. § 39-13-601", "https://www.capitol.tn.gov/"),
  law("TN", "cannabis", "illegal", "Tennessee has not legalized adult-use or a comprehensive medical program. Possession of marijuana remains a crime. A narrow low-THC oil exception is not a medical-marijuana program.", "Tenn. Code Ann. § 39-17-417", "https://www.capitol.tn.gov/"),
  law("TN", "firearms", "permitless", "A qualifying adult may carry a handgun, openly or concealed, without a permit.", "Tenn. Code Ann. § 39-17-1307", "https://www.capitol.tn.gov/"),

  law("UT", "recording", "one-party", "A participant may record a conversation. Utah does not require every person’s consent.", "Utah Code Ann. § 77-23a-4", "https://le.utah.gov/xcode/code.html"),
  law("UT", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "Utah Code Ann. § 26B-4-201", "https://le.utah.gov/xcode/code.html"),
  law("UT", "firearms", "permitless", "A qualifying adult may carry a concealed firearm without a permit. If the weapons title was renumbered, confirm the current section before you rely on it.", "Utah Code Ann. § 76-10-523", "https://le.utah.gov/xcode/code.html"),

  law("VT", "recording", "one-party", "Vermont has no statute requiring every person’s consent. A participant may record. Federal law still requires that one person in the conversation agrees.", "18 U.S.C. § 2511(2)(d)", "https://legislature.vermont.gov/statutes/"),
  law("VT", "cannabis", "adult-use", "Adults 21 and older may possess a limited amount of cannabis. Public use remains restricted.", "Vt. Stat. Ann. tit. 18, § 4230", "https://legislature.vermont.gov/statutes/"),
  law("VT", "firearms", "permitless", "Vermont does not require a permit to carry a handgun. Other weapon crimes, including carrying with intent to commit a crime, still apply.", "Vt. Stat. Ann. tit. 13, § 4003", "https://legislature.vermont.gov/statutes/"),

  law("WV", "recording", "one-party", "A participant may record a conversation. West Virginia does not require every person’s consent.", "W. Va. Code § 62-1D-3", "https://code.wvlegislature.gov/"),
  law("WV", "cannabis", "medical-only", "Registered patients may use medical cannabis. Recreational possession is still a crime.", "W. Va. Code § 16A-3-1", "https://code.wvlegislature.gov/"),
  law("WV", "firearms", "permitless", "A qualifying adult may carry a concealed handgun without a permit.", "W. Va. Code § 61-7-7", "https://code.wvlegislature.gov/"),

  law("WI", "recording", "one-party", "A participant may record a conversation. Wisconsin does not require every person’s consent.", "Wis. Stat. § 968.31", "https://docs.legis.wisconsin.gov/statutes"),
  law("WI", "cannabis", "illegal", "Wisconsin has not legalized adult-use or a comprehensive medical program. Possession remains a crime. A narrow CBD exception is not a medical-marijuana program.", "Wis. Stat. § 961.41", "https://docs.legis.wisconsin.gov/statutes"),
  law("WI", "firearms", "permit", "Carrying a concealed weapon generally requires a license.", "Wis. Stat. § 175.60", "https://docs.legis.wisconsin.gov/statutes"),

  law("WY", "recording", "one-party", "A participant may record a conversation. Wyoming does not require every person’s consent.", "Wyo. Stat. Ann. § 7-3-702", "https://wyoleg.gov/statutes/statutes"),
  law("WY", "cannabis", "illegal", "Wyoming has not legalized adult-use or a comprehensive medical program. Possession remains a crime.", "Wyo. Stat. Ann. § 35-7-1031", "https://wyoleg.gov/statutes/statutes"),
  law("WY", "firearms", "permitless", "A qualifying adult may carry a concealed firearm without a permit.", "Wyo. Stat. Ann. § 6-8-104", "https://wyoleg.gov/statutes/statutes"),
];
