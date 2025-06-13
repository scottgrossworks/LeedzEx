// http_utils.js
// Handles local DB communication for querying existing marks and submitting new ones

const BASE_URL = "http://localhost:3000";

/**
 * Query the local server for an existing mark using one or more unique fields.
 * Supports fallback using email, phone, or name.
 * @param {Object} params - { email, phone, name }
 * @returns {Promise<Object|null>} - the found mark or null
 */
export async function findExistingMark({ email, phone, name }) {
  const searchKeys = [
    { field: "email", value: email },
    { field: "phone", value: phone },
    { field: "name", value: name }
  ];

  for (const { field, value } of searchKeys) {
    if (!value) continue;

    try {
      const response = await fetch(`${BASE_URL}/marks?${field}=${encodeURIComponent(value)}`);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.length > 0) return data[0]; // Return first match
    } catch (err) {
      console.warn(`[http_utils] Failed query for ${field}:`, err);
    }
  }

  return null;
}

/**
 * Submit a new mark to the local server
 * @param {Object} mark - The mark object
 * @returns {Promise<Object>} - The server response
 */
export async function submitMark(mark) {
  try {
    const response = await fetch(`${BASE_URL}/marks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mark)
    });

    return await response.json();
  } catch (err) {
    console.error("[http_utils] Failed to submit mark:", err);
    return null;
  }
}
