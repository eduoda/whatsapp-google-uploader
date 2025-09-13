/**
 * Scope Validator - OAuth scope validation and management
 * AIDEV-TODO: implement-scope-validator; OAuth scope validation logic
 */

import { REQUIRED_SCOPES } from './constants';

export class ScopeValidator {
  validateScopes(requestedScopes: string[]): void {
    // AIDEV-NOTE: scope-validation; ensures minimum required scopes are present
    if (!requestedScopes || requestedScopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    // Validate scope format first (must be valid Google API scopes)
    for (const scope of requestedScopes) {
      if (!this.isValidScope(scope)) {
        throw new Error(`Invalid scope`);
      }
    }

    // Then check if all required scopes are present
    const missingScopes = this.getMissingScopes(requestedScopes);
    if (missingScopes.length > 0) {
      throw new Error(`Missing required scopes: ${missingScopes.join(', ')}`);
    }
  }

  hasRequiredScopes(grantedScopes: string[]): boolean {
    // AIDEV-NOTE: scope-checking; verifies all required scopes are granted
    return REQUIRED_SCOPES.every(requiredScope => 
      grantedScopes.includes(requiredScope)
    );
  }

  getMinimalScopes(): string[] {
    return [...REQUIRED_SCOPES];
  }

  getMissingScopes(grantedScopes: string[]): string[] {
    // AIDEV-NOTE: scope-diff; finds missing required scopes
    return REQUIRED_SCOPES.filter(requiredScope => 
      !grantedScopes.includes(requiredScope)
    );
  }

  isValidScope(scope: string): boolean {
    // AIDEV-NOTE: scope-format; validates Google API scope format
    if (!scope || typeof scope !== 'string') {
      return false;
    }

    // Google API scopes should start with https://www.googleapis.com/auth/
    return scope.startsWith('https://www.googleapis.com/auth/') && scope.length > 40;
  }
}