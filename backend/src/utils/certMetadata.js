import { ethers } from 'ethers'

// Normalize a field value identically to the on-chain expectation:
//   lowercase · trim · collapse internal whitespace
export function normalize(value) {
  if (value == null) return ''
  return String(value).toLowerCase().trim().replace(/\s+/g, ' ')
}

// keccak256(normalize(value)) — matches the hash stored on-chain at issuance
export function hashField(value) {
  return ethers.keccak256(ethers.toUtf8Bytes(normalize(value)))
}

// Format issueDate into the display string printed in the PDF (en-US locale).
// Must be called with the same locale/options at issuance time AND verification time.
export function formatIssueDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Compute the five metadata hashes stored on-chain for a certificate.
// issueDate may be a Date object, ISO string, or timestamp.
export function computeMetadataHashes({ name, usn, course, cgpa, issueDate }) {
  const displayDate = formatIssueDate(issueDate)
  return {
    nameHash:   hashField(name),
    usnHash:    hashField(usn),
    courseHash: hashField(course),
    gradeHash:  hashField(cgpa),
    dateHash:   hashField(displayDate),
    // Expose the formatted date so certificateService can persist it and
    // the PDF generator can use the exact same string that was hashed.
    formattedDate: displayDate,
  }
}
