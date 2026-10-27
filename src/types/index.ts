export type Language = 'en' | 'hi'
export type View = 'home' | 'finder' | 'guidance' | 'wizard' | 'summary' | 'login' | 'signup' | 'reset-password' | 'account'
export type PreparationView = Exclude<View, 'home' | 'finder' | 'login' | 'signup' | 'reset-password' | 'account'>
export type DocumentState = 'ready' | 'missing' | 'verify'
export type EligibilityStatus = 'likely-eligible' | 'likely-ineligible' | 'needs-verification'
export type AcademicLevel = 'class10' | 'class12' | 'undergraduate' | 'postgraduate' | 'other' | 'unknown'
export type StudentCategory = 'general' | 'obc' | 'sc' | 'st' | 'ebc' | 'dnt' | 'other'
export type OptionalStatus = 'yes' | 'no' | 'prefer-not-to-say'
export type ApplicationType = 'fresh' | 'renewal'
export type VerificationStatus = 'verified' | 'unverified' | 'unknown'

export interface CriterionRecord {
  id: string
  status: VerificationStatus
  relevance: 'relevant' | 'not-relevant' | 'unknown'
  value: string | number | boolean | null
  sourceUrl: string
  lastChecked: string
  required?: boolean
  profileField?: keyof StudentFinderProfile
  operator?: 'equals' | 'at-least' | 'at-most'
}

export interface PortalNotice {
  applicationType?: ApplicationType
  deadline?: string
  deadlineVerified?: boolean
  checkedOn: string
  openStatus?: 'open' | 'closed' | 'unknown'
  statesWaiting?: string[]
  note?: string
}

export interface FinderScholarshipMetadata {
  listedEducationBand: 'school' | 'college-university' | 'unknown'
  listedAcademicLevels?: AcademicLevel[]
  listedCategories: StudentCategory[]
  criteria: CriterionRecord[]
  portalNotice: PortalNotice
}

export interface StudentFinderProfile {
  academicLevel?: AcademicLevel
  currentClassYear?: string
  course?: string
  marksPercentage?: number | null
  marksStatus?: 'known' | 'unknown'
  socialCategory?: StudentCategory
  ewsStatus?: OptionalStatus
  minorityStatus?: OptionalStatus
  annualFamilyIncome?: number
  state?: string
  domicileState?: string
  applicationType?: ApplicationType
  disabilityStatus?: OptionalStatus
}

export interface FinderData {
  profile: StudentFinderProfile
  savedScholarshipIds: string[]
}

export interface FinderFilters {
  academicLevel: AcademicLevel | 'all'
  category: StudentCategory | 'all'
  status: 'all' | 'confirmed' | 'possible' | 'needs-verification'
  search: string
  sort: 'relevance' | 'name'
  savedOnly: boolean
}

export type FinderMatchStatus = 'confirmed' | 'possible' | 'needs-verification'

export interface FinderResult {
  scholarship: Scholarship
  status: FinderMatchStatus
  reasons: string[]
  criteriaToCheck: string[]
  levelMatchesListing: boolean | null
  categoryMatchesListing: boolean | null
}

export interface ScholarshipDocument {
  id: string
  name: string
  nameHi: string
  purpose: string
  purposeHi: string
  kind: 'document' | 'verification-task'
  requirementStatus: 'mandatory' | 'conditional' | 'unverified'
  obtainingInfo: string
  obtainingInfoHi: string
  formatInfo: string
  formatInfoHi: string
  sourceUrl?: string
  lastVerified?: string
}

export interface ApplicationGuideInstruction {
  id: string
  status: 'verified' | 'needs-verification'
  action: string
  actionHi: string
  information: string
  informationHi: string
  checkBeforeContinuing: string
  checkBeforeContinuingHi: string
  commonMistakes: string
  commonMistakesHi: string
  sourceUrl: string
  lastVerified: string
  actionUrl?: string
  appliesWhen?: string
  appliesWhenHi?: string
}

export interface ScholarshipApplicationGuide {
  instructions: ApplicationGuideInstruction[]
  remainingStepsStatus: 'verified' | 'needs-verification'
  sourceUrl: string
  lastVerified: string
}

export interface Scholarship {
  id: string
  name: string
  nameHi: string
  shortName: string
  description: string
  descriptionHi: string
  verifiedDetail: string
  verifiedDetailHi: string
  level: string
  levelHi: string
  sourceUrl: string
  applicationUrl: string
  lastVerified: string
  requirementsVerified: boolean
  finder: FinderScholarshipMetadata
  documents: ScholarshipDocument[]
  applicationGuide: ScholarshipApplicationGuide
}

export interface WizardAnswers {
  applicationType?: string
  studyLevel?: string
  state?: string
}

export interface AppProgress {
  scholarshipId: string
  answers: WizardAnswers
  documents: Record<string, DocumentState>
  step: number
  view: View
  resumeView?: PreparationView
}

export interface EligibilityResult {
  status: EligibilityStatus
  reasons: string[]
}
