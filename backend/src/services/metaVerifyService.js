import { hashField, normalize } from '../utils/certMetadata.js'

// Compare each extracted field against its on-chain keccak256 hash.
// Returns per-field results and an overall `allMatched` flag.
//
// storedHashes: { nameHash, usnHash, courseHash, gradeHash, dateHash }
// extracted:    { name, usn, course, cgpa, date }   (values may be null)
export function compareFields(extracted, storedHashes) {
  const fields = [
    { key: 'name',   extracted: extracted.name,   storedHash: storedHashes.nameHash,   label: 'Student Name' },
    { key: 'usn',    extracted: extracted.usn,    storedHash: storedHashes.usnHash,    label: 'USN / Roll No' },
    { key: 'course', extracted: extracted.course, storedHash: storedHashes.courseHash, label: 'Course / Program' },
    { key: 'cgpa',   extracted: extracted.cgpa,   storedHash: storedHashes.gradeHash,  label: 'CGPA / Marks' },
    { key: 'date',   extracted: extracted.date,   storedHash: storedHashes.dateHash,   label: 'Issue Date' },
  ]

  // A zero-hash (all zeros) means the field was not stored on-chain (e.g., optional usn/cgpa
  // left blank at issuance time).  Treat those as inconclusive rather than mismatch.
  const ZERO_HASH = '0x' + '0'.repeat(64)

  let anyMismatch     = false
  let anyInconclusive = false

  const results = fields.map(({ key, extracted: val, storedHash, label }) => {
    // Field not stored on-chain
    if (!storedHash || storedHash === ZERO_HASH) {
      return { key, label, extracted: val, matched: null, reason: 'not-stored' }
    }

    // Field not extractable from document
    if (!val || val.trim() === '') {
      anyInconclusive = true
      return { key, label, extracted: null, matched: null, reason: 'not-extracted' }
    }

    const computedHash = hashField(val)
    const matched = computedHash === storedHash
    if (!matched) anyMismatch = true

    return {
      key,
      label,
      extracted: val,
      normalised: normalize(val),
      matched,
      reason: matched ? 'match' : 'mismatch',
    }
  })

  return {
    fieldResults: results,
    allMatched:      !anyMismatch && !anyInconclusive,
    anyMismatch,
    anyInconclusive,
  }
}

// Fall back to comparing against DB values (for certificates that have no blockchain data).
// storedValues: { name, usn, course, cgpa, date } — plain strings from the DB/holder record
export function compareFieldsAgainstDB(extracted, storedValues) {
  const fields = [
    { key: 'name',   extracted: extracted.name,   stored: storedValues.name,   label: 'Student Name' },
    { key: 'usn',    extracted: extracted.usn,    stored: storedValues.usn,    label: 'USN / Roll No' },
    { key: 'course', extracted: extracted.course, stored: storedValues.course, label: 'Course / Program' },
    { key: 'cgpa',   extracted: extracted.cgpa,   stored: storedValues.cgpa,   label: 'CGPA / Marks' },
    { key: 'date',   extracted: extracted.date,   stored: storedValues.date,   label: 'Issue Date' },
  ]

  let anyMismatch     = false
  let anyInconclusive = false

  const results = fields.map(({ key, extracted: val, stored, label }) => {
    if (!stored || stored === '') {
      return { key, label, extracted: val, matched: null, reason: 'not-stored' }
    }
    if (!val || val.trim() === '') {
      anyInconclusive = true
      return { key, label, extracted: null, matched: null, reason: 'not-extracted' }
    }

    const matched = normalize(val) === normalize(stored)
    if (!matched) anyMismatch = true

    return {
      key,
      label,
      extracted: val,
      normalised: normalize(val),
      matched,
      reason: matched ? 'match' : 'mismatch',
    }
  })

  return {
    fieldResults: results,
    allMatched:      !anyMismatch && !anyInconclusive,
    anyMismatch,
    anyInconclusive,
  }
}
