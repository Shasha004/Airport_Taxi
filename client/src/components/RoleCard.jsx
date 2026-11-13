import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RoleCard({
  title,
  subtitle,
  description,
  features = [],
  icon: Icon,
  badgeText,
  badgeType = 'default',
  buttonText,
  onClick,
  disabled = false,
  highlight = false,
}) {
  return (
    <div className={`role-card ${highlight ? 'highlight' : ''} ${disabled ? 'disabled' : ''}`}>
      {badgeText && (
        <span className={`role-badge badge-${badgeType}`}>
          {badgeText}
        </span>
      )}
      
      <div className="role-icon-wrapper">
        {Icon && <Icon size={32} className="role-icon" />}
      </div>

      <div className="role-content">
        <h3 className="role-title">{title}</h3>
        {subtitle && <p className="role-subtitle">{subtitle}</p>}
        <p className="role-description">{description}</p>

        {features.length > 0 && (
          <ul className="role-features">
            {features.map((feature, idx) => (
              <li key={idx} className="feature-item">
                <CheckCircle2 size={16} className="feature-icon" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className={`role-btn ${disabled ? 'btn-disabled' : 'btn-primary'}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span>{buttonText}</span>
        {!disabled && <ArrowRight size={18} />}
      </button>
    </div>
  );
}

