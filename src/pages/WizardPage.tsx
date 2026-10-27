import { useState } from 'react'
import { ArrowLeft, ArrowRight, CircleHelp, Info } from 'lucide-react'
import { indianStates as states } from '../data/indianStates'
import type { Language, Scholarship, WizardAnswers } from '../types'

interface WizardPageProps {
  scholarship: Scholarship
  language: Language
  answers: WizardAnswers
  step: number
  onAnswer: (answers: WizardAnswers) => void
  onStep: (step: number) => void
  onBack: () => void
  onContinue: (step: number, last: boolean) => void
}

export function WizardPage({ scholarship, language, answers, step, onAnswer, onStep, onBack, onContinue }: WizardPageProps) {
  const hi = language === 'hi'
  const [error, setError] = useState('')
  const questions = [
    {
      key: 'applicationType' as const,
      title: hi ? 'आप किस तरह का आवेदन तैयार कर रहे हैं?' : 'What kind of application are you preparing?',
      helper: hi ? 'नवीनीकरण का मतलब है पहले से मिली छात्रवृत्ति को आगे जारी रखने का आवेदन।' : 'A renewal is an application to continue a scholarship you already receive.',
      options: [
        { value: 'fresh', label: hi ? 'नया आवेदन' : 'Fresh application' },
        { value: 'renewal', label: hi ? 'नवीनीकरण' : 'Renewal' },
        { value: 'unsure', label: hi ? 'अभी निश्चित नहीं' : 'I’m not sure yet' },
      ],
    },
    {
      key: 'studyLevel' as const,
      title: hi ? 'आप अभी किस स्तर पर पढ़ रहे हैं?' : 'What level are you studying at?',
      helper: hi ? 'यह जानकारी आपको सही योजना सूचना देखने में मदद करेगी।' : 'This helps you find the right scheme notice to check.',
      options: scholarship.id === 'pm-yasasvi-top-class'
        ? [{ value: 'school', label: hi ? 'स्कूल' : 'School' }, { value: 'other', label: hi ? 'अन्य' : 'Other' }, { value: 'unsure', label: hi ? 'अभी निश्चित नहीं' : 'I’m not sure yet' }]
        : [{ value: 'college', label: hi ? 'कॉलेज / विश्वविद्यालय' : 'College / university' }, { value: 'school', label: hi ? 'स्कूल' : 'School' }, { value: 'other', label: hi ? 'अन्य' : 'Other' }, { value: 'unsure', label: hi ? 'अभी निश्चित नहीं' : 'I’m not sure yet' }],
    },
    {
      key: 'state' as const,
      title: hi ? 'आप किस राज्य या केंद्र शासित प्रदेश में पढ़ते हैं?' : 'Which state or union territory do you study in?',
      helper: hi ? 'कुछ योजनाओं में राज्य के अनुसार अलग जानकारी हो सकती है।' : 'Some schemes may have state-specific information.',
      options: states.map((state) => ({ value: state, label: state })),
    },
  ]
  const question = questions[Math.min(step, questions.length - 1)]
  const selectedAnswer = answers[question.key]

  function continueNext() {
    if (!selectedAnswer) {
      setError(hi ? 'आगे बढ़ने के लिए एक विकल्प चुनें।' : 'Please choose an option before continuing.')
      return
    }
    setError('')
    onContinue(step, step === questions.length - 1)
  }

  return (
    <div className="wizard-page">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} />{hi ? 'वापस जाएँ' : 'Back'}</button>
      <div className="wizard-layout">
        <section className="wizard-main">
          <div className="wizard-topline">
            <span className="wizard-label">{hi ? 'तैयारी गाइड' : 'PREPARATION GUIDE'}</span>
            <span className="step-counter">{hi ? `चरण ${step + 1} / ${questions.length}` : `STEP ${step + 1} OF ${questions.length}`}</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={hi ? 'प्रश्नों की प्रगति' : 'Question progress'}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(((step + 1) / questions.length) * 100)}
          >
            <span style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="wizard-scheme">{scholarship.shortName}</span>
          <h1 className="question-title">{question.title}</h1>
          <p className="question-helper">{question.helper}</p>
          <fieldset className={`answer-options ${question.key === 'state' ? 'state-options' : ''}`}>
            <legend className="sr-only">{question.title}</legend>
            {question.key === 'state' ? (
              <label className="field-label" htmlFor="state-select">{hi ? 'राज्य या केंद्र शासित प्रदेश' : 'State or union territory'}</label>
            ) : null}
            {question.key === 'state' ? (
              <select id="state-select" value={selectedAnswer ?? ''} onChange={(event) => { onAnswer({ ...answers, [question.key]: event.target.value }); setError('') }}>
                <option value="" disabled>{hi ? 'अपना राज्य चुनें' : 'Select your state'}</option>
                {question.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : question.options.map((option) => (
              <label key={option.value} className={`answer-option ${selectedAnswer === option.value ? 'selected' : ''}`}>
                <input type="radio" name={question.key} value={option.value} checked={selectedAnswer === option.value} onChange={() => { onAnswer({ ...answers, [question.key]: option.value }); setError('') }} />
                <span className="custom-radio" aria-hidden="true" />
                <span className="answer-text">{option.label}</span>
                {selectedAnswer === option.value && <span className="answer-check"><ArrowRight size={15} /></span>}
              </label>
            ))}
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="wizard-actions">
            <button className="button button-secondary" onClick={() => step === 0 ? onBack() : onStep(step - 1)}><ArrowLeft size={16} />{hi ? 'पीछे' : 'Back'}</button>
            <button className="button button-primary" onClick={continueNext}>{step === questions.length - 1 ? (hi ? 'सारांश देखें' : 'View my summary') : (hi ? 'आगे बढ़ें' : 'Continue')}<ArrowRight size={16} /></button>
          </div>
          <p className="wizard-save-note"><CircleHelp size={14} />{hi ? 'आपके जवाब अपने-आप इस डिवाइस पर सेव होते हैं।' : 'Your answers are saved on this device as you go.'}</p>
        </section>
        <aside className="wizard-aside">
          <div className="aside-illustration"><span className="aside-document"><i /><i /><i /></span><span className="aside-spark">✳</span></div>
          <span className="section-overline">{hi ? 'यह क्यों पूछ रहे हैं?' : 'WHY WE ASK'}</span>
          <h2>{hi ? 'सही जानकारी, सही अगला कदम।' : 'A clearer next step starts here.'}</h2>
          <p>{hi ? 'ये जवाब आपको आधिकारिक सूचना देखने में मदद करते हैं। ये पात्रता की पुष्टि नहीं करते।' : 'These answers help you prepare to check the official notice. They do not confirm eligibility.'}</p>
          <div className="info-callout"><Info size={16} /><span>{hi ? 'इस योजना की पात्रता और आवश्यक दस्तावेज़ आधिकारिक पोर्टल पर सत्यापित करें।' : 'Verify this scheme’s eligibility and required documents on the official portal.'}</span></div>
        </aside>
      </div>
    </div>
  )
}
