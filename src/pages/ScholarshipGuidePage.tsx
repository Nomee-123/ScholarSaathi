import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  FileText,
  Info,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import { evaluateFinderMatch } from '../services/finder'
import { getPreparationProgress } from '../services/preparation'
import type {
  AppProgress,
  DocumentState,
  FinderData,
  Language,
  Scholarship,
} from '../types'

interface ScholarshipGuidePageProps {
  language: Language
  scholarship: Scholarship
  finderData: FinderData
  progress: AppProgress
  onBack: () => void
  onStartPreparation: () => void
  onDocumentChange: (id: string, state: DocumentState) => void
  onToggleSaved: (id: string) => void
}

const criterionLabels: Record<string, { en: string; hi: string }> = {
  academicLevel: { en: 'Academic level or class', hi: 'शैक्षणिक स्तर या कक्षा' },
  category: { en: 'Category', hi: 'श्रेणी' },
  income: { en: 'Family income', hi: 'पारिवारिक आय' },
  marks: { en: 'Marks or merit', hi: 'अंक या मेरिट' },
  state: { en: 'State or domicile', hi: 'राज्य या अधिवास' },
  course: { en: 'Course or institution', hi: 'पाठ्यक्रम या संस्थान' },
  applicationType: { en: 'Fresh or renewal application rules', hi: 'नया या नवीनीकरण आवेदन नियम' },
  ews: { en: 'EWS status', hi: 'EWS स्थिति' },
  minority: { en: 'Minority status', hi: 'अल्पसंख्यक स्थिति' },
  disability: { en: 'Disability status', hi: 'दिव्यांगता स्थिति' },
  gender: { en: 'Gender requirements', hi: 'लिंग संबंधी आवश्यकताएँ' },
  documents: { en: 'Required documents', hi: 'आवश्यक दस्तावेज़' },
}

const documentStates: Record<DocumentState, { en: string; hi: string }> = {
  ready: { en: 'Prepared / done', hi: 'तैयार / पूरा' },
  missing: { en: 'Not prepared', hi: 'तैयार नहीं' },
  verify: { en: 'Needs checking', hi: 'जाँच आवश्यक' },
}

