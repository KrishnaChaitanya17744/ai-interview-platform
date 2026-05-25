// client/src/components/RoleSelector.jsx

import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────
// Company Logo Component
// Uses Google's favicon service — free, no API key, always works
// Falls back to letter avatar if logo fails to load
// ─────────────────────────────────────────────────────────
const CompanyLogo = ({ domain, name, color }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fallback: colored letter avatar
    return (
      <div
        className="company-logo-fallback"
        style={{ background: color + '22', color }}
      >
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={`${name} logo`}
      className="company-logo-img"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

// ─────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────
const roles = [
  { value: 'frontend', label: 'Frontend',     icon: '🖥️', desc: 'React, CSS, JS'          },
  { value: 'backend',  label: 'Backend',      icon: '⚙️', desc: 'Node, APIs, Databases'   },
  { value: 'data',     label: 'Data Science', icon: '📊', desc: 'ML, Python, SQL'          },
  { value: 'hr',       label: 'HR Round',     icon: '👥', desc: 'Behavioral, Soft Skills'  },
];

const companyCategories = [
  {
    id: 'bigtech',
    label: 'Big Tech',
    companies: [
      { value: 'google',     label: 'Google',    domain: 'google.com',     color: '#4285F4', colorRgb: '66 133 244'   },
      { value: 'amazon',     label: 'Amazon',    domain: 'amazon.com',     color: '#FF9900', colorRgb: '255 153 0'    },
      { value: 'meta',       label: 'Meta',      domain: 'meta.com',       color: '#0081FB', colorRgb: '0 129 251'    },
      { value: 'microsoft',  label: 'Microsoft', domain: 'microsoft.com',  color: '#00A4EF', colorRgb: '0 164 239'    },
      { value: 'apple',      label: 'Apple',     domain: 'apple.com',      color: '#A2AAAD', colorRgb: '162 170 173'  },
    ],
  },
  {
    id: 'indian',
    label: 'Indian Tech',
    companies: [
      { value: 'tcs',          label: 'TCS',          domain: 'tcs.com',           color: '#0057A8', colorRgb: '0 87 168'    },
      { value: 'infosys',      label: 'Infosys',      domain: 'infosys.com',       color: '#007CC3', colorRgb: '0 124 195'   },
      { value: 'wipro',        label: 'Wipro',         domain: 'wipro.com',         color: '#9B4DCA', colorRgb: '155 77 202'  },
      { value: 'hcl',          label: 'HCL',           domain: 'hcltech.com',       color: '#009F6B', colorRgb: '0 159 107'   },
      { value: 'techmahindra', label: 'Tech Mahindra', domain: 'techmahindra.com',  color: '#E4002B', colorRgb: '228 0 43'    },
    ],
  },
  {
    id: 'product',
    label: 'Product & Unicorn',
    companies: [
      { value: 'flipkart', label: 'Flipkart', domain: 'flipkart.com', color: '#2874F0', colorRgb: '40 116 240'  },
      { value: 'zoho',     label: 'Zoho',     domain: 'zoho.com',     color: '#E2561A', colorRgb: '226 86 26'   },
      { value: 'paytm',    label: 'Paytm',    domain: 'paytm.com',    color: '#00BAF2', colorRgb: '0 186 242'   },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    companies: [
      { value: 'startup_general', label: 'Startup',  domain: null, color: '#10B981', colorRgb: '16 185 129', icon: '🚀' },
      { value: 'general',         label: 'General',  domain: null, color: '#8B5CF6', colorRgb: '139 92 246',  icon: '🎯' },
    ],
  },
];

// Flat list for lookups
const allCompanies = companyCategories.flatMap((c) => c.companies);

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <polyline points="2,6 5,9 10,3" />
  </svg>
);

const getCompanyType = (company) => {
  const mncList = [
    'google','amazon','meta','microsoft','apple',
    'tcs','infosys','wipro','hcl','techmahindra',
    'flipkart','zoho','paytm',
  ];
  return mncList.includes(company) ? 'mnc' : 'startup';
};

const getCompanyTagline = (company) => ({
  google:          'Problem solving, algorithms & system design',
  amazon:          'Leadership principles & AWS knowledge',
  meta:            'Product thinking & React ecosystem',
  microsoft:       'Data structures, OOP & Azure cloud',
  apple:           'Design thinking, quality & Swift/ObjC',
  tcs:             'Core CS fundamentals & communication',
  infosys:         'Programming basics & structured thinking',
  wipro:           'Technical skills & adaptability',
  hcl:             'Core tech, networking & cloud basics',
  techmahindra:    'Telecom domain, cloud & core CS',
  flipkart:        'E-commerce systems & product thinking',
  zoho:            'Full-stack ownership & SaaS knowledge',
  paytm:           'Fintech, payments & system design',
  startup_general: 'Versatility, ownership & fast delivery',
  general:         'Well-rounded interview preparation',
}[company] || 'Interview preparation');

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const RoleSelector = ({ role, company, onRoleChange, onCompanyChange }) => {

  const selectedCompanyInfo = allCompanies.find((c) => c.value === company);

  return (
    <div>

      {/* ── STEP 1: Role Selection ──────────────────────── */}
      <div className="section-card">
        <div className="section-header">
          <p className="section-title">Step 01</p>
          <h2 className="section-heading">Choose Your Role</h2>
        </div>

        <div className="role-grid">
          {roles.map((r) => (
            <button
              key={r.value}
              className={`role-card ${role === r.value ? 'selected' : ''}`}
              onClick={() => onRoleChange(r.value)}
            >
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
              <span className="role-desc">{r.desc}</span>
              <span className="role-check"><CheckIcon /></span>
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 2: Company Selection ───────────────────── */}
      <div className="section-card">
        <div className="section-header">
          <p className="section-title">Step 02</p>
          <h2 className="section-heading">Select a Company</h2>
        </div>

        {companyCategories.map((category) => (
          <div key={category.id} className="company-category-block">
            <div className="category-label">{category.label}</div>
            <div className="company-grid">
              {category.companies.map((c) => (
                <button
                  key={c.value}
                  className={`company-card ${company === c.value ? 'selected' : ''}`}
                  style={{
                    '--company-color':     c.color,
                    '--company-color-rgb': c.colorRgb,
                  }}
                  onClick={() =>
                    onCompanyChange(c.value, getCompanyType(c.value))
                  }
                  aria-label={`Select ${c.label}`}
                  aria-pressed={company === c.value}
                >
                  {/* Logo or icon */}
                  <div className="company-logo-wrapper">
                    {c.domain ? (
                      <CompanyLogo
                        domain={c.domain}
                        name={c.label}
                        color={c.color}
                      />
                    ) : (
                      <div
                        className="company-logo-icon"
                        style={{ color: c.color }}
                      >
                        {c.icon}
                      </div>
                    )}
                  </div>

                  <span className="company-name">{c.label}</span>

                  <span className="company-card-check">
                    <CheckIcon />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* ── Selected Banner ──────────────────────────── */}
        {selectedCompanyInfo && (
          <div className="selected-company-banner">
            {selectedCompanyInfo.domain ? (
              <img
                src={`https://www.google.com/s2/favicons?domain=${selectedCompanyInfo.domain}&sz=32`}
                alt={selectedCompanyInfo.label}
                style={{ width: 18, height: 18, borderRadius: 3 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span>{selectedCompanyInfo.icon}</span>
            )}
            <span>
              Practicing for{' '}
              <strong>{selectedCompanyInfo.label}</strong>
              {' — '}
              {getCompanyTagline(company)}
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoleSelector;