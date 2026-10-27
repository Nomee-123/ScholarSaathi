import type {
  AcademicLevel,
  FinderData,
  FinderFilters,
  FinderResult,
  Scholarship,
  StudentCategory,
  StudentFinderProfile,
  WizardAnswers,
} from '../types'

const criteriaLabels: Record<string, string> = {
  academicLevel: 'whether the exact academic level or class is a condition',
  category: 'whether category is a condition and its rules',
  income: 'whether an income condition applies and its details',
  marks: 'whether marks or merit are conditions and their thresholds',
  state: 'whether state or domicile rules apply',
  course: 'whether course or institution restrictions apply',
  applicationType: 'which fresh or renewal application types are available',
  ews: 'whether EWS is relevant and its rules',
  minority: 'whether minority status is relevant and its rules',
  disability: 'whether disability status is relevant and its rules',
  gender: 'whether gender is a condition and its rules',
  documents: 'which documents are actually required',
}

function normalizeState(state: string): string {
  return state.toLocaleLowerCase() === 'kerala' ? 'keralam' : state.toLocaleLowerCase()
}

export function isStateWaitingForPortal(scholarship: Scholarship, state: string | undefined): boolean {
  return Boolean(state && scholarship.finder.portalNotice.statesWaiting?.some((waiting) => normalizeState(waiting) === normalizeState(state)))
}

function bandForLevel(level: AcademicLevel): 'school' | 'college-university' | null {
  if (level === 'class10' || level === 'class12') return 'school'
  if (level === 'undergraduate' || level === 'postgraduate') return 'college-university'
  return null
}

export function hasCoreFinderProfile(profile: StudentFinderProfile): boolean {
  return getCoreProfileIssue(profile) === null
}

export type CoreProfileIssue = 'academic-level' | 'marks-choice' | 'marks-required' | 'marks-invalid'

export function getCoreProfileIssue(profile: StudentFinderProfile): CoreProfileIssue | null {
  if (!profile.academicLevel) return 'academic-level'
  if (profile.academicLevel === 'unknown') return null
  if (profile.marksStatus === 'unknown') {
    return profile.marksPercentage === undefined || profile.marksPercentage === null ? null : 'marks-invalid'
  }
  if (profile.marksPercentage === null) return profile.marksStatus === 'known' ? 'marks-required' : null
  if (profile.marksPercentage === undefined) return profile.marksStatus === 'known' ? 'marks-required' : 'marks-choice'
  if (!Number.isFinite(profile.marksPercentage) || profile.marksPercentage < 0 || profile.marksPercentage > 100) return 'marks-invalid'
  return null
}

function criterionSatisfied(
  criterion: Scholarship['finder']['criteria'][number],
  profile: StudentFinderProfile,
): boolean {
  if (
    criterion.status !== 'verified' ||
    criterion.relevance === 'unknown' ||
    !criterion.sourceUrl ||
    !criterion.lastChecked
  ) return false
  if (criterion.relevance === 'not-relevant') return true
  if (criterion.required !== true || !criterion.profileField || !criterion.operator || criterion.value === null) return false

  const answer = profile[criterion.profileField]
  if (answer === undefined || answer === 'prefer-not-to-say') return false
  if (criterion.operator === 'equals') return answer === criterion.value
  if (typeof answer !== 'number' || typeof criterion.value !== 'number') return false
  return criterion.operator === 'at-least'
    ? answer >= criterion.value
    : answer <= criterion.value
}

function hasCompleteVerifiedEligibility(
  scholarship: Scholarship,
  profile: StudentFinderProfile,
): boolean {
  const criteria = scholarship.finder.criteria
  return criteria.length > 0 &&
    criteria.some((criterion) => criterion.relevance === 'relevant' && criterion.required === true) &&
    criteria.every((criterion) => criterionSatisfied(criterion, profile))
}

