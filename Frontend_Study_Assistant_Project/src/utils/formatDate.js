/**
 * Safely formats the generation date using toLocaleString with dateStyle and timeStyle.
 * Includes defensive protection against invalid dates, strings, or numbers.
 *
 * @param {string|number|Date|null|undefined} dateInput
 * @returns {string} Formatted date/time string or fallback
 */
export function formatGeneratedDate(dateInput) {
  if (!dateInput) return 'Generated just now';
  try {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) {
      return 'Generated just now';
    }
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (_err) {
    return 'Generated just now';
  }
}

