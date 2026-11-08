import React from 'react';

export default function RoleCards({ value, onChange, disabled }) {
  const roles = [
    {
      id: 'student',
      title: 'Student',
      desc: 'Ask questions anonymously & vote on live lecture topics',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'lecturer',
      title: 'Lecturer',
      desc: 'Moderate Q&A, broadcast polls & view analytics',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
  ];

  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled={disabled}>
      <legend style={{
        fontWeight: 600,
        fontSize: '0.78rem',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '8px'
      }}>
        Select Academic Role
      </legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {roles.map((r) => {
          const isSelected = value === r.id;
          return (
            <label
              key={r.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: '12px',
                border: isSelected ? '2px solid #19A7A1' : '1.5px solid #DCE4EC',
                backgroundColor: isSelected ? '#E8F7F6' : '#FFFFFF',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={isSelected}
                onChange={() => onChange(r.id)}
                disabled={disabled}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
              
              {/* Header with Icon + Checkmark / Radio dot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isSelected ? '#19A7A1' : '#F4F7FA',
                  color: isSelected ? '#FFFFFF' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {r.icon}
                </span>

                {/* Status indicator */}
                {isSelected ? (
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#19A7A1',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : (
                  <span style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid #DCE4EC',
                    background: '#FFFFFF',
                    display: 'inline-block'
                  }} />
                )}
              </div>

              {/* Text info */}
              <div>
                <strong style={{ display: 'block', fontSize: '0.92rem', color: '#17324D', marginBottom: '2px' }}>
                  {r.title}
                </strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', lineHeight: 1.35 }}>
                  {r.desc}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
