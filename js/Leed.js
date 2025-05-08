/**
 * Leed.js
 *
 * This class extends `Secret` to implement a Leed — a paid-access booking opportunity.
 *
 * Design:
 * - Uses the shared `fieldDefs` format: { key: { value, visibility } }
 * - Enforces that fields like `title`, `date`, and `price` must be provided
 * - Inherits two-bucket architecture from `Secret`: publicFields and privateFields
 * - Adds a summary method for quick UI display
 *
 * Example:
 * const l = new Leed({
 *   creator: 'user789',
 *   price: 100,
 *   fieldDefs: {
 *     title: { value: 'Corporate Party', visibility: 'public' },
 *     date: { value: '2025-08-20', visibility: 'public' },
 *     phone: { value: '310-999-1234', visibility: 'private' },
 *     email: { value: 'client@example.com', visibility: 'private' }
 *   }
 * });
 */

import { Secret } from 'Secret.js';

export class Leed extends Secret {
  constructor(props) {
    const required = ['title', 'date', 'price'];
    for (const key of required) {
      if (!props.fieldDefs?.[key]) {
        throw new Error(`Missing required field: ${key}`);
      }
    }
    super(props);
  }

  //summarize() {
    //return `${this.publicFields.title || '[No Title]'} scheduled for ${this.publicFields.date || '[No Date]'}`;
  //}
}
