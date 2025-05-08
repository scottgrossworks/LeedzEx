/**
 * Secret.js
 * 
 * This class models a generic 'secret' — an object with field-level access controls and optional monetization.
 * 
 * accepts a single `fieldDefs` object with value + visibility combined
 * - Internally splits fields into `publicFields` and `privateFields` based on inline visibility flags
 * 
 *   
 * Example Usage:
 * const s = new Secret({
 *   creator: 'user1',
 *   price: 25,
 *   fieldDefs: {
 *     title: { value: 'Hidden Gem Gig', visibility: 'public' },
 *     email: { value: 'vip@hidden.com', visibility: 'private' },
 *     location: { value: 'Downtown LA', visibility: 'private' }
 *   }
 * });
 * 
 * 
 */

/**
 * @typedef {Object} FieldDef
 * @property {*} value - The value of the field
 * @property {'public' | 'private'} visibility - Field visibility
 */

/**
 * @typedef {Object.<string, FieldDef>} FieldDefs
 */


export class Secret {
    static LOCKED = 0;
    static UNLOCKED = 1;
    static BOUGHT = 2;
    static EXPIRED = 3;
  

    /**
     * @param {Object} config
     * @param {string} config.creator
     * @param {number} config.price
     * @param {FieldDefs} config.fieldDefs
     */
    constructor({ id, creator, price, fieldDefs = {}, create_date = new Date().toISOString() }) {
      if (!price || price <= 1) throw new Error("Price must be greater than $1");
  
      this.id = id || Secret.generateId();
      this.creator = creator;
      this.create_date = create_date;
      this.price = price;
      this.status = Secret.LOCKED;
  
      this.publicFields = {};
      this.privateFields = {};
      this.visibilityMap = {};
  
      for (const [key, def] of Object.entries(fieldDefs)) {
        const { value, visibility } = def;
        if (visibility === 'private') {
          this.privateFields[key] = value;
        } else {
          this.publicFields[key] = value;
        }
        this.visibilityMap[key] = visibility;
      }
    }
  
    static generateId() {
      return crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, "0");
    }
  
    toggleVisibility(key, newVisibility) {
      if (newVisibility === "public") {
        this.publicFields[key] = this.privateFields[key];
        delete this.privateFields[key];
      } else {
        this.privateFields[key] = this.publicFields[key];
        delete this.publicFields[key];
      }
      this.visibilityMap[key] = newVisibility;
    }
  
    getField(key) {
      const visibility = this.visibilityMap[key];
      if (visibility === "public") return this.publicFields[key];
      if (visibility === "private" && this.status === Secret.UNLOCKED) return this.privateFields[key];
      throw new Error(`Access denied to private field: ${key}`);
    }
  
    unlock() {
      this.status = Secret.UNLOCKED;
    }
  
    expire() {
      this.status = Secret.EXPIRED;
    }
  
    toJSON(includePrivate = false) {
      return {
        id: this.id,
        creator: this.creator,
        create_date: this.create_date,
        price: this.price,
        status: this.status,
        publicFields: this.publicFields,
        ...(includePrivate && this.status === Secret.UNLOCKED
          ? { privateFields: this.privateFields }
          : {})
      };
    }
  }
  