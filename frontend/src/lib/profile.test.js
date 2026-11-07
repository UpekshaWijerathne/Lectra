import { describe, it, expect } from 'vitest';
import { buildProfileRequest } from './profile';

describe('buildProfileRequest', () => {
  it('trims the name and keeps the role', () => {
    expect(buildProfileRequest({ name: '  Dilan  ', email: 'd@test.com', role: 'student' }))
      .toEqual({ name: 'Dilan', role: 'student', preferredLanguage: 'en' });
  });
  it('uses the start of the email when the name is missing', () => {
    expect(buildProfileRequest({ name: null, email: 'lec1@test.com', role: 'lecturer' }).name).toBe('lec1');
    expect(buildProfileRequest({ name: '   ', email: 'a.b@test.com', role: 'student' }).name).toBe('a.b');
  });
  it('keeps a given language', () => {
    expect(buildProfileRequest({ name: 'A', email: 'a@t.com', role: 'student', preferredLanguage: 'si' }).preferredLanguage).toBe('si');
  });
  it('sends only the fields the backend reads', () => {
    expect(Object.keys(buildProfileRequest({ name: 'A', email: 'a@t.com', role: 'student' })).sort())
      .toEqual(['name', 'preferredLanguage', 'role']);
  });
});