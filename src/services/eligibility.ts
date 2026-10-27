import type { EligibilityResult, Scholarship, WizardAnswers } from '../types'

export function evaluateEligibility(scholarship: Scholarship, answers: WizardAnswers): EligibilityResult {
  if (!scholarship.requirementsVerified) {
    return {
      status: 'needs-verification',
      reasons: [
        'The current official eligibility criteria have not been verified for this guide.',
        'Your answers are saved for preparation only and cannot determine eligibility without those criteria.',
        'Check the official scheme notice or ask your school, college, or a Common Service Centre for help.',
      ],
    }
  }

  if (!answers.applicationType || !answers.studyLevel || !answers.state) {
    return {
      status: 'needs-verification',
      reasons: ['Some information is missing. Complete the preparation questions before checking again.'],
    }
  }

  return {
    status: 'needs-verification',
    reasons: ['Your details need to be compared with the latest official scheme notice before an outcome can be shown.'],
  }
}
