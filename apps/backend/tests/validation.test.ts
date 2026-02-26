/**
 * Validation Utilities Tests
 */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  sanitizeString,
  validateRequiredFields,
} from '../src/utils/validation.js';

describe('isValidEmail', () => {
  it('should validate correct email', () => {
    expect(isValidEmail('test@example.com')).to.equal(true);
    expect(isValidEmail('user.name@domain.co.uk')).to.equal(true);
  });

  it('should reject invalid email', () => {
    expect(isValidEmail('invalid')).to.equal(false);
    expect(isValidEmail('@example.com')).to.equal(false);
    expect(isValidEmail('test@')).to.equal(false);
    expect(isValidEmail('')).to.equal(false);
  });
});

describe('isValidPassword', () => {
  it('should validate strong password', () => {
    expect(isValidPassword('Password123')).to.equal(true);
    expect(isValidPassword('Strong1Pass')).to.equal(true);
  });

  it('should reject weak password', () => {
    expect(isValidPassword('weak')).to.equal(false); // Too short
    expect(isValidPassword('alllowercase1')).to.equal(false); // No uppercase
    expect(isValidPassword('ALLUPPERCASE1')).to.equal(false); // No lowercase
    expect(isValidPassword('NoNumbers')).to.equal(false); // No numbers
  });
});

describe('isValidUUID', () => {
  it('should validate correct UUID', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).to.equal(true);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).to.equal(true);
  });

  it('should reject invalid UUID', () => {
    expect(isValidUUID('not-a-uuid')).to.equal(false);
    expect(isValidUUID('123')).to.equal(false);
    expect(isValidUUID('')).to.equal(false);
  });
});

describe('sanitizeString', () => {
  it('should remove dangerous characters', () => {
    expect(sanitizeString('  hello  ')).to.equal('hello');
    expect(sanitizeString("<script>alert('xss')</script>")).to.equal(
      "scriptalert('xss')/script",
    );
    expect(sanitizeString('normal text')).to.equal('normal text');
  });
});

describe('validateRequiredFields', () => {
  it('should validate required fields', () => {
    const data = {
      name: 'John',
      email: 'john@example.com',
      age: 30,
    };

    const result1 = validateRequiredFields(data, ['name', 'email']);
    expect(result1.valid).to.equal(true);
    expect(result1.missing.length).to.equal(0);

    // Test with a field that doesn't exist (intentionally testing error case)
    // @ts-expect-error - Testing validation with non-existent field
    const result2 = validateRequiredFields(data, ['name', 'phone']);
    expect(result2.valid).to.equal(false);
    expect(result2.missing).to.deep.equal(['phone']);
  });

  it('should detect empty values', () => {
    const data = {
      name: '',
      email: null,
      age: undefined,
    };

    const result = validateRequiredFields(data, ['name', 'email', 'age']);
    expect(result.valid).to.equal(false);
    expect(result.missing.length).to.equal(3);
  });
});
