import type { Scholarship } from '../types'

const portal = 'https://scholarships.gov.in/'
const schemeList = 'https://scholarships.gov.in/All-Scholarships'
const eligibilityCheck = 'https://scholarships.gov.in/scholarshipEligibility/'
const portalHome = 'https://scholarships.gov.in/'
const otrPortal = 'https://scholarships.gov.in/otrapplication/#/login-page'
const checkedOn = '2026-10-27'

function unverifiedDocument(id: string, name: string, nameHi: string, purpose: string, purposeHi: string) {
  return {
    id,
    name,
    nameHi,
    purpose,
    purposeHi,
    kind: 'document' as const,
    requirementStatus: 'unverified' as const,
    obtainingInfo: 'Where to obtain and the responsible issuing authority: Needs verification in the current official scheme notice.',
    obtainingInfoHi: 'कहाँ से लें और जारी करने वाला अधिकारी: मौजूदा आधिकारिक योजना सूचना में सत्यापन आवश्यक है।',
    formatInfo: 'Required format and validity period: Needs verification.',
    formatInfoHi: 'आवश्यक प्रारूप और वैधता अवधि: सत्यापन आवश्यक है।',
  }
}

function documentListTask(scholarshipId: string) {
  return {
    id: `${scholarshipId}-verify-document-list`,
    name: 'Check the official document list',
    nameHi: 'आधिकारिक दस्तावेज़ सूची जाँचें',
    purpose: 'The exact mandatory and conditional documents are not verified in the sources reviewed. Use the official scheme notice before preparing or sharing documents.',
    purposeHi: 'जाँचे गए स्रोतों में अनिवार्य और शर्त-आधारित दस्तावेज़ सत्यापित नहीं हैं। दस्तावेज़ तैयार या साझा करने से पहले आधिकारिक योजना सूचना देखें।',
    kind: 'verification-task' as const,
    requirementStatus: 'unverified' as const,
    obtainingInfo: 'This is a preparation task, not a document to obtain.',
    obtainingInfoHi: 'यह तैयारी का काम है, प्राप्त करने वाला दस्तावेज़ नहीं।',
    formatInfo: 'Not applicable.',
    formatInfoHi: 'लागू नहीं।',
    sourceUrl: schemeList,
    lastVerified: checkedOn,
  }
}

const otrInstruction = {
  id: 'nsp-otr',
  status: 'verified' as const,
  action: 'If you do not already have an OTR, use the official NSP OTR service. NSP states that OTR is required to apply and can be generated using Aadhaar or an Aadhaar Enrolment ID.',
  actionHi: 'यदि आपके पास OTR नहीं है, तो आधिकारिक NSP OTR सेवा का उपयोग करें। NSP के अनुसार आवेदन के लिए OTR आवश्यक है और इसे आधार या आधार नामांकन ID से बनाया जा सकता है।',
  information: 'Your OTR. Aadhaar and enrolment details should only be entered on the official NSP service, never in ScholarSaathi.',
  informationHi: 'आपका OTR। आधार और नामांकन विवरण केवल आधिकारिक NSP सेवा पर दर्ज करें, ScholarSaathi में कभी नहीं।',
  checkBeforeContinuing: 'Confirm that you are on the official NSP OTR service and keep the OTR available for the official application.',
  checkBeforeContinuingHi: 'पुष्टि करें कि आप आधिकारिक NSP OTR सेवा पर हैं और आधिकारिक आवेदन के लिए OTR उपलब्ध रखें।',
  commonMistakes: 'No scheme-specific form mistakes are documented in the reviewed official source.',
  commonMistakesHi: 'जाँचे गए आधिकारिक स्रोत में योजना-विशिष्ट फ़ॉर्म की सामान्य गलतियाँ उपलब्ध नहीं हैं।',
  sourceUrl: portalHome,
  lastVerified: checkedOn,
  actionUrl: otrPortal,
}

