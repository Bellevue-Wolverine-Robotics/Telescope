import { Link } from 'react-router-dom';

// Tappable card with a title and chevron (Scouting menu).
// Pass `to` to navigate, or `onClick` for an action.
function MenuCard({ to, onClick, disabled, title, children }) {
  const content = (
    <>
      <div className="flex-1 flex flex-col gap-1">
        <span className="font-semibold">{title}</span>
        {children}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5 shrink-0 text-[var(--color-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </>
  );

  if (to) return <Link to={to} className="nav-card">{content}</Link>;
  return <button type="button" onClick={onClick} disabled={disabled} className="nav-card text-left">{content}</button>;
}

export default MenuCard;
