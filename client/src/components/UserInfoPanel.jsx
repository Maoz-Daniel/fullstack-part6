const USER_FIELDS = [
  ['ID', 'id'],
  ['Name', 'name'],
  ['Username', 'username'],
  ['Email', 'email'],
  ['Phone', 'phone'],
  ['Website', 'website'],
];

function formatValue(value) {
  return value || 'Not provided';
}

export function UserInfoPanel({ user }) {
  return (
    <aside className="info-panel" id="user-info" aria-label="User information">
      <div>
        <p className="eyebrow">Info</p>
        <h2>Personal details</h2>
      </div>

      <dl className="info-list">
        {USER_FIELDS.map(([label, key]) => (
          <div className="info-list__row" key={key}>
            <dt>{label}</dt>
            <dd>{formatValue(user[key])}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
