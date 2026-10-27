import type { AppProgress, FinderData } from '../types'

const DATABASE_NAME = 'scholar-saathi'
const DATABASE_VERSION = 1
const STORE_NAME = 'preparation'
const PROGRESS_KEY = 'current'
const FINDER_KEY = 'finder'
let writeQueue: Promise<void> = Promise.resolve()

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation)
  writeQueue = result.then(() => undefined, () => undefined)
  return result
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage'))
    request.onblocked = () => reject(new Error('Local storage upgrade is blocked by another tab'))
  })
}

async function readRecord<T>(key: string, failureMessage: string): Promise<T | null> {
  const database = await openDatabase()
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).get(key) as IDBRequest<T | undefined>
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error ?? new Error(failureMessage))
      transaction.onabort = () => reject(transaction.error ?? new Error(`${failureMessage} (transaction aborted)`))
    })
  } finally {
    database.close()
  }
}

function writeRecord<T>(key: string, value: T, failureMessage: string): Promise<void> {
  return serializeWrite(async () => {
    const database = await openDatabase()
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        transaction.objectStore(STORE_NAME).put(value, key)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error ?? new Error(failureMessage))
        transaction.onabort = () => reject(transaction.error ?? new Error(`${failureMessage} (transaction aborted)`))
      })
    } finally {
      database.close()
    }
  })
}

export function loadProgress(): Promise<AppProgress | null> {
  return readRecord<AppProgress>(PROGRESS_KEY, 'Could not read saved preparation')
}

export function loadFinderData(): Promise<FinderData | null> {
  return readRecord<FinderData>(FINDER_KEY, 'Could not read the saved finder profile')
}

export function saveProgress(progress: AppProgress): Promise<void> {
  return writeRecord(PROGRESS_KEY, progress, 'Could not save preparation')
}

export function saveFinderData(data: FinderData): Promise<void> {
  return writeRecord(FINDER_KEY, data, 'Could not save the finder profile')
}

function deleteRecords(keys: string[], failureMessage: string): Promise<void> {
  return serializeWrite(async () => {
    const database = await openDatabase()
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        keys.forEach((key) => store.delete(key))
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error ?? new Error(failureMessage))
        transaction.onabort = () => reject(transaction.error ?? new Error(`${failureMessage} (transaction aborted)`))
      })
    } finally {
      database.close()
    }
  })
}

export function deleteProgress(): Promise<void> {
  return deleteRecords([PROGRESS_KEY], 'Could not delete saved preparation')
}

export function deleteAllLocalData(): Promise<void> {
  return deleteRecords([PROGRESS_KEY, FINDER_KEY], 'Could not delete saved application data')
}
