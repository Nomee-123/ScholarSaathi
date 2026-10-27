import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Filter,
  GraduationCap,
  Heart,
  Info,
  LockKeyhole,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { indianStates } from '../data/indianStates'
import { filterFinderResults, evaluateFinderMatch, getCoreProfileIssue, hasCoreFinderProfile, isStateWaitingForPortal, preparationAnswersFromProfile } from '../services/finder'
import type {
  AcademicLevel,
  ApplicationType,
  AppProgress,
  FinderData,
  FinderFilters,
  FinderResult,
  Language,
  OptionalStatus,
  Scholarship,
  StudentCategory,
  StudentFinderProfile,
  WizardAnswers,
} from '../types'

interface FinderPageProps {
  language: Language
  data: FinderData
  scholarships: Scholarship[]
  progress: AppProgress
  onProfileChange: (profile: StudentFinderProfile) => void
  onToggleSaved: (id: string) => void
  onOpenScholarshipDetails: (scholarship: Scholarship) => void
  onStartPreparation: (scholarship: Scholarship, answers: WizardAnswers) => void
  onResumePreparation: () => void
}

const levels: AcademicLevel[] = ['class10', 'class12', 'undergraduate', 'postgraduate', 'other']
const profileLevels: AcademicLevel[] = ['class10', 'class12', 'undergraduate', 'postgraduate', 'other', 'unknown']
const categories: StudentCategory[] = ['general', 'obc', 'sc', 'st', 'ebc', 'dnt', 'other']
const emptyFilters: FinderFilters = {
  academicLevel: 'all',
  category: 'all',
  status: 'all',
  search: '',
  sort: 'relevance',
  savedOnly: false,
}

const levelLabels: Record<AcademicLevel, { en: string; hi: string }> = {
  class10: { en: 'Class 10', hi: 'कक्षा 10' },
  class12: { en: 'Class 12', hi: 'कक्षा 12' },
  undergraduate: { en: 'Undergraduate', hi: 'स्नातक' },
  postgraduate: { en: 'Postgraduate', hi: 'स्नातकोत्तर' },
  other: { en: 'Other', hi: 'अन्य' },
  unknown: { en: 'Unknown / not sure', hi: 'पता नहीं / निश्चित नहीं' },
}

const categoryLabels: Record<StudentCategory, { en: string; hi: string }> = {
  general: { en: 'General', hi: 'सामान्य' },
  obc: { en: 'OBC', hi: 'OBC' },
  sc: { en: 'SC', hi: 'SC' },
  st: { en: 'ST', hi: 'ST' },
  ebc: { en: 'EBC', hi: 'EBC' },
  dnt: { en: 'DNT', hi: 'DNT' },
  other: { en: 'Other / prefer not to say', hi: 'अन्य / बताना नहीं चाहते' },
}

const optionalLabels: Record<OptionalStatus, { en: string; hi: string }> = {
  yes: { en: 'Yes', hi: 'हाँ' },
  no: { en: 'No', hi: 'नहीं' },
  'prefer-not-to-say': { en: 'Prefer not to say', hi: 'बताना नहीं चाहते' },
}

