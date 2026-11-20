import { describe, it, expect } from 'vitest';
import { canAccess, homePathForRole, SELF_ASSIGNABLE_ROLES } from './roles';

describe('canAccess', () => {
  it('allows a role that is in the list', () => {
    expect(canAccess('lecturer', ['lecturer', 'admin'])).toBe(true);
  });
  it('blocks a role that is not in the list', () => {
    expect(canAccess('student', ['lecturer', 'admin'])).toBe(false);
    expect(canAccess('lecturer', ['student'])).toBe(false);
  });
  it('blocks users with no role', () => {
    expect(canAccess(null, ['student'])).toBe(false);
    expect(canAccess(undefined, undefined)).toBe(false);
  });
  it('allows any signed-in role when no list is given', () => {
    expect(canAccess('student')).toBe(true);
    expect(canAccess('student', [])).toBe(true);
  });
});

describe('homePathForRole', () => {
  it('sends each role to its own home', () => {
    expect(homePathForRole('student')).toBe('/student');
    expect(homePathForRole('lecturer')).toBe('/lecturer');
  });
  it('sends users with no role to role selection', () => {
    expect(homePathForRole(null)).toBe('/choose-role');
  });
});

describe('SELF_ASSIGNABLE_ROLES', () => {
  it('does not let users pick admin', () => {
    expect(SELF_ASSIGNABLE_ROLES).toEqual(['student', 'lecturer']);
  });
});
