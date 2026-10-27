import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  CircleHelp,
  Cloud,
  GraduationCap,
  Languages,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Search,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react'
import { scholarships } from './data/scholarships'
import { evaluateEligibility } from './services/eligibility'
import { deleteAllLocalData, deleteProgress, loadFinderData, loadProgress, saveFinderData, saveProgress } from './services/storage'
import { emptyFinderData, preparationAnswersFromProfile, toggleSavedScholarship } from './services/finder'
import { sendPasswordReset, signInWithEmail, signOut, signUpWithEmail, updatePassword } from './services/auth'
import { supabaseConfiguration } from './services/supabaseConfig'
import type { AppProgress, DocumentState, FinderData, Language, Scholarship, View, WizardAnswers } from './types'
import { HomePage } from './pages/HomePage'
import { WizardPage } from './pages/WizardPage'
import { SummaryPage } from './pages/SummaryPage'
import { FinderPage } from './pages/FinderPage'
import { ScholarshipGuidePage } from './pages/ScholarshipGuidePage'
import { AuthPage, type AuthMode } from './pages/AuthPage'
import './App.css'

const emptyProgress: AppProgress = {
  scholarshipId: '',
  answers: {},
  documents: {},
  step: 0,
  view: 'home',
  resumeView: 'wizard',
}

const strings = {
  en: {
    tagline: 'Scholarship guidance, made simpler',
    home: 'Home',
    finder: 'Find scholarships',
    preparation: 'My preparation',
    login: 'Log in',
    account: 'My account',
    guest: 'Continue as guest',
    logout: 'Log out',
    cloudSyncDisabled: 'Cloud profile sync is not connected in this scaffold. Your finder profile and saved scholarships remain in local IndexedDB.',
    saved: 'Saved on this device',
    noSavedData: 'No saved application',
    saving: 'Saving…',
    offline: 'You are offline',
    online: 'You are online',
    privacy: 'Your information is saved locally in this browser.',
    delete: 'Delete saved data',
    deleteTitle: 'Delete your saved data?',
    deleteBody: 'This permanently removes your answers, checklist, finder profile, and saved scholarships from this device.',
    cancel: 'Keep my data',
    confirmDelete: 'Delete data',
    loading: 'Loading your saved preparation…',
    error: 'We could not save your progress. Please try again.',
    startOver: 'Start a new preparation',
    footer: 'A friendly guide for your next step.',
    menu: 'Open navigation menu',
    close: 'Close',
  },
  hi: {
    tagline: 'छात्रवृत्ति की तैयारी आसान',
    home: 'होम',
    finder: 'छात्रवृत्तियाँ खोजें',
    preparation: 'मेरी तैयारी',
    login: 'लॉग इन',
    account: 'मेरा खाता',
    guest: 'अतिथि के रूप में जारी रखें',
    logout: 'लॉग आउट',
    cloudSyncDisabled: 'इस स्कैफोल्ड में क्लाउड प्रोफ़ाइल सिंक नहीं जुड़ा है। आपकी खोज प्रोफ़ाइल और सेव छात्रवृत्तियाँ स्थानीय IndexedDB में रहेंगी।',
    saved: 'इस डिवाइस पर सेव है',
    noSavedData: 'कोई सेव किया आवेदन नहीं',
    saving: 'सेव हो रहा है…',
    offline: 'आप ऑफ़लाइन हैं',
    online: 'आप ऑनलाइन हैं',
    privacy: 'आपकी जानकारी इस ब्राउज़र में स्थानीय रूप से सेव रहती है।',
    delete: 'सेव किया डेटा हटाएँ',
    deleteTitle: 'सेव किया डेटा हटाएँ?',
    deleteBody: 'इस डिवाइस से आपके जवाब, चेकलिस्ट, खोज प्रोफ़ाइल और सेव छात्रवृत्तियाँ हमेशा के लिए हट जाएँगी।',
    cancel: 'डेटा रहने दें',
    confirmDelete: 'डेटा हटाएँ',
    loading: 'आपकी सेव की गई तैयारी खुल रही है…',
    error: 'प्रगति सेव नहीं हो सकी। कृपया फिर कोशिश करें।',
    startOver: 'नई तैयारी शुरू करें',
    footer: 'आपके अगले कदम के लिए एक सरल साथी।',
    menu: 'नेविगेशन मेनू खोलें',
    close: 'बंद करें',
  },
} as const

