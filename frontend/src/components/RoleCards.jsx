import { SELF_ASSIGNABLE_ROLES, ROLE_INFO } from '../lib/roles';

export default function RoleCards({ value, onChange, disabled = false }) {
  return (
    <fieldset className="role-cards" disabled={disabled}>
      <legend className="muted">I am a</legend>
      {SELF_ASSIGNABLE_ROLES.map((r) => (
        <label key={r} className={`role-card${value === r ? ' selected' : ''}`}>
          <input
            type="radio"
            name="role"
            value={r}
            checked={value === r}
            onChange={() => onChange(r)}
          />
          <strong>{ROLE_INFO[r].title}</strong>
          <span className="muted">{ROLE_INFO[r].text}</span>
        </label>
      ))}
    </fieldset>
  );
}