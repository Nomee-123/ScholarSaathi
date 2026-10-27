import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CircleHelp, GraduationCap, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import type { Language } from '../types'

export type AuthMode = 'login' | 'signup' | 'reset' | 'update-password'

interface AuthPageProps {
  language: Language
  mode: AuthMode
  configured: boolean
  configurationMessage: string
  statusError: string
  busy: boolean
  onModeChange: (mode: AuthMode) => void
  onSubmit: (email: string, password?: string) => Promise<string>
  onGuest: () => void
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export function AuthPage({ language, mode, configured, configurationMessage, statusError, busy, onModeChange, onSubmit, onGuest }: AuthPageProps) {
  const hi = language === 'hi'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const isReset = mode === 'reset'
  const isUpdate = mode === 'update-password'
  const isSignup = mode === 'signup'

  const copy = {
    login: {
      eyebrow: hi ? 'आपका खाता' : 'YOUR ACCOUNT',
      title: hi ? 'वापस स्वागत है' : 'Welcome back',
      description: hi ? 'अपने छात्र खाते में प्रवेश करें।' : 'Sign in to your student account.',
      action: hi ? 'लॉग इन करें' : 'Log in',
    },
    signup: {
      eyebrow: hi ? 'शुरुआत करें' : 'GET STARTED',
      title: hi ? 'अपना खाता बनाएँ' : 'Create your account',
      description: hi ? 'ईमेल के ज़रिए अपना खाता बनाएँ।' : 'Create an account with your email address.',
      action: hi ? 'खाता बनाएँ' : 'Create account',
    },
    reset: {
      eyebrow: hi ? 'खाते की सहायता' : 'ACCOUNT HELP',
      title: hi ? 'पासवर्ड रीसेट करें' : 'Reset your password',
      description: hi ? 'रीसेट लिंक पाने के लिए अपने खाते का ईमेल दर्ज करें।' : 'Enter your account email and we’ll send a password reset link.',
      action: hi ? 'रीसेट लिंक भेजें' : 'Send reset link',
    },
    update: {
      eyebrow: hi ? 'खाते की सहायता' : 'ACCOUNT HELP',
      title: hi ? 'नया पासवर्ड चुनें' : 'Choose a new password',
      description: hi ? 'अपने खाते के लिए नया पासवर्ड दर्ज करें।' : 'Enter a new password for your account.',
      action: hi ? 'पासवर्ड अपडेट करें' : 'Update password',
    },
  }[isUpdate ? 'update' : mode]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if ((isSignup || isUpdate) && password !== confirmPassword) {
      setMessage({ kind: 'error', text: hi ? 'पासवर्ड मेल नहीं खाते।' : 'The passwords do not match.' })
      return
    }
    try {
      const result = await onSubmit(email.trim(), isReset ? undefined : password)
      setMessage({ kind: 'success', text: result })
      if (isSignup || isUpdate) {
        setPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      setMessage({ kind: 'error', text: errorMessage(error) })
    }
  }

  return (
    <section className="auth-page" aria-labelledby="auth-title">
      <div className="auth-card">
        <a className="auth-brand" href="#home" onClick={(event) => { event.preventDefault(); onGuest() }}>
          <span className="brand-mark"><GraduationCap size={21} /></span><span>ScholarSaathi</span>
        </a>
        <div className="auth-heading">
          <span className="section-overline">{copy.eyebrow}</span>
          <h1 id="auth-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </div>

        {!configured && (
          <div className="auth-config-warning" role="status">
            <CircleHelp size={18} />
            <div>
              <strong>{hi ? 'लॉगिन अभी उपलब्ध नहीं है' : 'Authentication is not configured'}</strong>
              <p>{configurationMessage}</p>
            </div>
          </div>
        )}
        {statusError && <p className="auth-feedback error" role="alert">{statusError}</p>}

        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {!isUpdate && (
            <label className="finder-field" htmlFor="auth-email">
              <span>{hi ? 'ईमेल पता' : 'Email address'}</span>
              <span className="auth-input-wrap"><Mail size={16} /><input id="auth-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={!configured || busy} /></span>
            </label>
          )}
          {!isReset && (
            <label className="finder-field" htmlFor="auth-password">
              <span>{hi ? isUpdate ? 'नया पासवर्ड' : 'पासवर्ड' : isUpdate ? 'New password' : 'Password'}</span>
              <span className="auth-input-wrap"><KeyRound size={16} /><input id="auth-password" type="password" autoComplete={isSignup || isUpdate ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={!configured || busy} /></span>
              {(isSignup || isUpdate) && <small>{hi ? 'कम से कम 8 अक्षर।' : 'Use at least 8 characters.'}</small>}
            </label>
          )}
          {(isSignup || isUpdate) && (
            <label className="finder-field" htmlFor="auth-confirm-password">
              <span>{hi ? 'पासवर्ड की पुष्टि करें' : 'Confirm password'}</span>
              <span className="auth-input-wrap"><LockKeyhole size={16} /><input id="auth-confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={!configured || busy} /></span>
            </label>
          )}
          {message && <p className={`auth-feedback ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={!configured || busy}>
            {busy ? <LoaderCircle size={16} className="spin" /> : isReset ? <Mail size={16} /> : isUpdate ? <ShieldCheck size={16} /> : <ArrowRight size={16} />}
            {busy ? (hi ? 'कृपया प्रतीक्षा करें…' : 'Please wait…') : copy.action}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && <>
            <button onClick={() => { setMessage(null); onModeChange('reset') }}>{hi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}</button>
            <p>{hi ? 'खाता नहीं है?' : 'New to ScholarSaathi?'} <button onClick={() => { setMessage(null); onModeChange('signup') }}>{hi ? 'खाता बनाएँ' : 'Create an account'}</button></p>
          </>}
          {mode === 'signup' && <p>{hi ? 'पहले से खाता है?' : 'Already have an account?'} <button onClick={() => { setMessage(null); onModeChange('login') }}>{hi ? 'लॉग इन करें' : 'Log in'}</button></p>}
          {mode === 'reset' && <button onClick={() => { setMessage(null); onModeChange('login') }}><ArrowLeft size={14} />{hi ? 'लॉगिन पर लौटें' : 'Back to log in'}</button>}
          {mode === 'update-password' && <button onClick={onGuest}><ArrowLeft size={14} />{hi ? 'अभी नहीं' : 'Cancel'}</button>}
        </div>

        <div className="auth-guest-note">
          <p>{hi ? 'खाता बनाना वैकल्पिक है। आप अतिथि के रूप में ऐप का उपयोग जारी रख सकते हैं।' : 'An account is optional. You can continue using ScholarSaathi in guest mode.'}</p>
          <button className="button button-secondary" onClick={onGuest}>{hi ? 'अतिथि के रूप में जारी रखें' : 'Continue as guest'}<ArrowRight size={15} /></button>
        </div>
        <p className="auth-local-note"><LockKeyhole size={13} />{hi ? 'अतिथि की तैयारी इसी डिवाइस पर रहती है।' : 'Guest preparation stays in local IndexedDB on this device.'}</p>
      </div>
    </section>
  )
}
