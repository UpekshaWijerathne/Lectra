export const ROLES = ['student', 'lecturer', 'admin'];
// Roles a user may pick for themselves at signup. Admin accounts are set by hand in Firestore.
export const SELF_ASSIGNABLE_ROLES = ['student', 'lecturer'];

export const ROLE_HOME = {
  student: '/student',
  lecturer: '/lecturer',
  admin: '/lecturer',
};

export function homePathForRole(role) {
  return ROLE_HOME[role] ?? '/choose-role';
}

export function canAccess(userRole, allowedRoles) {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}