export function evaluateFinderMatch(
  scholarship: Scholarship,
  profile: StudentFinderProfile,
): FinderResult {
  const band = profile.academicLevel ? bandForLevel(profile.academicLevel) : null
  const listedBand = scholarship.finder.listedEducationBand
  const exactLevels = scholarship.finder.listedAcademicLevels
  const levelMatchesListing = profile.academicLevel && profile.academicLevel !== 'unknown' && exactLevels?.length
    ? exactLevels.includes(profile.academicLevel)
    : band && listedBand !== 'unknown' ? band === listedBand : null
  const listedCategories = scholarship.finder.listedCategories
  const categoryMatchesListing: boolean | null = profile.socialCategory && listedCategories.length > 0
    ? listedCategories.includes(profile.socialCategory)
    : null
  const criteriaToCheck = scholarship.finder.criteria
    .filter((criterion) => criterion.status !== 'verified' || criterion.relevance === 'unknown' ||
      (criterion.relevance === 'relevant' && !criterionSatisfied(criterion, profile)))
    .map((criterion) => criteriaLabels[criterion.id] ?? criterion.id)
  if (levelMatchesListing === false) criteriaToCheck.push('clarify the difference between the selected level and the broad audience in the portal listing')
  if (categoryMatchesListing === false) criteriaToCheck.push('check whether the official scheme category rules differ from the available portal listing text')
  const reasons: string[] = []
  const confirmed = profile.academicLevel !== undefined &&
    profile.academicLevel !== 'unknown' &&
    hasCompleteVerifiedEligibility(scholarship, profile)

  if (confirmed) {
    reasons.push('Every required eligibility condition has verified evidence and matches the information provided.')
  }

  if (!profile.academicLevel || profile.academicLevel === 'unknown') {
    reasons.push('An academic level is not known, so it cannot be compared against the broad education level named in the listing.')
  } else if (levelMatchesListing === true) {
    reasons.push('The selected level is within the broad school or college/university audience named in the portal listing.')
  } else if (levelMatchesListing === false) {
    reasons.push('The selected level does not match the broad audience named in the listing; this is not enough verified information to rule the scheme out.')
  } else {
    reasons.push('The listing does not specify a usable academic level for this comparison.')
  }

  if (profile.socialCategory) {
    if (categoryMatchesListing === true) {
      reasons.push('This category is named in the portal listing, but its scheme-specific conditions are not verified.')
    } else if (categoryMatchesListing === false) {
      reasons.push('This category is not named in the available listing text; category eligibility remains unverified.')
    } else {
      reasons.push('The available listing does not state category restrictions; no category match can be confirmed.')
    }
  } else {
    reasons.push('Category details are optional; the official category rules still need checking.')
  }

  if (isStateWaitingForPortal(scholarship, profile.domicileState)) {
    reasons.push(`The portal notice checked ${scholarship.finder.portalNotice.checkedOn} asks applicants domiciled in ${profile.domicileState} to wait; check for a current update.`)
  }
  if (profile.applicationType && scholarship.finder.portalNotice.applicationType) {
    reasons.push(`The dated portal notice mentions ${scholarship.finder.portalNotice.applicationType} applications; it does not establish which application types meet the full scheme rules.`)
  }

  return {
    scholarship,
    status: confirmed && levelMatchesListing !== false && categoryMatchesListing !== false
      ? 'confirmed'
      : levelMatchesListing === true && categoryMatchesListing !== false ? 'possible' : 'needs-verification',
    reasons,
    criteriaToCheck,
    levelMatchesListing,
    categoryMatchesListing,
  }
}

export function filterFinderResults(
  results: FinderResult[],
  filters: FinderFilters,
): FinderResult[] {
  const query = filters.search.trim().toLocaleLowerCase()
  const filtered = results.filter((result) => {
    const scholarship = result.scholarship
    if (filters.academicLevel !== 'all') {
      const band = bandForLevel(filters.academicLevel)
      const exactLevels = scholarship.finder.listedAcademicLevels
      if (exactLevels?.length && !exactLevels.includes(filters.academicLevel)) return false
      if (band && scholarship.finder.listedEducationBand !== 'unknown' && scholarship.finder.listedEducationBand !== band) return false
    }
    if (
      filters.category !== 'all' &&
      scholarship.finder.listedCategories.length > 0 &&
      !scholarship.finder.listedCategories.includes(filters.category)
    ) return false
    if (filters.status !== 'all' && result.status !== filters.status) return false
    if (query && !`${scholarship.name} ${scholarship.shortName}`.toLocaleLowerCase().includes(query)) return false
    return true
  })

  return filtered.sort((a, b) => {
    if (filters.sort === 'name') return a.scholarship.name.localeCompare(b.scholarship.name)
    const rank = { confirmed: 2, possible: 1, 'needs-verification': 0 }
    return rank[b.status] - rank[a.status] ||
      a.scholarship.name.localeCompare(b.scholarship.name)
  })
}

export function emptyFinderData(): FinderData {
  return { profile: {}, savedScholarshipIds: [] }
}

export function toggleSavedScholarship(ids: string[], scholarshipId: string): string[] {
  return ids.includes(scholarshipId)
    ? ids.filter((id) => id !== scholarshipId)
    : [...ids, scholarshipId]
}

export function preparationAnswersFromProfile(scholarship: Scholarship, profile: StudentFinderProfile): WizardAnswers {
  const answers: WizardAnswers = {}
  if (profile.applicationType) answers.applicationType = profile.applicationType
  if (profile.state) answers.state = profile.state
  const listedBand = scholarship.finder.listedEducationBand
  if (profile.academicLevel === 'class10' || profile.academicLevel === 'class12') {
    if (listedBand === 'school') answers.studyLevel = 'school'
  } else if (profile.academicLevel === 'undergraduate' || profile.academicLevel === 'postgraduate') {
    if (listedBand === 'college-university') answers.studyLevel = 'college'
  } else if (profile.academicLevel === 'other') {
    answers.studyLevel = 'other'
  }
  return answers
}

export function academicLevelOptions() {
  return ['class10', 'class12', 'undergraduate', 'postgraduate', 'other'] as const
}

export function categoryOptions(): readonly StudentCategory[] {
  return ['general', 'obc', 'sc', 'st', 'ebc', 'dnt', 'other']
}

export function getFinderOverview(
  scholarships: Scholarship[],
  profile: StudentFinderProfile,
  savedScholarshipIds: string[],
) {
  const results = scholarships.map((scholarship) => evaluateFinderMatch(scholarship, profile))
  return {
    possibleMatches: results.filter((result) => result.status === 'possible').length,
    needsVerification: results.filter((result) => result.status === 'needs-verification').length,
    savedCount: scholarships.filter((scholarship) => savedScholarshipIds.includes(scholarship.id)).length,
  }
}
