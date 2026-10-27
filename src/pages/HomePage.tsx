import {
  ArrowRight,
  Bookmark,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  LockKeyhole,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { scholarships } from '../data/scholarships'
import { getFinderOverview, hasCoreFinderProfile } from '../services/finder'
import { getPreparationProgress } from '../services/preparation'
import type { AppProgress, FinderData, Language, Scholarship, View } from '../types'

interface HomePageProps {
  language: Language
  finderData: FinderData
  progress: AppProgress
  savedScholarship?: Scholarship
  savedView: View
  onOpenScholarship: (scholarship: Scholarship) => void
  onResume: () => void
  onFind: () => void
}

export function HomePage({ language, finderData, progress, savedScholarship, savedView, onOpenScholarship, onResume, onFind }: HomePageProps) {
  const hi = language === 'hi'
  const overview = getFinderOverview(scholarships, finderData.profile, finderData.savedScholarshipIds)
  const preparation = getPreparationProgress(savedScholarship, progress)
  const hasProfile = Object.values(finderData.profile).some((value) => value !== undefined)
  const profileComplete = hasCoreFinderProfile(finderData.profile)
  const resumeLabel = savedView === 'summary'
    ? (hi ? 'सारांश देखें' : 'Review your summary')
    : (hi ? 'जहाँ छोड़ा था वहाँ से शुरू करें' : 'Pick up where you left off')
  const nextStep = !profileComplete
    ? {
        title: hi ? 'अपनी शैक्षणिक जानकारी पूरी करें' : 'Complete your academic details',
        description: hi
          ? 'स्तर और अंक चुनें या जहाँ जानकारी न हो वहाँ “पता नहीं” चुनें। इससे संभावित मिलान बेहतर संदर्भ में दिखेंगे।'
          : 'Choose your level and marks, or select “Unknown / not sure” when you do not know. This gives possible matches useful context.',
        action: hi ? 'प्रोफ़ाइल पूरी करें' : 'Complete profile',
        onClick: onFind,
      }
    : savedScholarship && preparation.remainingTasks > 0
      ? {
          title: hi ? 'अपनी तैयारी आगे बढ़ाएँ' : 'Continue your preparation',
          description: hi ? `${savedScholarship.shortName} की चेकलिस्ट में ${preparation.remainingTasks} काम बाकी हैं।` : `${preparation.remainingTasks} checklist tasks remain for ${savedScholarship.shortName}.`,
          action: resumeLabel,
          onClick: onResume,
        }
      : overview.possibleMatches > 0
        ? {
            title: hi ? 'संभावित छात्रवृत्तियाँ देखें' : 'Review possible scholarship matches',
            description: hi
              ? `${overview.possibleMatches} संभावित मिलान मिले हैं। ये पात्रता की पुष्टि नहीं हैं—हर योजना के आधिकारिक नियम जाँचें।`
              : `${overview.possibleMatches} possible matches use the available listing information only; verify each scheme’s official rules.`,
            action: hi ? 'मिलान देखें' : 'Review matches',
            onClick: onFind,
          }
        : {
            title: hi ? 'योजना के नियमों की पुष्टि करें' : 'Review scholarship criteria',
            description: hi
              ? 'अभी कोई संभावित सूची-मिलान नहीं है। यह अपात्रता का निर्णय नहीं है; आधिकारिक योजना नियमों की जाँच करें।'
              : 'There are no possible listing matches from the information available. This is not an eligibility decision; review official scheme criteria.',
            action: hi ? 'छात्रवृत्तियाँ देखें' : 'Explore scholarships',
            onClick: onFind,
          }

  return (
    <div className="home-page" id="home">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />{hi ? 'छात्रवृत्ति सहायता, सरल तरीके से' : 'SCHOLARSHIP SUPPORT, MADE HUMAN'}</div>
          <h1>{hi ? <>आपकी छात्रवृत्ति यात्रा,<br /><span>अब और आसान।</span></> : <>Your scholarship journey,<br /><span>made simpler.</span></>}</h1>
          <p>{hi ? 'विकल्प खोजें, अपनी तैयारी व्यवस्थित करें और आधिकारिक नियमों को एक समय में एक कदम समझें।' : 'Discover options, organise your preparation, and understand what to verify — one clear step at a time.'}</p>
          <div className="hero-actions">
            <button className="hero-cta" onClick={onFind}>{hi ? 'मेरी छात्रवृत्ति खोजें' : 'Find my scholarship'}<ArrowRight size={17} /></button>
            <span className="hero-private"><LockKeyhole size={14} />{hi ? 'स्थानीय रूप से सेव · वैकल्पिक प्रोफ़ाइल' : 'Saved locally · profile is optional'}</span>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-backdrop" />
          <div className="hero-art-card">
            <div className="hero-art-top"><span className="hero-art-icon"><GraduationCap size={22} /></span><span className="hero-art-kicker">{hi ? 'आपकी तैयारी' : 'YOUR PREPARATION'}</span><span className="hero-art-lock"><LockKeyhole size={14} /></span></div>
            <div className="hero-art-line long" /><div className="hero-art-line medium" />
            <div className="hero-art-task"><span><ClipboardCheck size={16} /></span><div><b>{hi ? 'दस्तावेज़ सूची' : 'Document checklist'}</b><small>{hi ? 'तैयारी के लिए, जमा करने के लिए नहीं' : 'For preparation, not submission'}</small></div></div>
            <div className="hero-art-task"><span><ShieldCheck size={16} /></span><div><b>{hi ? 'नियम सत्यापित करें' : 'Verify scheme rules'}</b><small>{hi ? 'आधिकारिक सूचना पर' : 'On the official notice'}</small></div></div>
          </div>
          <span className="art-note">{hi ? 'आपका अगला कदम' : 'A clearer next step'}<ArrowRight size={14} /></span>
        </div>
      </section>

      <section className="home-dashboard" aria-labelledby="home-dashboard-title">
        <div className="home-dashboard-heading">
          <div><span className="section-overline">{hi ? 'आपकी प्रगति' : 'YOUR OVERVIEW'}</span><h2 id="home-dashboard-title">{hi ? 'आपका छात्रवृत्ति डैशबोर्ड' : 'Your scholarship dashboard'}</h2></div>
          <span className="home-local-note"><LockKeyhole size={14} />{hi ? 'इस डिवाइस पर सेव' : 'Saved on this device'}</span>
        </div>
        <div className="home-stat-grid">
          <article className="home-stat-card"><span className="home-stat-icon"><GraduationCap size={17} /></span><strong>{scholarships.length}</strong><span>{hi ? 'उपलब्ध छात्रवृत्तियाँ' : 'Scholarships available'}</span></article>
          <article className="home-stat-card"><span className="home-stat-icon"><ShieldCheck size={17} /></span><strong>{overview.possibleMatches}</strong><span>{hi ? 'संभावित मिलान · पुष्टि नहीं' : 'Possible matches · not confirmed'}</span></article>
          <article className="home-stat-card"><span className="home-stat-icon"><CircleHelp size={17} /></span><strong>{overview.needsVerification}</strong><span>{hi ? 'पात्रता सत्यापन आवश्यक' : 'Need eligibility verification'}</span></article>
          <article className="home-stat-card"><span className="home-stat-icon"><Bookmark size={17} /></span><strong>{overview.savedCount}</strong><span>{hi ? 'सेव छात्रवृत्तियाँ' : 'Saved scholarships'}</span><small>{overview.savedCount ? (hi ? 'आपकी सेव सूची' : 'Your saved list') : (hi ? 'छात्रवृत्ति खोजकर सेव करें' : 'Save scholarships from Finder')}</small></article>
        </div>
        <div className="home-dashboard-lower">
          <section className="home-preparation-card" aria-labelledby="home-preparation-title">
            <div className="home-subsection-heading"><span className="home-stat-icon"><BookOpenCheck size={17} /></span><div><h3 id="home-preparation-title">{hi ? 'तैयारी चेकलिस्ट' : 'Preparation checklist'}</h3>{savedScholarship && <p>{savedScholarship.shortName}</p>}</div></div>
            {savedScholarship ? (
              <>
                <div className="home-preparation-meter">
                  <div className="home-preparation-meter-label"><span>{hi ? `${preparation.completedTasks} / ${preparation.totalTasks} काम पूरे` : `${preparation.completedTasks} of ${preparation.totalTasks} tasks complete`}</span><strong>{preparation.percentage}%</strong></div>
                  <div className="home-preparation-track" role="progressbar" aria-label={hi ? 'तैयारी की प्रगति' : 'Preparation progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={preparation.percentage}><span style={{ width: `${preparation.percentage}%` }} /></div>
                </div>
                {preparation.remainingTasks > 0 ? (
                  <div className="home-preparation-next">
                    <p>{hi ? `${preparation.remainingTasks} काम बाकी हैं। आपके जवाब और चेकलिस्ट इसी डिवाइस पर सेव हैं।` : `${preparation.remainingTasks} tasks remain. Your answers and checklist are saved on this device.`}</p>
                    <button className="button button-primary" type="button" onClick={onResume}>{hi ? 'जहाँ छोड़ा था वहाँ से जारी रखें' : 'Continue where you left off'}<ArrowRight size={15} /></button>
                  </div>
                ) : (
                  <div className="home-empty-state home-complete-state" role="status"><CheckCircle2 size={18} /><div><strong>{hi ? 'तैयारी चेकलिस्ट पूरी है' : 'Preparation checklist complete'}</strong><p>{hi ? 'आधिकारिक नियमों और दस्तावेज़ों की पुष्टि करें।' : 'Verify current official rules and document requirements before applying.'}</p></div></div>
                )}
              </>
            ) : (
              <div className="home-empty-state"><ClipboardCheck size={18} /><div><strong>{hi ? 'अभी कोई तैयारी शुरू नहीं हुई' : 'No preparation started yet'}</strong><p>{hi ? 'छात्रवृत्ति खोजें और तैयारी चेकलिस्ट खोलें।' : 'Find a scholarship and open its preparation checklist.'}</p></div></div>
            )}
          </section>
          <section className="home-next-step-card" aria-labelledby="home-next-step-title">
            <span className="section-overline">{hi ? 'आपका अगला कदम' : 'YOUR NEXT STEP'}</span>
            <h3 id="home-next-step-title">{nextStep.title}</h3>
            <p>{nextStep.description}</p>
            <button className="button button-primary" type="button" onClick={nextStep.onClick}>{nextStep.action}<ArrowRight size={15} /></button>
            {!hasProfile && <div className="home-empty-state"><GraduationCap size={17} /><div><strong>{hi ? 'आपकी प्रोफ़ाइल अभी खाली है' : 'Your profile is empty'}</strong><p>{hi ? 'इसे भरना वैकल्पिक है; जहाँ जानकारी न हो वहाँ “पता नहीं” चुनें।' : 'Adding a profile is optional; select “Unknown / not sure” wherever you do not know.'}</p></div></div>}
            {profileComplete && overview.possibleMatches === 0 && <div className="home-empty-state home-no-match"><Search size={17} /><div><strong>{hi ? 'अभी कोई संभावित मिलान नहीं' : 'No possible matches right now'}</strong><p>{hi ? 'यह अपात्रता का निष्कर्ष नहीं है; उपलब्ध मानदंड या जानकारी अधूरी हो सकती है।' : 'This does not rule out eligibility; available listing criteria or profile information may be incomplete.'}</p></div></div>}
            {overview.savedCount === 0 && <div className="home-empty-state"><Bookmark size={17} /><div><strong>{hi ? 'अभी कोई छात्रवृत्ति सेव नहीं है' : 'No scholarships saved yet'}</strong><p>{hi ? 'खोज परिणाम में बुकमार्क दबाकर विकल्पों को अपनी सूची में जोड़ें।' : 'Use the bookmark on a Finder result to add scholarships to your saved list.'}</p></div></div>}
          </section>
        </div>
      </section>

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="journey-heading"><span className="section-overline">{hi ? 'एक सरल रास्ता' : 'A SIMPLE WAY FORWARD'}</span><h2 id="journey-title">{hi ? 'तैयारी, एक समय में एक कदम' : 'A little more clarity at every step'}</h2></div>
        <div className="journey-steps">
          <article className="journey-step"><span className="journey-icon"><Compass size={19} /></span><span className="journey-count">01</span><h3>{hi ? 'खोजें' : 'Discover'}</h3><p>{hi ? 'उपलब्ध छात्रवृत्ति विकल्प देखें।' : 'Explore scholarship options in one place.'}</p></article>
          <span className="journey-connector" aria-hidden="true" />
          <article className="journey-step"><span className="journey-icon"><ClipboardCheck size={19} /></span><span className="journey-count">02</span><h3>{hi ? 'तैयार करें' : 'Prepare'}</h3><p>{hi ? 'सवालों के जवाब दें और अपनी सूची बनाएँ।' : 'Answer simple questions and build your checklist.'}</p></article>
          <span className="journey-connector" aria-hidden="true" />
          <article className="journey-step"><span className="journey-icon"><ShieldCheck size={19} /></span><span className="journey-count">03</span><h3>{hi ? 'समीक्षा करें' : 'Review'}</h3><p>{hi ? 'नियम जाँचें और आधिकारिक पोर्टल पर जाएँ।' : 'Review what to verify, then visit the official portal.'}</p></article>
        </div>
      </section>

      <section className="scholarship-section" id="scholarships">
        <div className="section-heading">
          <div><span className="section-overline">{hi ? 'शुरुआत यहाँ से करें' : 'A GOOD PLACE TO START'}</span><h2>{hi ? 'छात्रवृत्तियाँ खोजें' : 'Explore scholarships'}</h2></div>
          <span className="demo-count">{hi ? 'राष्ट्रीय छात्रवृत्ति पोर्टल से' : 'From the National Scholarship Portal'}</span>
        </div>
        <div className="scholarship-grid">
          {scholarships.map((scholarship, index) => (
            <article className="scholarship-card" key={scholarship.id}>
              <div className="scheme-card-top">
                <div className={`scheme-icon scheme-icon-${index}`}><FileText size={21} /></div>
                <span className="scheme-source-tag"><span />{hi ? 'पोर्टल पर सूचीबद्ध' : 'Listed on portal'}</span>
              </div>
              <h3>{hi ? scholarship.nameHi : scholarship.name}</h3>
              <p className="scheme-description">{hi ? scholarship.descriptionHi : scholarship.description}</p>
              <div className="scheme-meta"><span className="scheme-level">{hi ? scholarship.levelHi : scholarship.level}</span><span>{scholarship.shortName}</span></div>
              <div className="scheme-fact">
                <span className="fact-label"><CircleHelp size={14} />{hi ? 'पात्रता स्थिति' : 'Eligibility status'}</span>
                <strong>{hi ? 'अभी सत्यापन आवश्यक' : 'Needs verification'}</strong>
                <p>{hi ? 'आधिकारिक पात्रता नियम यहाँ सत्यापित नहीं हैं।' : 'Official eligibility rules are not verified here.'}</p>
              </div>
              <div className="scheme-fact scheme-notice">
                <span className="fact-label"><FileText size={14} />{hi ? 'पोर्टल सूचना' : 'Portal notice'}</span>
                <p>{hi ? scholarship.verifiedDetailHi : scholarship.verifiedDetail}</p>
                <small>{hi ? `जाँच: ${scholarship.lastVerified}` : `Checked ${scholarship.lastVerified}`}</small>
              </div>
              <div className="scheme-documents">
                <span>{hi ? 'दस्तावेज़ उदाहरण — आधिकारिक सूची नहीं' : 'Document examples — not an official list'}</span>
                <p>{scholarship.documents.length
                  ? scholarship.documents.map((document) => hi ? document.nameHi : document.name).join(' · ')
                  : (hi ? 'इस रिकॉर्ड के लिए आवश्यक दस्तावेज़ सत्यापित नहीं हैं। आधिकारिक सूचना देखें।' : 'Required documents are not verified for this listing. Check the official notice.')}
                </p>
              </div>
              <button className="card-action" onClick={() => onOpenScholarship(scholarship)}>{hi ? 'विवरण और गाइड देखें' : 'View details & guide'}<ArrowRight size={17} /></button>
              <div className="scheme-links">
                <a className="source-link" href={scholarship.sourceUrl} target="_blank" rel="noreferrer">{hi ? 'आधिकारिक स्रोत' : 'Official source'}<ArrowUpRight size={13} /></a>
                <a className="source-link" href={scholarship.applicationUrl} target="_blank" rel="noreferrer">{hi ? 'आवेदन पोर्टल' : 'Application portal'}<ArrowUpRight size={13} /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-strip">
        <span className="trust-icon"><LockKeyhole size={19} /></span>
        <div><strong>{hi ? 'आपकी तैयारी, आपकी निजी जगह।' : 'Your preparation stays yours.'}</strong><p>{hi ? 'प्रगति इसी डिवाइस पर सेव होती है। पात्रता और दस्तावेज़ हमेशा आधिकारिक योजना नियमों से सत्यापित करें।' : 'Progress is saved on this device. Always verify eligibility and documents against the official scheme rules.'}</p></div>
        <ShieldCheck size={21} className="trust-shield" />
      </section>
    </div>
  )
}
