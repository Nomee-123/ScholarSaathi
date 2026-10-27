import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  FileText,
  Info,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { getPreparationProgress } from '../services/preparation'
import type { DocumentState, EligibilityResult, Language, Scholarship, WizardAnswers } from '../types'

interface SummaryPageProps {
  scholarship: Scholarship
  language: Language
  answers: WizardAnswers
  documents: Record<string, DocumentState>
  eligibility: EligibilityResult
  onDocumentChange: (id: string, state: DocumentState) => void
  onBack: () => void
  onStartOver: () => void
}

const statusText: Record<DocumentState, { en: string; hi: string }> = {
  ready: { en: 'Prepared / done', hi: 'तैयार / पूरा' },
  missing: { en: 'Not prepared', hi: 'तैयार नहीं' },
  verify: { en: 'Needs checking', hi: 'जाँच आवश्यक' },
}

export function SummaryPage({ scholarship, language, answers, documents, eligibility, onDocumentChange, onBack, onStartOver }: SummaryPageProps) {
  const hi = language === 'hi'
  const [notice, setNotice] = useState('')
  const documentReady = scholarship.documents.filter((doc) => documents[doc.id] === 'ready').length
  const documentAttention = scholarship.documents.length - documentReady
  const allChecked = scholarship.documents.every((doc) => documents[doc.id])
  const documentPercent = scholarship.documents.length
    ? Math.round((documentReady / scholarship.documents.length) * 100)
    : 0
  const answerLabels: Record<string, string> = {
    fresh: hi ? 'नया आवेदन' : 'Fresh application',
    renewal: hi ? 'नवीनीकरण' : 'Renewal',
    unsure: hi ? 'अभी निश्चित नहीं' : 'Not sure yet',
    school: hi ? 'स्कूल' : 'School',
    college: hi ? 'कॉलेज / विश्वविद्यालय' : 'College / university',
    other: hi ? 'अन्य' : 'Other',
  }
  const answersList = [
    { label: hi ? 'आवेदन का प्रकार' : 'Application type', value: answers.applicationType ? answerLabels[answers.applicationType] : '' },
    { label: hi ? 'पढ़ाई का स्तर' : 'Study level', value: answers.studyLevel ? answerLabels[answers.studyLevel] : '' },
    { label: hi ? 'राज्य / केंद्र शासित प्रदेश' : 'State / union territory', value: answers.state ?? '' },
  ].filter((answer) => answer.value)
  const preparationPercent = getPreparationProgress(scholarship, { answers, documents }).percentage
  const outstandingDocuments = scholarship.documents.filter((doc) => documents[doc.id] !== 'ready')
  const localizedReasons = hi
    ? [
        'वर्तमान आधिकारिक पात्रता मानदंड इस मार्गदर्शिका के लिए सत्यापित नहीं हैं।',
        'आपके जवाब केवल तैयारी के लिए सेव हैं; सत्यापित नियमों के बिना पात्रता तय नहीं की जा सकती।',
        'आधिकारिक योजना सूचना देखें या अपने स्कूल, कॉलेज अथवा कॉमन सर्विस सेंटर से मदद लें।',
      ]
    : eligibility.reasons

  function updateDoc(id: string, state: DocumentState) {
    onDocumentChange(id, state)
    setNotice(hi ? 'चेकलिस्ट सेव हो गई।' : 'Checklist updated and saved.')
    window.setTimeout(() => setNotice(''), 2500)
  }

  return (
    <div className="summary-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} />{hi ? 'जवाब बदलें' : 'Edit answers'}</button>
      <div className="summary-heading">
        <div><span className="section-overline">{hi ? 'आपकी तैयारी का अवलोकन' : 'YOUR PREPARATION OVERVIEW'}</span><h1>{hi ? 'आपका अगला कदम' : 'Your next step'}</h1><p>{hi ? 'तैयारी हुई है — अब आधिकारिक विवरण की पुष्टि करें।' : 'You have a starting point. Now confirm the official details.'}</p></div>
        <span className="summary-scheme-pill"><FileText size={15} />{scholarship.shortName}</span>
      </div>

      <section className="completion-panel" aria-label={hi ? 'तैयारी की प्रगति' : 'Preparation progress'}>
        <div className="completion-copy">
          <span className="section-overline">{hi ? 'तैयारी की प्रगति' : 'PREPARATION PROGRESS'}</span>
          <strong>{hi ? `${preparationPercent}% व्यवस्थित` : `${preparationPercent}% organised`}</strong>
          <p>{hi ? 'आपके जवाब और तैयार दस्तावेज़ों के आधार पर। यह पात्रता या आवेदन जमा होने का संकेत नहीं है।' : 'Based on answered questions and items marked Ready. This does not indicate eligibility or application submission.'}</p>
        </div>
        <div className="completion-meter" role="progressbar" aria-label={hi ? 'तैयारी प्रगति' : 'Preparation progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={preparationPercent} style={{ background: `conic-gradient(#26835d ${preparationPercent}%, #dce9db 0)` }}>
          <span><b>{preparationPercent}%</b></span>
        </div>
        <div className="completion-tasks">
          <span><CheckCircle2 size={15} />{hi ? `${answersList.length} / 3 जवाब` : `${answersList.length} of 3 answers`}</span>
          <span><FileText size={15} />{hi ? `${documentReady} / ${scholarship.documents.length} चेकलिस्ट मदें तैयार` : `${documentReady} of ${scholarship.documents.length} checklist items marked ready`}</span>
          <span className="completion-outstanding"><CircleHelp size={15} />{hi ? `${outstandingDocuments.length} चेकलिस्ट मदें जाँचें` : `${outstandingDocuments.length} checklist items to review`}</span>
        </div>
      </section>

      <section className="eligibility-panel">
        <div className="eligibility-icon"><CircleHelp size={22} /></div>
        <div className="eligibility-copy">
          <span className="section-overline">{hi ? 'प्रारंभिक पात्रता जाँच' : 'INITIAL ELIGIBILITY CHECK'}</span>
          <h2>{hi ? 'आगे सत्यापन आवश्यक' : 'Needs verification'}</h2>
          <p>{hi ? 'इस डेमो में वर्तमान आधिकारिक पात्रता नियम सत्यापित नहीं हैं। इसलिए यह मार्गदर्शिका आपकी पात्रता का निर्णय नहीं कर सकती।' : 'Current official eligibility rules are not verified in this demo, so this guide cannot determine whether you qualify.'}</p>
        </div>
        <span className="verify-pill"><Info size={13} />{hi ? 'आधिकारिक सूचना देखें' : 'Check official notice'}</span>
        <ul className="eligibility-reasons">{localizedReasons.map((reason) => <li key={reason}><Check size={14} />{reason}</li>)}</ul>
      </section>

      <div className="summary-columns">
        <section className="panel answers-panel">
          <div className="panel-title"><span className="panel-icon blue"><FileCheck2 size={18} /></span><div><h2>{hi ? 'आपकी जानकारी' : 'Your answers'}</h2><p>{hi ? 'आपने क्या साझा किया' : 'What you shared'}</p></div></div>
          <dl className="answer-summary">{answersList.map((answer) => <div key={answer.label}><dt>{answer.label}</dt><dd>{answer.value}</dd></div>)}</dl>
          <div className="local-only"><LockKeyhole size={14} /><span>{hi ? 'केवल इसी डिवाइस पर सेव' : 'Saved on this device only'}</span></div>
        </section>

        <section className="panel checklist-panel">
          <div className="panel-title checklist-title"><span className="panel-icon green"><FileText size={18} /></span><div><h2>{hi ? 'दस्तावेज़ और तैयारी चेकलिस्ट' : 'Document & preparation checklist'}</h2><p>{hi ? 'तैयारी स्थिति चुनें; दस्तावेज़ आवश्यकता अलग से सत्यापित करें' : 'Mark your preparation status; verify document requirements separately'}</p></div></div>
          {scholarship.documents.length > 0 ? (
            <>
              <div className="checklist-progress">
                <div className="checklist-progress-meta">
                  <span>{hi ? `${documentReady} / ${scholarship.documents.length} मदें तैयार` : `${documentReady} of ${scholarship.documents.length} items ready`}</span>
                  <span>{hi ? `${documentAttention} मदें जाँचें` : `${documentAttention} items need attention`}</span>
                  <span>{documentPercent}%</span>
                </div>
                <div className="progress-track" role="progressbar" aria-label={hi ? 'दस्तावेज़ चेकलिस्ट की प्रगति' : 'Document checklist progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={documentPercent}>
                  <span style={{ width: `${documentPercent}%` }} />
                </div>
              </div>
              <div className="document-list">
                {scholarship.documents.map((doc) => {
                  const state = documents[doc.id] ?? 'verify'
                  const isTask = doc.kind === 'verification-task'
                  return (
                    <article className="document-item" key={doc.id}>
                      <span className={`document-icon ${state}`} aria-hidden="true">{state === 'ready' ? <Check size={16} /> : state === 'missing' ? <X size={15} /> : <CircleHelp size={15} />}</span>
                      <div className="document-copy"><strong>{hi ? doc.nameHi : doc.name} — {doc.requirementStatus === 'mandatory' ? (hi ? 'अनिवार्य' : 'Mandatory') : doc.requirementStatus === 'conditional' ? (hi ? 'शर्त-आधारित' : 'Conditional') : (hi ? 'सत्यापन आवश्यक' : 'Needs verification')}</strong><p>{hi ? doc.purposeHi : doc.purpose}</p></div>
                      <label className="document-select-label" htmlFor={`doc-${doc.id}`}>{isTask ? (hi ? `${doc.nameHi} काम की स्थिति` : `${doc.name} task status`) : (hi ? `${doc.nameHi} की तैयारी स्थिति` : `${doc.name} preparation status`)}</label>
                      <select id={`doc-${doc.id}`} className={`document-select ${state}`} value={state} onChange={(event) => updateDoc(doc.id, event.target.value as DocumentState)}>
                        {(Object.keys(statusText) as DocumentState[]).map((key) => <option value={key} key={key}>{statusText[key][language]}</option>)}
                      </select>
                    </article>
                  )
                })}
              </div>
              {!allChecked && <p className="checklist-hint"><Info size={14} />{hi ? 'चेकलिस्ट स्थिति आपकी तैयारी दिखाती है, योजना में आधिकारिक आवश्यकता की पुष्टि नहीं।' : 'Checklist status tracks your preparation; it does not confirm an official scheme requirement.'}</p>}
            </>
          ) : (
            <p className="checklist-hint"><Info size={14} />{hi
              ? 'इस रिकॉर्ड के लिए कोई दस्तावेज़ आवश्यकता सत्यापित नहीं है। आधिकारिक योजना सूचना में सूची जाँचें।'
              : 'No document requirements are verified for this listing. Check the official scheme notice for its document list.'}
            </p>
          )}
          {outstandingDocuments.length > 0 && (
            <div className="outstanding-list">
              <strong>{hi ? 'अगले कदम' : 'Outstanding tasks'}</strong>
              <ul>{outstandingDocuments.map((doc) => <li key={doc.id}><CircleHelp size={13} />{hi ? doc.nameHi : doc.name} — {hi ? statusText[documents[doc.id] ?? 'verify'].hi : statusText[documents[doc.id] ?? 'verify'].en}</li>)}</ul>
            </div>
          )}
          {notice && <p className="checklist-notice" role="status"><CheckCircle2 size={14} />{notice}</p>}
        </section>
      </div>

      <section className="final-steps">
        <div className="final-heading"><span className="panel-icon purple"><ShieldCheck size={19} /></span><div><span className="section-overline">{hi ? 'जाने से पहले' : 'BEFORE YOU GO'}</span><h2>{hi ? 'आपकी अंतिम तैयारी सूची' : 'Your final preparation checklist'}</h2></div></div>
        <div className="final-checks">
          <div><span className="final-check-icon"><Check size={15} /></span><span>{hi ? 'योजना के नवीनतम नियम आधिकारिक पोर्टल पर जाँचें' : 'Check the latest scheme rules on the official portal'}</span></div>
          <div><span className="final-check-icon"><Check size={15} /></span><span>{hi ? 'सटीक दस्तावेज़ों और समय-सीमा की पुष्टि करें' : 'Confirm exact documents and application dates'}</span></div>
          <div><span className="final-check-icon"><Check size={15} /></span><span>{hi ? 'जरूरत हो तो स्कूल, कॉलेज या CSC से मदद लें' : 'Ask your school, college, or CSC for help if needed'}</span></div>
        </div>
        <div className="not-submitted-note"><Info size={15} /><span>{hi ? 'यह तैयारी आवेदन जमा नहीं करती और छात्रवृत्ति की स्वीकृति की गारंटी नहीं देती।' : 'This preparation does not submit an application or guarantee scholarship approval.'}</span></div>
        <div className="summary-actions">
          <button className="button button-secondary" onClick={onStartOver}><RotateCcw size={15} />{hi ? 'नई तैयारी शुरू करें' : 'Start a new preparation'}</button>
          <a className="button button-primary official-link" href={scholarship.applicationUrl} target="_blank" rel="noreferrer">{hi ? 'आधिकारिक पोर्टल खोलें' : 'Open official portal'}<ArrowUpRight size={17} /></a>
        </div>
        <a className="official-source" href={scholarship.sourceUrl} target="_blank" rel="noreferrer">{hi ? 'स्रोत: राष्ट्रीय छात्रवृत्ति पोर्टल' : 'Source: National Scholarship Portal'}<ArrowUpRight size={13} /></a>
      </section>
      <div className="summary-verified"><Info size={14} /><span>{hi ? `पोर्टल ${scholarship.lastVerified} जाँचा गया। योजना-विशिष्ट नियम सत्यापित नहीं हैं।` : `Portal checked ${scholarship.lastVerified}. Scheme-specific rules are not verified.`}</span></div>
      <span className="sr-only"><ArrowRight /></span>
    </div>
  )
}