function App() {
  const [progress, setProgress] = useState<AppProgress>(emptyProgress)
  const [finderData, setFinderData] = useState<FinderData>(emptyFinderData())
  const [language, setLanguage] = useState<Language>('en')
  const [view, setView] = useState<View>('home')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!supabaseConfiguration.configured)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [online, setOnline] = useState(navigator.onLine)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
  const cancelDeleteRef = useRef<HTMLButtonElement>(null)
  const deleteDialogRef = useRef<HTMLElement>(null)
  const t = strings[language]

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined
    if (!supabaseConfiguration.configured) return
    import('./services/supabase')
      .then(({ supabase: client }) => {
        if (!active) return
        if (!client) {
          setAuthError('Supabase client is unavailable. Guest mode remains available.')
          setAuthReady(true)
          return
        }
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
          if (!active) return
          setAuthUser(session?.user ?? null)
          setAuthReady(true)
          if (event === 'PASSWORD_RECOVERY') {
            setAuthMode('update-password')
            setView('reset-password')
          } else if (event === 'SIGNED_OUT') {
            setView((current) => current === 'account' ? 'home' : current)
          }
        })
        unsubscribe = () => subscription.unsubscribe()
        return client.auth.getSession()
      })
      .then((result) => {
        if (!active || !result) return
        if (result.error) {
          console.error('Unable to restore Supabase session', result.error)
          setAuthError('Unable to check the Supabase session. Guest mode remains available.')
        } else {
          setAuthUser(result.data.session?.user ?? null)
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to restore Supabase session', error)
        if (active) setAuthError('Unable to check the Supabase session. Guest mode remains available.')
      })
      .finally(() => {
        if (active) setAuthReady(true)
      })
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([loadProgress(), loadFinderData()])
      .then(([saved, savedFinder]) => {
        if (!active) return
        if (saved) {
          const resumeView = saved.resumeView ?? (saved.view === 'summary' ? 'summary' : 'wizard')
          setProgress({ ...saved, resumeView })
          setView(saved.view)
        }
        if (savedFinder) setFinderData(savedFinder)
      })
      .catch((error: unknown) => {
        console.error('Unable to load saved preparation', error)
        if (active) setSaveState('error')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!deleteDialog) return
    cancelDeleteRef.current?.focus()
    function handleDialogKeys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDeleteDialog(false)
        deleteTriggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || !deleteDialogRef.current) return
      const buttons = deleteDialogRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleDialogKeys)
    return () => document.removeEventListener('keydown', handleDialogKeys)
  }, [deleteDialog])

  useEffect(() => {
    if (loading) return
    const timeout = window.setTimeout(() => {
      setSaveState('saving')
      const safeView = view === 'finder' || view === 'guidance' || view === 'wizard' || view === 'summary' ? view : 'home'
      const operation = progress.scholarshipId
        ? saveProgress({ ...progress, view: safeView })
        : deleteProgress()
      Promise.all([operation, saveFinderData(finderData)])
        .then(() => setSaveState('saved'))
        .catch((error: unknown) => {
          console.error('Unable to save local application data', error)
          setSaveState('error')
        })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [progress, finderData, view, loading])

  const selected = scholarships.find((item) => item.id === progress.scholarshipId)
  const hasFinderData = Object.values(finderData.profile).some((value) => value !== undefined) || finderData.savedScholarshipIds.length > 0
  const hasLocalData = Boolean(selected) || hasFinderData
  const eligibility = selected ? evaluateEligibility(selected, progress.answers) : null

  function updateProgress(patch: Partial<AppProgress>) {
    setProgress((current) => ({ ...current, ...patch }))
  }

  function startScholarship(scholarship: Scholarship, initialAnswers: WizardAnswers = {}) {
    const isSame = progress.scholarshipId === scholarship.id
    setProgress((current) => ({
      ...current,
      scholarshipId: scholarship.id,
      answers: isSame ? { ...initialAnswers, ...current.answers } : initialAnswers,
      documents: isSame ? current.documents : {},
      step: isSame ? current.step : 0,
      view: 'wizard',
      resumeView: 'wizard',
    }))
    setView('wizard')
  }

  function openScholarshipDetails(scholarship: Scholarship) {
    const isSame = progress.scholarshipId === scholarship.id
    setProgress((current) => ({
      ...current,
      scholarshipId: scholarship.id,
      answers: isSame ? current.answers : {},
      documents: isSame ? current.documents : {},
      step: isSame ? current.step : 0,
      view: 'guidance',
      resumeView: 'guidance',
    }))
    setView('guidance')
    setMenuOpen(false)
  }

  function updateDocument(id: string, state: DocumentState) {
    setProgress((current) => ({
      ...current,
      documents: { ...current.documents, [id]: state },
    }))
  }

  async function clearSavedData() {
    try {
      await deleteAllLocalData()
      setProgress(emptyProgress)
      setFinderData(emptyFinderData())
      setView('home')
      setDeleteDialog(false)
      setSaveState('saved')
    } catch (error) {
      console.error('Unable to delete saved preparation', error)
      setSaveState('error')
      setDeleteDialog(false)
    }
  }

  function navigate(nextView: View) {
    setView(nextView)
    setProgress((current) => ({
      ...current,
      view: nextView,
      resumeView: nextView === 'guidance' || nextView === 'wizard' || nextView === 'summary' ? nextView : current.resumeView,
    }))
    setMenuOpen(false)
  }

  function openAuth(mode: AuthMode) {
    setAuthError('')
    setAuthMode(mode)
    setView(mode === 'signup' ? 'signup' : mode === 'login' ? 'login' : 'reset-password')
    setMenuOpen(false)
  }

  async function submitAuth(email: string, password?: string): Promise<string> {
    if (!supabaseConfiguration.configured) {
      throw new Error(supabaseConfiguration.message)
    }
    setAuthBusy(true)
    setAuthError('')
    try {
      if (authMode === 'login') {
        if (!password) throw new Error('Enter your password.')
        const message = await signInWithEmail(email, password)
        setView('account')
        return message
      }
      if (authMode === 'signup') {
        if (!password) throw new Error('Enter a password.')
        const result = await signUpWithEmail(email, password)
        if (result.hasSession) setView('account')
        return result.message
      }
      if (authMode === 'reset') {
        return await sendPasswordReset(email)
      }
      if (!password) throw new Error('Enter a new password.')
      const message = await updatePassword(password)
      setAuthMode('login')
      setView('account')
      return message
    } finally {
      setAuthBusy(false)
    }
  }

  async function logOut() {
    setAuthBusy(true)
    try {
      await signOut()
      setAuthUser(null)
      setView('home')
      setAuthError('')
    } catch (error) {
      console.error('Unable to sign out', error)
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); navigate('home') }}>
          <span className="brand-mark"><GraduationCap size={22} strokeWidth={2.2} /></span>
          <span className="brand-lockup"><span className="brand-name">Scholar<span>Saathi</span></span><span className="brand-caption">{t.tagline}</span></span>
        </a>
        <button className="mobile-menu icon-button" aria-label={menuOpen ? t.close : t.menu} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`} aria-label="Main navigation">
          <button className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => navigate('home')}>{t.home}</button>
          <button className={`nav-item ${view === 'finder' ? 'active' : ''}`} onClick={() => navigate('finder')}><Search size={16} />{t.finder}</button>
          <button className={`nav-item ${view === 'guidance' || view === 'wizard' || view === 'summary' ? 'active' : ''}`} onClick={() => selected ? navigate(progress.resumeView ?? 'wizard') : navigate('home')} disabled={!selected}>
            <BookOpenCheck size={16} />{t.preparation}
          </button>
          <button className={`nav-item ${view === 'account' || view === 'login' || view === 'signup' || view === 'reset-password' ? 'active' : ''}`} onClick={() => authUser ? navigate('account') : openAuth('login')} disabled={!authReady}>
            {authUser ? <GraduationCap size={16} /> : <LogIn size={16} />}{authUser ? t.account : t.login}
          </button>
        </nav>
        <div className={`header-actions ${menuOpen ? 'header-actions-open' : ''}`}>
          <div className="header-status">
            <span className={`connection-status ${online ? 'is-online' : 'is-offline'}`} role="status" aria-label={online ? t.online : t.offline}>
              {online ? <Cloud size={15} /> : <WifiOff size={15} />}
              <span>{online ? t.online : t.offline}</span>
            </span>
            <span className="save-status" role="status" aria-live={saveState === 'error' ? 'assertive' : 'polite'} aria-label={saveState === 'error' ? t.error : saveState === 'saving' ? t.saving : hasLocalData ? t.saved : t.noSavedData}>
              {saveState === 'saving' ? <LoaderCircle size={14} className="spin" /> : saveState === 'error' ? <CircleHelp size={14} /> : <CheckCircle2 size={14} />}
              <span>{saveState === 'error' ? t.error : saveState === 'saving' ? t.saving : hasLocalData ? t.saved : t.noSavedData}</span>
            </span>
          </div>
          {hasLocalData && <button ref={deleteTriggerRef} className="delete-link" onClick={() => setDeleteDialog(true)}><Trash2 size={15} /> {t.delete}</button>}
          <button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} aria-label="Switch language">
            <Languages size={17} /><span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
          {view === 'home'
            ? <button className="button button-primary header-cta" onClick={() => navigate('finder')}>{language === 'hi' ? 'छात्रवृत्ति खोजें' : 'Find scholarships'}<ArrowRight size={16} /></button>
            : view === 'finder'
              ? <a className="button button-primary header-cta" href="#finder-results-title">{language === 'hi' ? 'परिणाम देखें' : 'View results'}<ArrowRight size={16} /></a>
              : view === 'login' || view === 'signup' || view === 'reset-password'
                ? <button className="button button-primary header-cta" onClick={() => navigate('home')}>{t.guest}<ArrowRight size={16} /></button>
                : view === 'account'
                  ? <button className="button button-secondary header-cta" onClick={() => void logOut()} disabled={authBusy}><LogOut size={15} />{t.logout}</button>
                  : <button className="button button-primary header-cta" onClick={() => navigate(progress.resumeView ?? 'wizard')}>{language === 'hi' ? 'तैयारी पर लौटें' : 'Resume preparation'}<ArrowRight size={16} /></button>}
        </div>
      </header>
      <main className="main-area">
        <div className="page-content">
          {loading ? (
            <div className="loading-state"><LoaderCircle size={24} className="spin" /><span>{t.loading}</span></div>
          ) : view === 'home' ? (
            <HomePage
              language={language}
              finderData={finderData}
              progress={progress}
              savedScholarship={selected}
              savedView={progress.resumeView ?? 'wizard'}
              onOpenScholarship={openScholarshipDetails}
              onResume={() => navigate(progress.resumeView ?? 'wizard')}
              onFind={() => navigate('finder')}
            />
          ) : view === 'finder' ? (
            <FinderPage
              language={language}
              data={finderData}
              scholarships={scholarships}
              progress={progress}
              onProfileChange={(profile) => setFinderData((current) => ({ ...current, profile }))}
              onToggleSaved={(id) => setFinderData((current) => ({ ...current, savedScholarshipIds: toggleSavedScholarship(current.savedScholarshipIds, id) }))}
              onOpenScholarshipDetails={openScholarshipDetails}
              onStartPreparation={startScholarship}
              onResumePreparation={() => navigate(progress.resumeView ?? 'wizard')}
            />
          ) : view === 'login' || view === 'signup' || view === 'reset-password' ? (
            <AuthPage
              language={language}
              mode={authMode}
              configured={supabaseConfiguration.configured}
              configurationMessage={supabaseConfiguration.message}
              statusError={authError}
              busy={authBusy}
              onModeChange={openAuth}
              onSubmit={submitAuth}
              onGuest={() => navigate('home')}
            />
          ) : view === 'account' ? (
            <section className="account-page" aria-labelledby="account-title">
              <div className="account-card">
                <span className="finder-section-icon"><GraduationCap size={20} /></span>
                <span className="section-overline">{language === 'hi' ? 'आपका खाता' : 'YOUR ACCOUNT'}</span>
                <h1 id="account-title">{language === 'hi' ? 'खाता विवरण' : 'Account details'}</h1>
                {authUser && <p className="account-email">{authUser.email}</p>}
                {authError && <p className="auth-feedback error" role="alert">{authError}</p>}
                <div className="auth-config-warning">
                  <CircleHelp size={18} />
                  <div><strong>{language === 'hi' ? 'क्लाउड प्रोफ़ाइल सिंक बंद है' : 'Cloud profile sync is not connected'}</strong><p>{t.cloudSyncDisabled}</p></div>
                </div>
                <p className="account-guest-note">{language === 'hi'
                  ? 'आपकी मौजूदा स्थानीय तैयारी और खोज प्रोफ़ाइल इस डिवाइस पर बनी रहती है।'
                  : 'Your existing local preparation and finder profile remain on this device.'}
                </p>
                <div className="account-actions">
                  <button className="button button-primary" onClick={() => navigate('finder')}><Search size={15} />{t.finder}</button>
                  <button className="button button-secondary" onClick={() => void logOut()} disabled={authBusy}>{authBusy ? <LoaderCircle size={15} className="spin" /> : <LogOut size={15} />}{t.logout}</button>
                </div>
              </div>
            </section>
          ) : selected && view === 'guidance' ? (
            <ScholarshipGuidePage
              language={language}
              scholarship={selected}
              finderData={finderData}
              progress={progress}
              onBack={() => navigate('finder')}
              onStartPreparation={() => startScholarship(selected, preparationAnswersFromProfile(selected, finderData.profile))}
              onDocumentChange={updateDocument}
              onToggleSaved={(id) => setFinderData((current) => ({ ...current, savedScholarshipIds: toggleSavedScholarship(current.savedScholarshipIds, id) }))}
            />
          ) : selected && view === 'wizard' ? (
            <WizardPage
              scholarship={selected}
              language={language}
              answers={progress.answers}
              step={progress.step}
              onAnswer={(answers) => updateProgress({ answers })}
              onStep={(step) => updateProgress({ step })}
              onBack={() => progress.step === 0 ? navigate('home') : updateProgress({ step: progress.step - 1 })}
              onContinue={(step, last) => last ? navigate('summary') : updateProgress({ step: step + 1 })}
            />
          ) : selected && view === 'summary' && eligibility ? (
            <SummaryPage
              scholarship={selected}
              language={language}
              answers={progress.answers}
              documents={progress.documents}
              eligibility={eligibility}
              onDocumentChange={updateDocument}
              onBack={() => navigate('wizard')}
              onStartOver={() => void clearSavedData()}
            />
          ) : (
            <HomePage language={language} finderData={finderData} progress={progress} savedScholarship={selected} savedView={progress.resumeView ?? 'wizard'} onOpenScholarship={openScholarshipDetails} onResume={() => navigate(progress.resumeView ?? 'wizard')} onFind={() => navigate('finder')} />
          )}
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <a className="footer-brand" href="https://scholarships.gov.in/" target="_blank" rel="noreferrer"><span className="brand-mark"><GraduationCap size={19} /></span><span>ScholarSaathi</span></a>
          <p>{language === 'hi' ? 'आपकी जानकारी इसी ब्राउज़र में स्थानीय रूप से सेव रहती है। साझा डिवाइस पर संवेदनशील जानकारी न भरें; आधिकारिक नियम जाँचें।' : 'Your information is stored locally in this browser. Avoid sensitive details on shared devices; verify scheme rules on the official portal.'}</p>
          <a className="footer-portal" href="https://scholarships.gov.in/" target="_blank" rel="noreferrer">{language === 'hi' ? 'राष्ट्रीय छात्रवृत्ति पोर्टल' : 'National Scholarship Portal'}<ArrowRight size={15} /></a>
        </div>
      </footer>

      {deleteDialog && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteDialog(false) }}>
          <section ref={deleteDialogRef} className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <div className="modal-icon"><Trash2 size={21} /></div>
            <h2 id="delete-title">{t.deleteTitle}</h2>
            <p id="delete-description">{t.deleteBody}</p>
            <div className="modal-actions">
              <button ref={cancelDeleteRef} className="button button-secondary" onClick={() => { setDeleteDialog(false); deleteTriggerRef.current?.focus() }}>{t.cancel}</button>
              <button className="button button-danger" onClick={() => void clearSavedData()}>{t.confirmDelete}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