const udidInstruction = {
  id: 'udid-consent',
  status: 'verified' as const,
  appliesWhen: 'For students with disabilities, if applicable to the student.',
  appliesWhenHi: 'दिव्यांग विद्यार्थियों के लिए, यदि विद्यार्थी पर लागू हो।',
  action: 'The NSP homepage says students with disabilities must first log in to the UDID portal and provide consent to share UDID details before submitting an NSP application.',
  actionHi: 'NSP होमपेज के अनुसार दिव्यांग विद्यार्थियों को NSP आवेदन जमा करने से पहले UDID पोर्टल में लॉग इन करके UDID विवरण साझा करने की सहमति देनी होगी।',
  information: 'Your UDID details and consent, handled only on the official UDID/NSP services.',
  informationHi: 'आपका UDID विवरण और सहमति—केवल आधिकारिक UDID/NSP सेवाओं पर।',
  checkBeforeContinuing: 'Follow the current official UDID and NSP instructions. This ScholarSaathi guide does not collect UDID details or consent.',
  checkBeforeContinuingHi: 'वर्तमान आधिकारिक UDID और NSP निर्देशों का पालन करें। ScholarSaathi यह विवरण या सहमति एकत्र नहीं करता।',
  commonMistakes: 'No scheme-specific form mistakes are documented in the reviewed official source.',
  commonMistakesHi: 'जाँचे गए आधिकारिक स्रोत में योजना-विशिष्ट फ़ॉर्म की सामान्य गलतियाँ उपलब्ध नहीं हैं।',
  sourceUrl: portalHome,
  lastVerified: checkedOn,
}

function applicationGuide() {
  return {
    instructions: [otrInstruction, udidInstruction],
    remainingStepsStatus: 'needs-verification' as const,
    sourceUrl: schemeList,
    lastVerified: checkedOn,
  }
}

function unknownCriteria(ids: string[], sourceUrl = eligibilityCheck) {
  return ids.map((id) => ({
    id,
    status: 'unknown' as const,
    relevance: 'unknown' as const,
    value: null,
    sourceUrl,
    lastChecked: checkedOn,
  }))
}

