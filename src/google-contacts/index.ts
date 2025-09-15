/**
 * Google Contacts Integration
 * Fetches contact names from Google Contacts API
 * AIDEV-NOTE: google-contacts; integrates with Google People API for contact names (KISS)
 */

import { google, people_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface ContactInfo {
  phoneNumber: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
}

export class GoogleContactsService {
  private people: people_v1.People;
  private contactsCache: Map<string, ContactInfo> = new Map();

  constructor(private auth: OAuth2Client) {
    this.people = google.people({ version: 'v1', auth });
  }

  /**
   * Normalize phone number for matching
   * Removes all non-digit characters and country code variations
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');

    // Remove common country code prefixes
    if (normalized.startsWith('55') && normalized.length > 11) {
      normalized = normalized.substring(2); // Remove Brazil country code
    }
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1); // Remove leading zero
    }

    return normalized;
  }

  /**
   * Load all contacts from Google Contacts
   */
  async loadContacts(): Promise<void> {
    try {
      console.log('📱 Loading contacts from Google Contacts...');

      let pageToken: string | undefined;
      let totalContacts = 0;

      do {
        const response = await this.people.people.connections.list({
          resourceName: 'people/me',
          pageSize: 1000,
          personFields: 'names,phoneNumbers',
          pageToken
        });

        if (response.data.connections) {
          for (const person of response.data.connections) {
            // Extract phone numbers
            if (person.phoneNumbers) {
              for (const phoneNumber of person.phoneNumbers) {
                if (phoneNumber.value) {
                  const normalized = this.normalizePhoneNumber(phoneNumber.value);

                  // Extract name
                  let displayName = '';
                  let givenName: string | undefined;
                  let familyName: string | undefined;

                  if (person.names && person.names.length > 0) {
                    const name = person.names[0];
                    if (name) {
                      displayName = name.displayName || '';
                      givenName = name.givenName || undefined;
                      familyName = name.familyName || undefined;

                      if (!displayName && (givenName || familyName)) {
                        displayName = [givenName, familyName].filter(Boolean).join(' ');
                      }
                    }
                  }

                  if (displayName) {
                    this.contactsCache.set(normalized, {
                      phoneNumber: normalized,
                      displayName,
                      givenName,
                      familyName
                    });
                    totalContacts++;
                  }
                }
              }
            }
          }
        }

        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);

      console.log(`✅ Loaded ${totalContacts} contacts from Google Contacts`);
    } catch (error: any) {
      if (error.code === 403 || error.response?.status === 403) {
        console.warn('⚠️  Google Contacts API not enabled or no permission');
        console.warn('   You may need to re-authenticate with: npm run auth');
      } else {
        console.error('❌ Failed to load Google Contacts:', error.message);
        if (error.response?.data) {
          console.error('   Details:', error.response.data.error?.message || error.response.data);
        }
      }
    }
  }

  /**
   * Find contact by phone number
   */
  findContactByPhone(phoneNumber: string): ContactInfo | undefined {
    const normalized = this.normalizePhoneNumber(phoneNumber);

    // Try exact match first
    let contact = this.contactsCache.get(normalized);

    // If not found, try with different lengths (with/without area code)
    if (!contact && normalized.length >= 8) {
      // Try last 8 digits (without area code)
      const last8 = normalized.slice(-8);
      for (const [key, value] of this.contactsCache.entries()) {
        if (key.endsWith(last8)) {
          contact = value;
          break;
        }
      }

      // Try last 9 digits (mobile with 9)
      if (!contact) {
        const last9 = normalized.slice(-9);
        for (const [key, value] of this.contactsCache.entries()) {
          if (key.endsWith(last9)) {
            contact = value;
            break;
          }
        }
      }
    }

    return contact;
  }

  /**
   * Get contact name for WhatsApp JID
   */
  getContactName(jid: string): string | undefined {
    // Extract phone number from JID
    const phoneNumber = jid.split('@')[0];
    if (!phoneNumber || phoneNumber.length < 8) {
      return undefined;
    }

    const contact = this.findContactByPhone(phoneNumber);
    return contact?.displayName;
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.contactsCache.size;
  }
}