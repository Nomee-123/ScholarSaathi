import type { AppProgress, Scholarship } from '../types'

export const PREPARATION_ANSWER_COUNT = 3

export interface PreparationProgress {
  completedAnswers: number
  readyDocuments: number
  totalTasks: number
  completedTasks: number
  remainingTasks: number
  percentage: number
}

export function getPreparationProgress(
  scholarship: Scholarship | undefined,
  progress: Pick<AppProgress, 'answers' | 'documents'>,
): PreparationProgress {
  if (!scholarship) {
    return {
      completedAnswers: 0,
      readyDocuments: 0,
      totalTasks: 0,
      completedTasks: 0,
      remainingTasks: 0,
      percentage: 0,
    }
  }

  const completedAnswers = [
    progress.answers.applicationType,
    progress.answers.studyLevel,
    progress.answers.state,
  ].filter(Boolean).length
  const readyDocuments = scholarship.documents.filter((document) => progress.documents[document.id] === 'ready').length
  const totalTasks = PREPARATION_ANSWER_COUNT + scholarship.documents.length
  const completedTasks = completedAnswers + readyDocuments

  return {
    completedAnswers,
    readyDocuments,
    totalTasks,
    completedTasks,
    remainingTasks: totalTasks - completedTasks,
    percentage: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
  }
}