export const scholarships: Scholarship[] = [
  {
    id: 'pm-usp-csss',
    name: 'PM-USP Central Sector Scheme of Scholarship for College and University Students (CSSS) (Merit Based Scheme)',
    nameHi: 'पीएम-यूएसपी केंद्रीय क्षेत्र कॉलेज एवं विश्वविद्यालय छात्रवृत्ति योजना (CSSS, मेरिट आधारित)',
    shortName: 'PM-USP CSSS',
    description: 'A merit-based scholarship scheme listed on the National Scholarship Portal. Scheme rules and current application details must be checked on the official portal.',
    descriptionHi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर सूचीबद्ध मेरिट-आधारित छात्रवृत्ति योजना। योजना के नियम और वर्तमान आवेदन विवरण आधिकारिक पोर्टल पर जाँचें।',
    verifiedDetail: 'Portal notice checked 27 Oct 2026: renewal applications were listed as open, with a student application closing date of 31 Oct 2026. This is a dated portal notice, not verified scheme guidance; re-check the portal for changes.',
    verifiedDetailHi: '27 अक्टूबर 2026 को जाँची गई पोर्टल सूचना: नवीनीकरण आवेदन खुले सूचीबद्ध थे और छात्र आवेदन की अंतिम तिथि 31 अक्टूबर 2026 बताई गई थी। यह दिनांकित पोर्टल सूचना है, सत्यापित योजना मार्गदर्शन नहीं; बदलाव के लिए पोर्टल फिर जाँचें।',
    level: 'College & university',
    levelHi: 'कॉलेज और विश्वविद्यालय',
    sourceUrl: schemeList,
    applicationUrl: `${portal}ApplicationForm/`,
    lastVerified: '27 Oct 2026',
    requirementsVerified: false,
    finder: {
      listedEducationBand: 'college-university',
      listedCategories: [],
      criteria: unknownCriteria(['academicLevel', 'category', 'income', 'marks', 'state', 'course', 'applicationType', 'ews', 'minority', 'disability', 'documents']),
      portalNotice: {
        applicationType: 'renewal',
        deadline: '2026-10-31',
        deadlineVerified: true,
        checkedOn,
        openStatus: 'open',
        note: 'NSP portal notice says renewal applications are open; it does not establish the full scheme criteria.',
      },
    },
    documents: [
      unverifiedDocument('marksheet', 'Academic marksheet', 'शैक्षणिक अंकपत्र', 'May help confirm academic history if requested. Whether it is required for this scheme is unverified.', 'माँगे जाने पर शैक्षणिक जानकारी की पुष्टि में मदद कर सकता है। इस योजना में इसकी आवश्यकता सत्यापित नहीं है।'),
      unverifiedDocument('enrollment', 'Institution or enrollment proof', 'संस्थान या नामांकन का प्रमाण', 'May help confirm your course or enrollment if requested. Whether it is required for this scheme is unverified.', 'माँगे जाने पर पाठ्यक्रम या नामांकन की पुष्टि में मदद कर सकता है। इस योजना में इसकी आवश्यकता सत्यापित नहीं है।'),
      documentListTask('pm-usp-csss'),
    ],
    applicationGuide: applicationGuide(),
  },
  {
    id: 'pm-yasasvi-top-class',
    name: 'PM YASASVI Central Sector Scheme of Top Class Education in Schools for OBC, EBC and DNT Students',
    nameHi: 'पीएम यशस्वी: OBC, EBC और DNT विद्यार्थियों के लिए स्कूलों में उच्च स्तरीय शिक्षा योजना',
    shortName: 'PM YASASVI',
    description: 'A school education scheme for OBC, EBC and DNT students listed on the National Scholarship Portal. Scheme rules and current application details must be checked on the official portal.',
    descriptionHi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर सूचीबद्ध OBC, EBC और DNT विद्यार्थियों के लिए स्कूल शिक्षा योजना। योजना के नियम और वर्तमान आवेदन विवरण आधिकारिक पोर्टल पर जाँचें।',
    verifiedDetail: 'Portal notice checked 27 Oct 2026: fresh applications were listed through 30 Nov 2026, with Rajasthan, Keralam and Karnataka students asked to wait. This dated notice may change; check the portal for current state availability and scheme rules.',
    verifiedDetailHi: '27 अक्टूबर 2026 को जाँची गई पोर्टल सूचना: नए आवेदन 30 नवंबर 2026 तक खुले सूचीबद्ध थे और राजस्थान, केरलम व कर्नाटक के विद्यार्थियों को प्रतीक्षा करने को कहा गया था। यह दिनांकित सूचना बदल सकती है; वर्तमान राज्य उपलब्धता और योजना नियम पोर्टल पर जाँचें।',
    level: 'School',
    levelHi: 'स्कूल',
    sourceUrl: schemeList,
    applicationUrl: `${portal}ApplicationForm/`,
    lastVerified: '27 Oct 2026',
    requirementsVerified: false,
    finder: {
      listedEducationBand: 'school',
      listedCategories: ['obc', 'ebc', 'dnt'],
      criteria: unknownCriteria(['academicLevel', 'category', 'income', 'marks', 'state', 'course', 'applicationType', 'ews', 'minority', 'disability', 'documents']),
      portalNotice: {
        applicationType: 'fresh',
        deadline: '2026-11-30',
        deadlineVerified: true,
        checkedOn,
        openStatus: 'open',
        statesWaiting: ['Rajasthan', 'Keralam', 'Karnataka'],
        note: 'NSP page checked 27 Oct 2026 lists fresh applications through 30 Nov 2026. Its home notice asks students from Rajasthan, Keralam, and Karnataka to wait. These are dated portal availability facts, not scheme eligibility rules.',
      },
    },
    documents: [
      unverifiedDocument('marksheet', 'Academic marksheet', 'शैक्षणिक अंकपत्र', 'May help confirm academic history if requested. Whether it is required for this scheme is unverified.', 'माँगे जाने पर शैक्षणिक जानकारी की पुष्टि में मदद कर सकता है। इस योजना में इसकी आवश्यकता सत्यापित नहीं है।'),
      unverifiedDocument('enrollment', 'School or enrollment proof', 'स्कूल या नामांकन का प्रमाण', 'May help confirm school or enrollment if requested. Whether it is required for this scheme is unverified.', 'माँगे जाने पर स्कूल या नामांकन की पुष्टि में मदद कर सकता है। इस योजना में इसकी आवश्यकता सत्यापित नहीं है।'),
      documentListTask('pm-yasasvi-top-class'),
    ],
    applicationGuide: applicationGuide(),
  },
  {
    id: 'pm-yasasvi-top-class-college',
    name: 'PM YASASVI Central Sector Scheme of Top Class Education in College for OBC, EBC and DNT Students',
    nameHi: 'पीएम यशस्वी: OBC, EBC और DNT विद्यार्थियों के लिए कॉलेज में उच्च स्तरीय शिक्षा योजना',
    shortName: 'PM YASASVI College',
    description: 'A college-level scheme listed on the National Scholarship Portal. The portal listing does not establish the complete scheme-specific eligibility or document rules; check the official scheme guidance.',
    descriptionHi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर सूचीबद्ध कॉलेज-स्तरीय योजना। पोर्टल सूची पूरी योजना-पात्रता या दस्तावेज़ नियम स्थापित नहीं करती; आधिकारिक योजना मार्गदर्शन देखें।',
    verifiedDetail: 'The NSP listing checked 27 Oct 2026 names this college scheme and shows student applications through 31 Oct 2026. Eligibility criteria and documents have not been verified from scheme guidance.',
    verifiedDetailHi: '27 अक्टूबर 2026 को जाँची गई NSP सूची में यह कॉलेज योजना और 31 अक्टूबर 2026 तक छात्र आवेदन दिखाए गए हैं। योजना मार्गदर्शन से पात्रता मानदंड और दस्तावेज़ सत्यापित नहीं किए गए हैं।',
    level: 'College',
    levelHi: 'कॉलेज',
    sourceUrl: schemeList,
    applicationUrl: `${portal}ApplicationForm/`,
    lastVerified: '27 Oct 2026',
    requirementsVerified: false,
    finder: {
      listedEducationBand: 'college-university',
      listedCategories: ['obc', 'ebc', 'dnt'],
      criteria: unknownCriteria(
        ['academicLevel', 'category', 'income', 'marks', 'state', 'course', 'applicationType', 'ews', 'minority', 'disability', 'gender', 'documents'],
        schemeList,
      ),
      portalNotice: {
        deadline: '2026-10-31',
        deadlineVerified: true,
        checkedOn,
        openStatus: 'open',
        note: 'NSP All-Scholarships listing checked 27 Oct 2026 gives the student application closing date as 31 Oct 2026. This deadline is a portal notice, not a scheme eligibility rule.',
      },
    },
    documents: [documentListTask('pm-yasasvi-top-class-college')],
    applicationGuide: applicationGuide(),
  },
  {
    id: 'aicte-pragati-degree',
    name: 'AICTE - Pragati Scholarship Scheme for Girl Students (Technical Degree)',
    nameHi: 'AICTE - तकनीकी डिग्री की छात्राओं के लिए प्रगति छात्रवृत्ति योजना',
    shortName: 'AICTE Pragati (Degree)',
    description: 'A technical-degree scholarship listing on the National Scholarship Portal. The listing alone does not verify the scheme eligibility, selection, or document requirements.',
    descriptionHi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर सूचीबद्ध तकनीकी डिग्री छात्रवृत्ति। केवल पोर्टल सूची से योजना-पात्रता, चयन या दस्तावेज़ आवश्यकताएँ सत्यापित नहीं होतीं।',
    verifiedDetail: 'The NSP listing checked 27 Oct 2026 names the technical-degree scheme and shows student applications through 31 Oct 2026. Scheme rules and required documents remain unverified here.',
    verifiedDetailHi: '27 अक्टूबर 2026 को जाँची गई NSP सूची में तकनीकी डिग्री योजना और 31 अक्टूबर 2026 तक छात्र आवेदन दिखाए गए हैं। योजना नियम और आवश्यक दस्तावेज़ यहाँ सत्यापित नहीं हैं।',
    level: 'Technical degree',
    levelHi: 'तकनीकी डिग्री',
    sourceUrl: schemeList,
    applicationUrl: `${portal}ApplicationForm/`,
    lastVerified: '27 Oct 2026',
    requirementsVerified: false,
    finder: {
      listedEducationBand: 'college-university',
      listedCategories: [],
      criteria: unknownCriteria(
        ['academicLevel', 'category', 'income', 'marks', 'state', 'course', 'applicationType', 'ews', 'minority', 'disability', 'gender', 'documents'],
        schemeList,
      ),
      portalNotice: {
        deadline: '2026-10-31',
        deadlineVerified: true,
        checkedOn,
        openStatus: 'open',
        note: 'NSP All-Scholarships listing checked 27 Oct 2026 gives the student application closing date as 31 Oct 2026. This deadline is a portal notice, not a scheme eligibility rule.',
      },
    },
    documents: [documentListTask('aicte-pragati-degree')],
    applicationGuide: applicationGuide(),
  },
  {
    id: 'ugc-national-scholarship-pg',
    name: 'National Scholarship for Post Graduate Studies',
    nameHi: 'स्नातकोत्तर अध्ययन के लिए राष्ट्रीय छात्रवृत्ति',
    shortName: 'National Scholarship for PG Studies',
    description: 'A postgraduate scholarship listing on the National Scholarship Portal. Scheme-specific eligibility and document requirements must be confirmed from official scheme guidance.',
    descriptionHi: 'राष्ट्रीय छात्रवृत्ति पोर्टल पर सूचीबद्ध स्नातकोत्तर छात्रवृत्ति। योजना-विशिष्ट पात्रता और दस्तावेज़ आवश्यकताओं की पुष्टि आधिकारिक योजना मार्गदर्शन से करें।',
    verifiedDetail: 'The NSP listing checked 27 Oct 2026 names this postgraduate scheme and shows student applications through 31 Oct 2026. Exact eligibility conditions and documents are not verified here.',
    verifiedDetailHi: '27 अक्टूबर 2026 को जाँची गई NSP सूची में यह स्नातकोत्तर योजना और 31 अक्टूबर 2026 तक छात्र आवेदन दिखाए गए हैं। सटीक पात्रता शर्तें और दस्तावेज़ यहाँ सत्यापित नहीं हैं।',
    level: 'Postgraduate',
    levelHi: 'स्नातकोत्तर',
    sourceUrl: schemeList,
    applicationUrl: `${portal}ApplicationForm/`,
    lastVerified: '27 Oct 2026',
    requirementsVerified: false,
    finder: {
      listedEducationBand: 'college-university',
      listedAcademicLevels: ['postgraduate'],
      listedCategories: [],
      criteria: unknownCriteria(
        ['academicLevel', 'category', 'income', 'marks', 'state', 'course', 'applicationType', 'ews', 'minority', 'disability', 'gender', 'documents'],
        schemeList,
      ),
      portalNotice: {
        deadline: '2026-10-31',
        deadlineVerified: true,
        checkedOn,
        openStatus: 'open',
        note: 'NSP All-Scholarships listing checked 27 Oct 2026 gives the student application closing date as 31 Oct 2026. This deadline is a portal notice, not a scheme eligibility rule.',
      },
    },
    documents: [documentListTask('ugc-national-scholarship-pg')],
    applicationGuide: applicationGuide(),
  },
]