function SelectField({
  label,
  value,
  onChange,
  children,
  id,
  required = false,
  invalid = false,
  describedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  id: string
  required?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  return (
    <label className="finder-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} required={required} aria-required={required} aria-invalid={invalid} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  )
}

function sectionHasData(profile: StudentFinderProfile, keys: (keyof StudentFinderProfile)[]) {
  return keys.some((key) => profile[key] !== undefined && profile[key] !== '')
}

function verifiedDeadline(scholarship: Scholarship, language: Language) {
  const notice = scholarship.finder.portalNotice
  if (!notice.deadline || !notice.deadlineVerified) return null
  const date = new Date(`${notice.deadline}T00:00:00`)
  if (!Number.isFinite(date.getTime())) return null
  return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function FinderPage({
  language,
  data,
  scholarships,
  progress,
  onProfileChange,
  onToggleSaved,
  onOpenScholarshipDetails,
  onStartPreparation,
  onResumePreparation,
}: FinderPageProps) {
  const hi = language === 'hi'
  const [filters, setFilters] = useState<FinderFilters>(emptyFilters)
  const [marksError, setMarksError] = useState('')
  const [incomeError, setIncomeError] = useState('')
  const [profileAttempted, setProfileAttempted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(!hasCoreFinderProfile(data.profile))
  const profile = data.profile
  const profileIssue = getCoreProfileIssue(profile)
  const optionalStatusOptions = Object.keys(optionalLabels) as OptionalStatus[]
  const savedScholarships = scholarships.filter((scholarship) => data.savedScholarshipIds.includes(scholarship.id))
  const activeScholarship = scholarships.find((scholarship) => scholarship.id === progress.scholarshipId)
  const activeDocuments = activeScholarship?.documents ?? []
  const readyDocuments = activeDocuments.filter((document) => progress.documents[document.id] === 'ready').length
  const preparationPercent = activeDocuments.length ? Math.round((readyDocuments / activeDocuments.length) * 100) : 0
  const outstandingDocuments = activeDocuments.filter((document) => progress.documents[document.id] !== 'ready')
  const academicDone = sectionHasData(profile, ['academicLevel', 'currentClassYear', 'course', 'marksPercentage', 'state', 'domicileState', 'applicationType'])
  const circumstancesDone = sectionHasData(profile, ['socialCategory', 'ewsStatus', 'minorityStatus', 'disabilityStatus'])
  const financialDone = profile.annualFamilyIncome !== undefined
  const completedSections = [academicDone, circumstancesDone, financialDone].filter(Boolean).length

  const updateProfile = <K extends keyof StudentFinderProfile>(key: K, value: StudentFinderProfile[K]) => {
    onProfileChange({ ...profile, [key]: value })
  }

  const results = useMemo(() => {
    const evaluated = scholarships.map((scholarship) => evaluateFinderMatch(scholarship, profile))
    const matching = filterFinderResults(evaluated, filters)
    return filters.savedOnly
      ? matching.filter((result) => data.savedScholarshipIds.includes(result.scholarship.id))
      : matching
  }, [scholarships, profile, filters, data.savedScholarshipIds])
  const confirmedResults = results.filter((result) => result.status === 'confirmed')
  const possibleResults = results.filter((result) => result.status === 'possible')
  const verificationResults = results.filter((result) => result.status === 'needs-verification')

  function clearFilters() {
    setFilters(emptyFilters)
  }

  function clearProfile() {
    onProfileChange({})
    setMarksError('')
    setIncomeError('')
    setProfileAttempted(false)
    setProfileOpen(true)
  }

  function saveProfile() {
    setProfileAttempted(true)
    if (profileIssue || marksError) {
      setProfileOpen(true)
      const fieldId = profileIssue === 'academic-level'
        ? 'finder-level'
        : profileIssue === 'marks-choice'
          ? 'finder-marks-status'
          : 'finder-marks'
      window.setTimeout(() => document.getElementById(fieldId)?.focus(), 0)
      return
    }
    setProfileOpen(false)
  }

  function startPreparation(scholarship: Scholarship) {
    onStartPreparation(scholarship, preparationAnswersFromProfile(scholarship, profile))
  }

  function renderResult(result: FinderResult) {
    const scholarship = result.scholarship
    const notice = scholarship.finder.portalNotice
    const isSaved = data.savedScholarshipIds.includes(scholarship.id)
    const waitingState = profile.domicileState
    const isWaiting = isStateWaitingForPortal(scholarship, waitingState)
    const date = verifiedDeadline(scholarship, language)
    const statusLabel = result.status === 'confirmed'
      ? (hi ? 'पुष्ट मिलान' : 'Confirmed match')
      : result.status === 'possible'
        ? (hi ? 'संभावित मेल · पहले जाँचें' : 'Possible match · verify first')
        : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')
    const StatusIcon = result.status === 'confirmed' ? CheckCircle2 : result.status === 'possible' ? ShieldCheck : CircleHelp

    return (
      <article className="finder-result-card" key={scholarship.id}>
        <div className="finder-result-top">
          <span className={`finder-match-status ${result.status}`}>
            <StatusIcon size={15} />{statusLabel}
          </span>
          <button
            className={`finder-save-button ${isSaved ? 'is-saved' : ''}`}
            type="button"
            onClick={() => onToggleSaved(scholarship.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? (hi ? 'सेव छात्रवृत्ति हटाएँ' : `Unsave ${scholarship.shortName}`) : (hi ? 'छात्रवृत्ति सेव करें' : `Save ${scholarship.shortName}`)}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? (hi ? 'सेव है' : 'Saved') : (hi ? 'सेव करें' : 'Save')}
          </button>
        </div>
        <h3>{hi ? scholarship.nameHi : scholarship.name}</h3>
        <p className="finder-result-description">{hi ? scholarship.descriptionHi : scholarship.description}</p>
        <div className="finder-result-facts">
          <div><GraduationCap size={15} /><span>{hi ? scholarship.levelHi : scholarship.level}</span></div>
          <div><CalendarDays size={15} /><span>
            {date
              ? `${hi ? 'दिनांकित पोर्टल सूचना की समय-सीमा' : 'Dated portal-notice deadline'}: ${date}`
              : (hi ? 'कोई सत्यापित समय-सीमा उपलब्ध नहीं' : 'No verified deadline available')}
          </span></div>
          <div><Info size={15} /><span>{hi ? 'पोर्टल सूचना जाँची गई' : 'Portal notice checked'}: {notice.checkedOn}</span></div>
          {notice.applicationType && <div><Heart size={15} /><span>
            {hi ? 'सूचना में आवेदन' : 'Notice mentions'}: {notice.applicationType === 'fresh' ? (hi ? 'नया' : 'Fresh') : (hi ? 'नवीनीकरण' : 'Renewal')}
          </span></div>}
        </div>
        <details className="finder-explanation">
          <summary>{hi ? 'यह परिणाम क्यों दिख रहा है' : 'Why this appears'}</summary>
          <ul>{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </details>
        <details className="finder-explanation">
          <summary>{hi ? 'अभी क्या जाँचना बाकी है' : 'What you still need to check'}</summary>
          {result.criteriaToCheck.length > 0
            ? <ul>{result.criteriaToCheck.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
            : <p>{hi ? 'उपलब्ध सत्यापित मानदंड दिए गए विवरण से मेल खाते हैं। आधिकारिक पोर्टल पर फिर भी वर्तमान नियम देखें।' : 'The verified criteria match the details provided. Still re-check current rules on the official portal.'}</p>}
          <p>{hi
            ? 'परिणाम पात्रता, आवेदन जमा करने या स्वीकृति की गारंटी नहीं है।'
            : 'This result is not a guarantee of eligibility, submission, or approval.'}
          </p>
        </details>
        {notice.statesWaiting && waitingState && isWaiting && (
          <p className="finder-state-notice" role="status">
            {hi
              ? `${waitingState} के विद्यार्थियों के लिए पोर्टल की ${notice.checkedOn} वाली सूचना में प्रतीक्षा करने को कहा गया है। आवेदन से पहले वर्तमान स्थिति देखें।`
              : `The ${notice.checkedOn} portal notice asks students from ${waitingState} to wait. Recheck current availability before applying.`}
          </p>
        )}
        <div className="finder-result-actions">
          <button className="button button-secondary" type="button" onClick={() => onOpenScholarshipDetails(scholarship)}>
            {hi ? 'विवरण और आवेदन गाइड' : 'Details & application guide'}<ArrowRight size={15} />
          </button>
          <button className="button button-primary" type="button" onClick={() => startPreparation(scholarship)}>
            {hi ? 'तैयारी चेकलिस्ट खोलें' : 'Open preparation checklist'}<ArrowRight size={15} />
          </button>
          <a href={scholarship.sourceUrl} target="_blank" rel="noreferrer">
            {hi ? 'आधिकारिक स्रोत' : 'Official source'}<ExternalLink size={14} />
          </a>
        </div>
        <p className="finder-save-note">{hi ? 'सेव करने से आवेदन जमा नहीं होता।' : 'Saving does not submit an application.'}</p>
      </article>
    )
  }

  const groups: { id: string; status: FinderResult['status']; title: string; note: string; results: FinderResult[] }[] = [
    {
      id: 'confirmed-heading',
      status: 'confirmed',
      title: hi ? 'सत्यापित मानदंड से मेल' : 'Matches verified criteria',
      note: hi ? 'सभी आवश्यक शर्तों के लिए सत्यापित प्रमाण उपलब्ध है।' : 'Evidence is verified for every required condition.',
      results: confirmedResults,
    },
    {
      id: 'possible-heading',
      status: 'possible',
      title: hi ? 'संभावित सूची मेल' : 'Possible listing matches',
      note: hi ? 'यह पात्रता की पुष्टि नहीं है। आधिकारिक योजना नियम जाँचें।' : 'This is not confirmed eligibility. Verify official scheme rules.',
      results: possibleResults,
    },
    {
      id: 'verification-heading',
      status: 'needs-verification',
      title: hi ? 'सत्यापन ज़रूरी' : 'Needs verification',
      note: hi ? 'उपलब्ध जानकारी से मेल या अपात्रता तय नहीं की जा सकती।' : 'Available information is not enough to confirm a match or rule a scholarship out.',
      results: verificationResults,
    },
  ]

  return (
    <div className="finder-page">
      <header className="finder-heading">
        <span className="section-overline">{hi ? 'अपनी जानकारी के अनुसार खोजें' : 'A MORE PERSONAL WAY TO EXPLORE'}</span>
        <h1>{hi ? 'छात्रवृत्ति खोजें' : 'Find scholarships'}</h1>
        <p>{hi
          ? 'अपनी पढ़ाई की जानकारी भरें। हम उपलब्ध पोर्टल सूची से संभावित विकल्प दिखाएँगे—यह पात्रता का निर्णय नहीं है।'
          : 'Share a few details to explore relevant portal listings. Results are guidance, not an eligibility decision.'}
        </p>
      </header>

      <section className="finder-dashboard" aria-labelledby="finder-dashboard-title">
        <div className="finder-dashboard-heading">
          <div>
            <span className="section-overline">{hi ? 'आपकी तैयारी' : 'YOUR PREPARATION'}</span>
            <h2 id="finder-dashboard-title">{hi ? 'तैयारी डैशबोर्ड' : 'Preparation dashboard'}</h2>
          </div>
          <span className="finder-dashboard-saved"><Bookmark size={15} />{hi ? `${savedScholarships.length} सेव` : `${savedScholarships.length} saved`}</span>
        </div>
        {activeScholarship ? (
          <div className="finder-dashboard-content">
            <div className="finder-dashboard-progress">
              <span className="finder-progress-value" style={{ background: `conic-gradient(#398258 ${preparationPercent}%, #dcebe0 ${preparationPercent}% 100%)` }}>{preparationPercent}%</span>
              <div className="finder-progress-copy">
                <strong>{hi ? 'तैयारी चेकलिस्ट प्रगति' : 'Preparation checklist progress'}</strong>
                <span>{hi ? `${readyDocuments} / ${activeDocuments.length} मदें तैयार` : `${readyDocuments} of ${activeDocuments.length} checklist items marked ready`}</span>
                <div className="finder-progress-track" role="progressbar" aria-label={hi ? 'तैयारी की प्रगति' : 'Preparation progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={preparationPercent}>
                  <span style={{ width: `${preparationPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="finder-dashboard-next">
              <strong>{hi ? 'अगला कदम' : 'Recommended next step'}</strong>
              <p>{outstandingDocuments.length
                ? (hi ? 'चेकलिस्ट में बाकी मदें देखें और हर दस्तावेज़ की वास्तविक आवश्यकता आधिकारिक सूचना में जाँचें।' : 'Review outstanding checklist items and verify each document requirement in the official notice.')
                : (hi ? 'वर्तमान आधिकारिक योजना सूचना और आवश्यक दस्तावेज़ों की पुष्टि करें।' : 'Confirm the current official scheme notice and actual document requirements.')}
              </p>
              <button className="button button-primary" type="button" onClick={onResumePreparation}>
                {hi ? 'तैयारी फिर शुरू करें' : 'Resume preparation'}<ArrowRight size={15} />
              </button>
            </div>
            {outstandingDocuments.length > 0 && (
              <ul className="finder-outstanding-list">
                {outstandingDocuments.slice(0, 3).map((document) => (
                  <li key={document.id}><CircleHelp size={14} />{hi ? document.nameHi : document.name}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="finder-dashboard-empty">
            <p>{hi ? 'अभी कोई तैयारी चेकलिस्ट शुरू नहीं हुई है। सेव की गई छात्रवृत्ति या परिणाम से तैयारी शुरू करें।' : 'No preparation checklist started yet. Start from a saved scholarship or a result below.'}</p>
          </div>
        )}
        <p className="finder-readiness-note">{hi
          ? 'तैयारी प्रतिशत केवल दिखाई गई चेकलिस्ट की प्रगति है—छात्रवृत्ति मिलने की संभावना नहीं। दस्तावेज़ सूची उदाहरण हो सकती है, आधिकारिक आवश्यकता नहीं।'
          : 'The percentage measures checklist preparation progress only—not the chance of receiving a scholarship. Document items may be examples, not official requirements.'}
        </p>
        {savedScholarships.length > 0 && (
          <div className="finder-saved-section">
            <h3>{hi ? 'सेव की गई छात्रवृत्तियाँ' : 'Saved scholarships'}</h3>
            <ul>
              {savedScholarships.map((scholarship) => (
                <li key={scholarship.id}>
                  <span className="finder-saved-scholarship-label"><Bookmark size={14} />{scholarship.shortName}
                    {verifiedDeadline(scholarship, language) && <small>{hi ? 'सूचना की सत्यापित समय-सीमा' : 'Verified notice deadline'}: {verifiedDeadline(scholarship, language)} · {scholarship.finder.portalNotice.checkedOn}</small>}
                  </span>
                  <div>
                    <button type="button" onClick={() => onOpenScholarshipDetails(scholarship)}>{hi ? 'विवरण और गाइड' : 'Details & guide'}</button>
                    <button type="button" onClick={() => startPreparation(scholarship)}>{hi ? 'तैयारी खोलें' : 'Open preparation'}</button>
                    <button type="button" aria-label={hi ? `${scholarship.shortName} सेव से हटाएँ` : `Unsave ${scholarship.shortName}`} onClick={() => onToggleSaved(scholarship.id)}>{hi ? 'हटाएँ' : 'Remove'}</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="finder-layout">
        <section className="finder-profile-card" aria-labelledby="finder-profile-title">
          <div className="finder-card-heading finder-profile-heading">
            <span className="finder-section-icon"><GraduationCap size={19} /></span>
            <div><h2 id="finder-profile-title">{hi ? 'विद्यार्थी प्रोफ़ाइल' : 'Student profile'}</h2><p>{hi ? 'प्रोफ़ाइल विवरण · स्थानीय रूप से सेव' : 'Profile details · saved locally'}</p></div>
            <div className="finder-profile-actions">
              {profileOpen ? (
                <button className="finder-clear-button" type="button" onClick={clearProfile}><Trash2 size={14} />{hi ? 'फ़ॉर्म साफ़ करें' : 'Clear form'}</button>
              ) : (
                <button className="finder-clear-button" type="button" onClick={() => setProfileOpen(true)}>{hi ? 'प्रोफ़ाइल संपादित करें' : 'Edit profile'}</button>
              )}
            </div>
          </div>
          <div className="finder-profile-progress">
            <div className="finder-profile-progress-copy"><strong>{hi ? 'प्रोफ़ाइल प्रगति' : 'Profile progress'}</strong><span>{hi ? `${completedSections} / 3 अनुभागों में विवरण` : `${completedSections} of 3 sections have details`}</span></div>
            <div className="finder-profile-progress-track" role="progressbar" aria-label={hi ? 'प्रोफ़ाइल विवरण की प्रगति' : 'Profile details progress'} aria-valuemin={0} aria-valuemax={3} aria-valuenow={completedSections}>
              <span style={{ width: `${Math.round(completedSections / 3 * 100)}%` }} />
            </div>
          </div>
          {profileOpen ? (
            <>
              <div className="finder-privacy-note">
                <LockKeyhole size={16} />
                <p>{hi
                  ? 'श्रेणी और आय जैसी व्यक्तिगत जानकारी केवल तभी साझा करें जब आप सहज हों; ये हर योजना के लिए आवश्यक नहीं हैं। स्तर और अंक चुनें या “पता नहीं” बताएँ। जानकारी इस ब्राउज़र में स्थानीय रूप से सेव होती है और एन्क्रिप्टेड नहीं है; साझा डिवाइस पर न भरें। आधार, बैंक विवरण या दस्तावेज़ न दें।'
                  : 'Share personal details such as category and income only if comfortable; they are not needed for every scheme. Choose your level and marks, or select “Unknown / not sure”. Details are stored locally in this browser and are not encrypted; avoid shared devices. Never enter Aadhaar or bank details or upload documents.'}
                </p>
              </div>
              <p className="finder-required-note">{hi
                ? 'तारांकन (*) वाले शैक्षणिक फ़ील्ड प्रोफ़ाइल सहेजने के लिए ज़रूरी हैं। जानकारी न हो तो “पता नहीं” चुनें। व्यक्तिगत और वित्तीय विवरण साझा करना वैकल्पिक है।'
                : 'Academic fields marked (*) are required to save your profile. Choose “Unknown / not sure” when you do not know. Personal and financial details remain optional.'}
              </p>
              <section className="finder-form-section" id="finder-academic-section" aria-labelledby="finder-academic-title">
                <div className="finder-form-section-heading">
                  <span>01</span><div><h3 id="finder-academic-title">{hi ? 'शैक्षणिक विवरण' : 'Academic details'}</h3><p>{hi ? 'स्तर और अंक चुनें या “पता नहीं” चुनें। कक्षा, पाठ्यक्रम, राज्य और आवेदन प्रकार जहाँ लागू हों खाली छोड़े जा सकते हैं।' : 'Choose a level and marks status, or select “Unknown / not sure”. Class, course, location, and application type may be left blank.'}</p></div>
                  {academicDone && <CheckCircle2 size={17} aria-label={hi ? 'विवरण जोड़े गए' : 'Details added'} />}
                </div>
                <div className="finder-form-grid">
                  <SelectField id="finder-level" label={hi ? 'पढ़ाई का स्तर *' : 'Academic level *'} required invalid={profileAttempted && profileIssue === 'academic-level'} describedBy={profileAttempted && profileIssue === 'academic-level' ? 'finder-profile-error' : undefined} value={profile.academicLevel ?? ''} onChange={(value) => { setProfileAttempted(false); setMarksError(''); updateProfile('academicLevel', value ? value as AcademicLevel : undefined) }}>
                    <option value="">{hi ? 'स्तर चुनें' : 'Choose level'}</option>
                    {profileLevels.map((level) => <option key={level} value={level}>{hi ? levelLabels[level].hi : levelLabels[level].en}</option>)}
                  </SelectField>
                  {profile.academicLevel && profile.academicLevel !== 'unknown' && (
                    <>
                      {(profile.academicLevel === 'class10' || profile.academicLevel === 'class12') && (
                        <label className="finder-field" htmlFor="finder-year">
                          <span>{hi ? 'वर्तमान कक्षा' : 'Current class'}</span>
                          <input id="finder-year" type="text" maxLength={60} value={profile.currentClassYear ?? ''} onChange={(event) => updateProfile('currentClassYear', event.target.value || undefined)} placeholder={hi ? 'जैसे: कक्षा 10' : 'e.g. Class 10'} />
                        </label>
                      )}
                      {(profile.academicLevel === 'undergraduate' || profile.academicLevel === 'postgraduate' || profile.academicLevel === 'other') && (
                        <>
                          <label className="finder-field" htmlFor="finder-year">
                            <span>{hi ? 'वर्तमान वर्ष' : 'Current year'}</span>
                            <input id="finder-year" type="text" maxLength={60} value={profile.currentClassYear ?? ''} onChange={(event) => updateProfile('currentClassYear', event.target.value || undefined)} placeholder={hi ? 'जैसे: प्रथम वर्ष' : 'e.g. Year 1'} />
                          </label>
                          <label className="finder-field" htmlFor="finder-course">
                            <span>{hi ? 'पाठ्यक्रम' : 'Course'}</span>
                            <input id="finder-course" type="text" maxLength={100} value={profile.course ?? ''} onChange={(event) => updateProfile('course', event.target.value || undefined)} placeholder={hi ? 'जैसे: B.Sc.' : 'e.g. B.Sc.'} />
                          </label>
                        </>
                      )}
                      <SelectField
                        id="finder-marks-status"
                        label={hi ? 'अंक की जानकारी *' : 'Marks information *'}
                        required
                        invalid={profileAttempted && (profileIssue === 'marks-choice' || profileIssue === 'marks-required')}
                        describedBy={profileAttempted && (profileIssue === 'marks-choice' || profileIssue === 'marks-required') ? 'finder-profile-error' : 'finder-marks-help'}
                        value={profile.marksStatus ?? (typeof profile.marksPercentage === 'number' ? 'known' : profile.marksPercentage === null ? 'unknown' : '')}
                        onChange={(value) => {
                          setProfileAttempted(false)
                          setMarksError('')
                          if (value === 'unknown') {
                            onProfileChange({ ...profile, marksStatus: 'unknown', marksPercentage: null })
                          } else if (value === 'known') {
                            onProfileChange({ ...profile, marksStatus: 'known', marksPercentage: typeof profile.marksPercentage === 'number' ? profile.marksPercentage : undefined })
                          } else {
                            onProfileChange({ ...profile, marksStatus: undefined, marksPercentage: undefined })
                          }
                        }}
                      >
                        <option value="">{hi ? 'चुनें' : 'Choose'}</option>
                        <option value="known">{hi ? 'प्रतिशत पता है' : 'I know my percentage'}</option>
                        <option value="unknown">{hi ? 'पता नहीं / निश्चित नहीं' : 'Unknown / not sure'}</option>
                      </SelectField>
                      {profile.marksStatus === 'known' || (typeof profile.marksPercentage === 'number' && profile.marksStatus !== 'unknown') ? (
                        <label className="finder-field" htmlFor="finder-marks">
                          <span>{hi ? 'अंक / प्रतिशत (0–100) *' : 'Marks / percentage (0–100) *'}</span>
                          <input id="finder-marks" type="number" min="0" max="100" step="0.01" required value={profile.marksPercentage ?? ''} aria-required="true" aria-invalid={Boolean(marksError) || (profileAttempted && profileIssue !== null && profileIssue !== 'academic-level' && profileIssue !== 'marks-choice')} aria-describedby={marksError ? 'finder-marks-help finder-marks-error' : profileAttempted && profileIssue ? 'finder-profile-error finder-marks-help' : 'finder-marks-help'} onChange={(event) => {
                            const value = event.target.value ? Number(event.target.value) : undefined
                            if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100)) {
                              setMarksError(hi ? 'कृपया 0 से 100 के बीच अंक दर्ज करें।' : 'Enter a value between 0 and 100.')
                              return
                            }
                            setMarksError('')
                            onProfileChange({ ...profile, marksStatus: 'known', marksPercentage: value })
                          }} />
                          <small id="finder-marks-help">{hi ? 'यदि प्रतिशत नहीं पता, तो ऊपर “पता नहीं” चुनें। कुछ योजनाओं में अंक देखे जा सकते हैं; नियम यहाँ सत्यापित नहीं हैं।' : 'If you do not know the percentage, select “Unknown / not sure” above. Some schemes may consider marks; scheme rules here are unverified.'}</small>
                          {marksError && <small id="finder-marks-error" className="finder-input-error" role="alert">{marksError}</small>}
                        </label>
                      ) : <small id="finder-marks-help">{hi ? 'कुछ योजनाओं में अंक देखे जा सकते हैं; नियम यहाँ सत्यापित नहीं हैं।' : 'Some schemes may consider marks; scheme rules here are unverified.'}</small>}
                    </>
                  )}
                  {profileAttempted && profileIssue === 'academic-level' && <p id="finder-profile-error" className="finder-input-error finder-profile-error" role="alert">{hi ? 'आगे बढ़ने के लिए पढ़ाई का स्तर चुनें या “पता नहीं” चुनें।' : 'Choose an academic level or “Unknown / not sure” before continuing.'}</p>}
                  {profileAttempted && profileIssue && profileIssue !== 'academic-level' && <p id="finder-profile-error" className="finder-input-error finder-profile-error" role="alert">{hi
                    ? profileIssue === 'marks-choice' ? 'प्रतिशत पता है या “पता नहीं” चुनें।' : profileIssue === 'marks-required' ? 'प्रतिशत दर्ज करें या “पता नहीं” चुनें।' : 'अंक 0 से 100 के बीच दर्ज करें।'
                    : profileIssue === 'marks-choice' ? 'Choose whether you know your percentage or select “Unknown / not sure”.' : profileIssue === 'marks-required' ? 'Enter a percentage or select “Unknown / not sure”.' : 'Enter marks between 0 and 100.'}</p>}
                  <SelectField id="finder-state" label={hi ? 'पढ़ाई का राज्य' : 'State of study'} value={profile.state ?? ''} onChange={(value) => updateProfile('state', value || undefined)}>
                    <option value="">{hi ? 'राज्य चुनें' : 'Choose state'}</option>{indianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </SelectField>
                  <SelectField id="finder-domicile" label={hi ? 'अधिवास राज्य' : 'Domicile state'} value={profile.domicileState ?? ''} onChange={(value) => updateProfile('domicileState', value || undefined)}>
                    <option value="">{hi ? 'राज्य चुनें' : 'Choose state'}</option>{indianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                  </SelectField>
                  <SelectField id="finder-application-type" label={hi ? 'आवेदन प्रकार' : 'Application type'} value={profile.applicationType ?? ''} onChange={(value) => updateProfile('applicationType', value ? value as ApplicationType : undefined)}>
                    <option value="">{hi ? 'चुनें' : 'Choose type'}</option><option value="fresh">{hi ? 'नया आवेदन' : 'Fresh application'}</option><option value="renewal">{hi ? 'नवीनीकरण' : 'Renewal'}</option>
                  </SelectField>
                </div>
              </section>
              <section className="finder-form-section" id="finder-circumstances-section" aria-labelledby="finder-circumstances-title">
                <div className="finder-form-section-heading">
                  <span>02</span><div><h3 id="finder-circumstances-title">{hi ? 'श्रेणी और व्यक्तिगत परिस्थितियाँ' : 'Category & personal circumstances'}</h3><p>{hi ? 'केवल तभी साझा करें जब आप सहज हों; नियम योजना के अनुसार अलग होते हैं।' : 'Share only if comfortable; relevance varies by scheme.'}</p></div>
                  {circumstancesDone && <CheckCircle2 size={17} aria-label={hi ? 'विवरण जोड़े गए' : 'Details added'} />}
                </div>
                <div className="finder-form-grid">
                  <SelectField id="finder-category" label={hi ? 'सामाजिक श्रेणी' : 'Social category'} value={profile.socialCategory ?? ''} onChange={(value) => updateProfile('socialCategory', value ? value as StudentCategory : undefined)}>
                    <option value="">{hi ? 'चुनें या खाली छोड़ें' : 'Choose or leave blank'}</option>
                    {categories.map((category) => <option key={category} value={category}>{hi ? categoryLabels[category].hi : categoryLabels[category].en}</option>)}
                  </SelectField>
                  {(profile.socialCategory === 'general' || profile.socialCategory === 'other') && (
                    <SelectField id="finder-ews" label={hi ? 'EWS स्थिति' : 'EWS status'} value={profile.ewsStatus ?? ''} onChange={(value) => updateProfile('ewsStatus', value ? value as OptionalStatus : undefined)}>
                      <option value="">{hi ? 'चुनें यदि प्रासंगिक हो' : 'Choose if relevant'}</option>
                      {optionalStatusOptions.map((status) => <option key={status} value={status}>{hi ? optionalLabels[status].hi : optionalLabels[status].en}</option>)}
                    </SelectField>
                  )}
                  <SelectField id="finder-minority" label={hi ? 'अल्पसंख्यक स्थिति' : 'Minority status'} value={profile.minorityStatus ?? ''} onChange={(value) => updateProfile('minorityStatus', value ? value as OptionalStatus : undefined)}>
                    <option value="">{hi ? 'चुनें या खाली छोड़ें' : 'Choose or leave blank'}</option>
                    {optionalStatusOptions.map((status) => <option key={status} value={status}>{hi ? optionalLabels[status].hi : optionalLabels[status].en}</option>)}
                  </SelectField>
                  <SelectField id="finder-disability" label={hi ? 'दिव्यांगता स्थिति' : 'Disability status'} value={profile.disabilityStatus ?? ''} onChange={(value) => updateProfile('disabilityStatus', value ? value as OptionalStatus : undefined)}>
                    <option value="">{hi ? 'केवल प्रासंगिक होने पर' : 'Only if relevant'}</option>
                    {optionalStatusOptions.map((status) => <option key={status} value={status}>{hi ? optionalLabels[status].hi : optionalLabels[status].en}</option>)}
                  </SelectField>
                </div>
              </section>
              <section className="finder-form-section" id="finder-financial-section" aria-labelledby="finder-financial-title">
                <div className="finder-form-section-heading">
                  <span>03</span><div><h3 id="finder-financial-title">{hi ? 'वित्तीय विवरण' : 'Financial details'}</h3><p>{hi ? 'आय केवल उन योजनाओं के लिए प्रासंगिक हो सकती है जिनमें आय नियम हों।' : 'Income may matter only for schemes with an income rule.'}</p></div>
                  {financialDone && <CheckCircle2 size={17} aria-label={hi ? 'विवरण जोड़े गए' : 'Details added'} />}
                </div>
                <div className="finder-form-grid">
                  <label className="finder-field" htmlFor="finder-income">
                    <span>{hi ? 'वार्षिक पारिवारिक आय' : 'Annual family income'}</span>
                    <div className="finder-input-prefix"><span aria-hidden="true">₹</span><input id="finder-income" type="number" min="0" step="1000" value={profile.annualFamilyIncome ?? ''} aria-invalid={Boolean(incomeError)} aria-describedby={incomeError ? 'finder-income-help finder-income-error' : 'finder-income-help'} onChange={(event) => {
                      const value = event.target.value ? Number(event.target.value) : undefined
                      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
                        setIncomeError(hi ? 'आय शून्य या उससे अधिक होनी चाहिए।' : 'Income must be zero or greater.')
                        return
                      }
                      setIncomeError('')
                      updateProfile('annualFamilyIncome', value)
                    }} /></div>
                    <small id="finder-income-help">{hi ? 'कुछ योजनाओं में आय सीमा हो सकती है; यहाँ नियम सत्यापित नहीं हैं।' : 'Some schemes may have income limits; rules here are not verified.'}</small>
                    {incomeError && <small id="finder-income-error" className="finder-input-error" role="alert">{incomeError}</small>}
                  </label>
                </div>
              </section>
              <div className="finder-profile-footer">
                <p>{hi ? 'प्रोफ़ाइल बदलाव इस ब्राउज़र में अपने-आप सेव होते हैं।' : 'Profile changes are saved automatically in this browser.'}</p>
                <button className="button button-primary" type="button" onClick={saveProfile}>{hi ? 'प्रोफ़ाइल सहेजें' : 'Save profile'}<CheckCircle2 size={15} /></button>
              </div>
            </>
          ) : (
            <div className="finder-profile-collapsed">
              <p>{profile.academicLevel ? `${hi ? 'पढ़ाई का स्तर' : 'Academic level'}: ${hi ? levelLabels[profile.academicLevel].hi : levelLabels[profile.academicLevel].en}` : (hi ? 'कोई शैक्षणिक स्तर नहीं चुना गया।' : 'No academic level selected.')}</p>
              <p>{hi ? 'आपकी प्रोफ़ाइल जानकारी स्थानीय रूप से सेव है।' : 'Your profile details are saved locally.'}</p>
            </div>
          )}
          <div className="finder-section-jumps" aria-label={hi ? 'प्रोफ़ाइल अनुभाग' : 'Profile sections'}>
            {[
              ['finder-academic-section', hi ? 'शैक्षणिक' : 'Academic'],
              ['finder-circumstances-section', hi ? 'श्रेणी' : 'Category'],
              ['finder-financial-section', hi ? 'वित्तीय' : 'Financial'],
            ].map(([id, label]) => (
              <button type="button" key={id} onClick={() => {
                setProfileOpen(true)
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 0)
              }}>{label}</button>
            ))}
          </div>
        </section>

        <aside className="finder-side-note">
          <span className="finder-section-icon"><ShieldCheck size={18} /></span>
          <strong>{hi ? 'ईमानदार मिलान' : 'Careful matching'}</strong>
          <p>{hi
            ? 'संभावित मेल केवल पोर्टल सूची के व्यापक स्तर/श्रेणी पर आधारित है। अज्ञात नियम पास या फेल नहीं माने जाते।'
            : 'Possible matches use only broad portal listing information. Unknown rules are not treated as passes or failures.'}
          </p>
          <a href="https://scholarships.gov.in/scholarshipEligibility/" target="_blank" rel="noreferrer">
            {hi ? 'NSP पात्रता जाँच देखें' : 'Visit NSP eligibility check'}<ExternalLink size={14} />
          </a>
        </aside>
      </div>

      <section className="finder-results" aria-labelledby="finder-results-title">
        <div className="finder-results-heading">
          <div>
            <span className="section-overline">{hi ? 'आपके विकल्प' : 'YOUR OPTIONS'}</span>
            <h2 id="finder-results-title">{hi ? 'छात्रवृत्ति परिणाम' : 'Scholarship results'} <span>{results.length}</span></h2>
          </div>
          <button className="finder-clear-button" type="button" onClick={clearFilters}><SlidersHorizontal size={15} />{hi ? 'फ़िल्टर साफ़ करें' : 'Clear filters'}</button>
        </div>
        <div className="finder-filter-bar">
          <label className="finder-search" htmlFor="finder-search">
            <Search size={16} />
            <input id="finder-search" type="search" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder={hi ? 'नाम से खोजें' : 'Search scholarships'} />
          </label>
          <SelectField id="finder-filter-level" label={hi ? 'स्तर फ़िल्टर' : 'Level filter'} value={filters.academicLevel} onChange={(value) => setFilters((current) => ({ ...current, academicLevel: value ? value as AcademicLevel | 'all' : 'all' }))}>
            <option value="all">{hi ? 'सभी स्तर' : 'All levels'}</option>{levels.map((level) => <option key={level} value={level}>{hi ? levelLabels[level].hi : levelLabels[level].en}</option>)}
          </SelectField>
          <SelectField id="finder-filter-category" label={hi ? 'श्रेणी फ़िल्टर' : 'Category filter'} value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value ? value as StudentCategory | 'all' : 'all' }))}>
            <option value="all">{hi ? 'सभी श्रेणियाँ' : 'All categories'}</option>{categories.map((category) => <option key={category} value={category}>{hi ? categoryLabels[category].hi : categoryLabels[category].en}</option>)}
          </SelectField>
          <SelectField id="finder-filter-status" label={hi ? 'परिणाम' : 'Result status'} value={filters.status} onChange={(value) => setFilters({ ...filters, status: value as FinderFilters['status'] })}>
            <option value="all">{hi ? 'सभी परिणाम' : 'All results'}</option><option value="confirmed">{hi ? 'पुष्ट मिलान' : 'Confirmed matches'}</option><option value="possible">{hi ? 'संभावित मेल' : 'Possible matches'}</option><option value="needs-verification">{hi ? 'सत्यापन आवश्यक' : 'Needs verification'}</option>
          </SelectField>
          <SelectField id="finder-sort" label={hi ? 'क्रम' : 'Sort'} value={filters.sort} onChange={(value) => setFilters({ ...filters, sort: value as FinderFilters['sort'] })}>
            <option value="relevance">{hi ? 'प्रासंगिकता' : 'Relevance'}</option><option value="name">{hi ? 'नाम' : 'Name'}</option>
          </SelectField>
          <button className={`finder-saved-filter ${filters.savedOnly ? 'active' : ''}`} type="button" aria-pressed={filters.savedOnly} onClick={() => setFilters((current) => ({ ...current, savedOnly: !current.savedOnly }))}>
            <Bookmark size={14} fill={filters.savedOnly ? 'currentColor' : 'none'} />{hi ? 'केवल सेव' : 'Saved only'}
          </button>
        </div>
        <p className="finder-filter-explainer"><Filter size={14} />{hi
          ? 'फ़िल्टर केवल दिखाई गई सूची सीमित करते हैं। अज्ञात नियमों को पास या फेल नहीं माना जाता।'
          : 'Filters only narrow the displayed list. Unknown scheme rules are not treated as passes or failures.'}
        </p>
        {results.length === 0 ? (
          <div className="finder-empty-state">
            <Search size={23} />
            <h3>{hi ? 'कोई परिणाम नहीं मिला' : 'No scholarships found'}</h3>
            <p>{hi ? 'खोज या फ़िल्टर बदलें। इससे पात्रता का निर्णय नहीं होता।' : 'Try changing your search or filters. This is not an eligibility decision.'}</p>
            <button className="button button-secondary" type="button" onClick={clearFilters}>{hi ? 'फ़िल्टर साफ़ करें' : 'Clear filters'}</button>
          </div>
        ) : (
          <>
            {groups.filter((group) => group.results.length > 0).map((group) => (
              <section className="finder-result-group" aria-labelledby={group.id} key={group.id}>
                <div className="finder-group-title"><h3 id={group.id}>{group.title}</h3><span>{group.results.length}</span></div>
                <p className="finder-group-note">{group.note}</p>
                <div className="finder-results-grid">{group.results.map(renderResult)}</div>
              </section>
            ))}
          </>
        )}
      </section>
    </div>
  )
}