function formattedDeadline(date: string | undefined, language: Language) {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00`)
  if (!Number.isFinite(parsed.getTime())) return null
  return parsed.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ScholarshipGuidePage({
  language,
  scholarship,
  finderData,
  progress,
  onBack,
  onStartPreparation,
  onDocumentChange,
  onToggleSaved,
}: ScholarshipGuidePageProps) {
  const hi = language === 'hi'
  const match = evaluateFinderMatch(scholarship, finderData.profile)
  const checklistProgress = getPreparationProgress(scholarship, progress)
  const notice = scholarship.finder.portalNotice
  const deadline = notice.deadlineVerified ? formattedDeadline(notice.deadline, language) : null
  const saved = finderData.savedScholarshipIds.includes(scholarship.id)

  return (
    <div className="scholarship-guide-page">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={16} />{hi ? 'छात्रवृत्तियों पर लौटें' : 'Back to scholarships'}</button>
      <header className="scholarship-guide-hero">
        <div>
          <span className="section-overline">{hi ? 'छात्रवृत्ति मार्गदर्शिका' : 'SCHOLARSHIP GUIDANCE'}</span>
          <h1>{hi ? scholarship.nameHi : scholarship.name}</h1>
          <p>{hi ? scholarship.descriptionHi : scholarship.description}</p>
        </div>
        <button className={`finder-save-button ${saved ? 'is-saved' : ''}`} type="button" onClick={() => onToggleSaved(scholarship.id)} aria-pressed={saved}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? (hi ? 'सेव है' : 'Saved') : (hi ? 'सेव करें' : 'Save scholarship')}
        </button>
      </header>

      <section className="guide-source-strip" aria-label={hi ? 'आधिकारिक स्रोत और स्थिति' : 'Official source and status'}>
        <span className={`finder-match-status ${match.status === 'possible' ? 'possible' : ''}`}>
          {match.status === 'possible' ? <ShieldCheck size={15} /> : <CircleHelp size={15} />}
          {match.status === 'possible'
            ? (hi ? 'संभावित सूची मेल · पात्रता पुष्टि नहीं' : 'Possible listing match · not eligibility confirmation')
            : (hi ? 'पात्रता सत्यापन आवश्यक' : 'Eligibility needs verification')}
        </span>
        <span><Info size={14} />{hi ? 'सूची जाँच' : 'Listing checked'}: {scholarship.lastVerified}</span>
        <a href={scholarship.sourceUrl} target="_blank" rel="noreferrer">{hi ? 'आधिकारिक योजना सूची' : 'Official scheme listing'}<ExternalLink size={14} /></a>
      </section>

      <nav className="guide-jump-nav" aria-label={hi ? 'मार्गदर्शिका अनुभाग' : 'Guidance sections'}>
        <a href="#guide-eligibility">{hi ? 'पात्रता' : 'Eligibility'}</a>
        <a href="#guide-documents">{hi ? 'दस्तावेज़ चेकलिस्ट' : 'Document checklist'}</a>
        <a href="#application-guide">{hi ? 'आवेदन गाइड' : 'Application guide'}</a>
      </nav>

      <section className="guide-panel" id="guide-eligibility" aria-labelledby="guide-eligibility-title">
        <div className="guide-panel-heading">
          <span className="finder-section-icon"><ShieldCheck size={19} /></span>
          <div><h2 id="guide-eligibility-title">{hi ? 'पात्रता और आवेदन विवरण' : 'Eligibility and application details'}</h2><p>{hi ? 'सूची में दिखी जानकारी योजना की पूरी पात्रता शर्तें नहीं है।' : 'Portal listing details do not establish the full scheme eligibility rules.'}</p></div>
        </div>
        <div className="guide-fact-grid">
          <div><span>{hi ? 'पात्रता मिलान' : 'Eligibility match'}</span><strong>{match.status === 'possible' ? (hi ? 'संभावित · सत्यापित नहीं' : 'Possible · not verified') : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')}</strong><p>{hi ? 'पात्रता की पुष्टि नहीं; आधिकारिक योजना नियम देखें।' : 'Not an eligibility confirmation. Check the official scheme rules.'}</p></div>
          <div><span>{hi ? 'सूचना में आवेदन प्रकार' : 'Application type in portal notice'}</span><strong>{notice.applicationType === 'fresh' ? (hi ? 'नया आवेदन' : 'Fresh') : notice.applicationType === 'renewal' ? (hi ? 'नवीनीकरण' : 'Renewal') : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')}</strong><p>{hi ? `पोर्टल सूचना, ${notice.checkedOn}; यह पूरी पात्रता नियमावली नहीं है।` : `Portal notice dated ${notice.checkedOn}; this does not establish full scheme rules.`}</p></div>
          <div><span>{hi ? 'छात्र आवेदन की समय-सीमा' : 'Student application deadline'}</span><strong>{deadline ?? (hi ? 'सत्यापन आवश्यक' : 'Needs verification')}</strong><p>{hi ? `केवल सत्यापित पोर्टल सूचना; जाँच: ${notice.checkedOn}` : `Verified portal notice only; checked ${notice.checkedOn}`}</p></div>
        </div>
        <div className="guide-criteria-box">
          <h3>{hi ? 'जिन मानदंडों की जाँच बाकी है' : 'Criteria still to verify'}</h3>
          {scholarship.finder.criteria.length ? (
            <ul>{scholarship.finder.criteria.map((criterion) => (
              <li key={criterion.id}>
                <CircleHelp size={14} />
                <span>{hi ? criterionLabels[criterion.id]?.hi ?? criterion.id : criterionLabels[criterion.id]?.en ?? criterion.id}</span>
                <strong>{criterion.status === 'verified' && criterion.relevance !== 'unknown'
                  ? (hi ? 'सत्यापित' : 'Verified')
                  : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')}</strong>
              </li>
            ))}</ul>
          ) : <p>{hi ? 'इस रिकॉर्ड में पात्रता मानदंड उपलब्ध नहीं हैं।' : 'No eligibility criteria are available in this record.'}</p>}
          <p className="guide-disclaimer">{hi ? 'अज्ञात नियमों को पास या फेल नहीं माना जाता। यह मार्गदर्शिका पात्रता या स्वीकृति की गारंटी नहीं देती।' : 'Unknown rules are not treated as passes or failures. This guide does not guarantee eligibility or approval.'}</p>
        </div>
      </section>

      <section className="guide-panel" id="guide-documents" aria-labelledby="guide-documents-title">
        <div className="guide-panel-heading">
          <span className="finder-section-icon"><FileCheck2 size={19} /></span>
          <div><h2 id="guide-documents-title">{hi ? 'दस्तावेज़ तैयारी चेकलिस्ट' : 'Document preparation checklist'}</h2><p>{hi ? `${checklistProgress.completedTasks} / ${checklistProgress.totalTasks} काम पूरे · स्थानीय रूप से सेव` : `${checklistProgress.completedTasks} of ${checklistProgress.totalTasks} tasks complete · saved locally`}</p></div>
        </div>
        <div className="guide-checklist-note"><LockKeyhole size={15} /><p>{hi
          ? 'दस्तावेज़ अपलोड न करें। स्थिति केवल इस डिवाइस पर सेव होती है। सूची में “सत्यापन आवश्यक” का मतलब है कि योजना की वास्तविक आवश्यकता अभी प्रमाणित नहीं है।'
          : 'Do not upload documents. Status is saved on this device only. “Needs verification” means the scheme’s actual requirement has not been confirmed.'}
        </p></div>
        {scholarship.documents.length > 0 ? (
          <div className="guide-document-list">
            {scholarship.documents.map((document) => {
              const state = progress.documents[document.id] ?? 'verify'
              const isTask = document.kind === 'verification-task'
              const requirementLabel = document.requirementStatus === 'mandatory'
                ? (hi ? 'अनिवार्य' : 'Mandatory')
                : document.requirementStatus === 'conditional'
                  ? (hi ? 'शर्त-आधारित' : 'Conditional')
                  : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')
              return (
                <article className="guide-document-item" key={document.id}>
                  <div className="guide-document-heading">
                    <span className="finder-section-icon">{isTask ? <CircleHelp size={18} /> : <FileText size={18} />}</span>
                    <div><span className="guide-requirement-tag">{requirementLabel}</span><h3>{hi ? document.nameHi : document.name}</h3></div>
                  </div>
                  <p>{hi ? document.purposeHi : document.purpose}</p>
                  <dl className="guide-document-facts">
                    <div><dt>{hi ? 'कहाँ से लें' : 'Where to obtain'}</dt><dd>{hi ? document.obtainingInfoHi : document.obtainingInfo}</dd></div>
                    <div><dt>{hi ? 'प्रारूप / वैधता / जारीकर्ता' : 'Format / validity / issuer'}</dt><dd>{hi ? document.formatInfoHi : document.formatInfo}</dd></div>
                  </dl>
                  {document.sourceUrl && <a className="guide-source-link" href={document.sourceUrl} target="_blank" rel="noreferrer">{hi ? 'स्रोत देखें' : 'View source'}<ExternalLink size={13} /></a>}
                  <label className="guide-document-status" htmlFor={`guide-doc-${document.id}`}>
                    <span>{isTask ? (hi ? 'तैयारी काम की स्थिति' : 'Preparation task status') : (hi ? 'मेरी तैयारी की स्थिति' : 'My preparation status')}</span>
                    <select id={`guide-doc-${document.id}`} value={state} onChange={(event) => onDocumentChange(document.id, event.target.value as DocumentState)}>
                      {(Object.keys(documentStates) as DocumentState[]).map((key) => <option value={key} key={key}>{documentStates[key][language]}</option>)}
                    </select>
                  </label>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="finder-empty-state">
            <CircleHelp size={22} />
            <h3>{hi ? 'दस्तावेज़ सूची सत्यापित नहीं है' : 'Document list needs verification'}</h3>
            <p>{hi ? 'इस योजना के अनिवार्य या शर्त-आधारित दस्तावेज़ जाँचे गए आधिकारिक स्रोतों में उपलब्ध नहीं हैं।' : 'Mandatory or conditional documents for this scheme were not available in the official sources reviewed.'}</p>
            <a className="button button-secondary" href={scholarship.sourceUrl} target="_blank" rel="noreferrer">{hi ? 'आधिकारिक सूची देखें' : 'Check official listing'}<ExternalLink size={14} /></a>
          </div>
        )}
        <div className="guide-checklist-progress" role="progressbar" aria-label={hi ? 'चेकलिस्ट प्रगति' : 'Checklist progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={checklistProgress.percentage}>
          <span style={{ width: `${checklistProgress.percentage}%` }} />
        </div>
      </section>

      <section className="guide-panel" id="application-guide" aria-labelledby="application-guide-title">
        <div className="guide-panel-heading">
          <span className="finder-section-icon"><Bookmark size={19} /></span>
          <div><h2 id="application-guide-title">{hi ? 'आवेदन फ़ॉर्म भरने की गाइड' : 'Application form-filling guide'}</h2><p>{hi ? 'केवल उपलब्ध आधिकारिक निर्देश शामिल हैं।' : 'Only available official instructions are included.'}</p></div>
        </div>
        <div className="guide-verification-banner"><CircleHelp size={17} /><div><strong>{hi ? 'शेष आवेदन चरण: सत्यापन आवश्यक' : 'Remaining application steps: Needs verification'}</strong><p>{hi
          ? 'जाँचे गए स्रोतों में इस योजना के सटीक फ़ॉर्म फ़ील्ड, पूरा जमा करने का क्रम या सामान्य गलतियों के लिए योजना-विशिष्ट निर्देश उपलब्ध नहीं हैं। अनुमान लगाकर फ़ील्ड नहीं बताए गए हैं।'
          : 'The sources reviewed do not provide this scheme’s exact form fields, full submission sequence, or scheme-specific mistake guidance. No fields have been guessed.'}
        </p></div></div>
        {scholarship.applicationGuide.instructions.map((instruction, index) => (
          <article className="guide-instruction" key={instruction.id}>
            <span className="guide-instruction-number">{String(index + 1).padStart(2, '0')}</span>
            <div className="guide-instruction-body">
              <span className="guide-requirement-tag">{instruction.status === 'verified' ? (hi ? 'आधिकारिक स्रोत से सत्यापित' : 'Verified from official source') : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')}</span>
              {instruction.appliesWhen && <p className="guide-applies-when">{hi ? instruction.appliesWhenHi : instruction.appliesWhen}</p>}
              <h3>{hi ? instruction.actionHi : instruction.action}</h3>
              <dl className="guide-document-facts">
                <div><dt>{hi ? 'आपको क्या चाहिए' : 'Information you may need'}</dt><dd>{hi ? instruction.informationHi : instruction.information}</dd></div>
                <div><dt>{hi ? 'आगे जाने से पहले जाँचें' : 'Check before continuing'}</dt><dd>{hi ? instruction.checkBeforeContinuingHi : instruction.checkBeforeContinuing}</dd></div>
                <div><dt>{hi ? 'सामान्य गलतियाँ' : 'Common mistakes'}</dt><dd>{hi ? instruction.commonMistakesHi : instruction.commonMistakes}</dd></div>
              </dl>
              <a className="guide-source-link" href={instruction.sourceUrl} target="_blank" rel="noreferrer">{hi ? 'आधिकारिक स्रोत' : 'Official source'} · {instruction.lastVerified}<ExternalLink size={13} /></a>
              {instruction.actionUrl && <a className="guide-inline-link" href={instruction.actionUrl} target="_blank" rel="noreferrer">{hi ? 'NSP OTR सेवा खोलें' : 'Open NSP OTR service'}<ArrowUpRight size={14} /></a>}
            </div>
          </article>
        ))}
        <p className="guide-disclaimer"><Info size={14} />{hi
          ? 'ScholarSaathi तैयारी में मदद करता है, आधिकारिक आवेदन जमा नहीं करता। आवेदन केवल आधिकारिक पोर्टल पर करें और जमा करने से पहले सभी नियमों की पुष्टि करें।'
          : 'ScholarSaathi helps you prepare; it does not submit an official application. Apply only on the official portal and verify all current rules before submitting.'}
        </p>
        <div className="guide-page-actions">
          <a className="button button-secondary" href={scholarship.applicationUrl} target="_blank" rel="noreferrer">{hi ? 'आधिकारिक आवेदन पोर्टल खोलें' : 'Open official application portal'}<ArrowUpRight size={15} /></a>
          <button className="button button-primary" type="button" onClick={onStartPreparation}>{hi ? 'तैयारी प्रश्नों पर जाएँ' : 'Continue to preparation questions'}<ArrowRight size={15} /></button>
        </div>
      </section>
    </div>
  )
}
