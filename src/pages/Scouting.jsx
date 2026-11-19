import Layout from '../components/layout/Layout';
import MenuCard from '../components/ui/MenuCard';
import { PHASE_CONFIG } from '../lib/RecordData';

const OPTIONS = [
  {
    to:          '/scouting/match',
    title:       'Qualification Match',
    description: 'Scout one robot during a match',
    phase:       PHASE_CONFIG.Match,
    draftKey:    'draftMatch',
  },
  {
    to:          '/scouting/pit',
    title:       'Pit Interview',
    description: 'Interview a team about their robot',
    phase:       PHASE_CONFIG.Pit,
    draftKey:    'draftPit',
  },
];

// The form saves a draft as soon as it opens, so only count it as in progress
// once the scouter has moved past the first page or entered something.
function hasDraft(phase, draftKey) {
  let draft;
  try { draft = JSON.parse(localStorage.getItem(draftKey)); } catch { return false; }
  if (!draft) return false;
  if ((draft.page ?? 0) > 0) return true;
  return phase.form.pages.flatMap(p => p.questions).some(q => {
    const v = draft.data?.[q.id];
    if (v === undefined) return false;
    if (q.type === 'counter') return v !== (q.min ?? 0);
    if (q.type === 'switch')  return v !== false;
    return v !== '';
  });
}

function Scouting() {
  return (
    <Layout header="Scouting" tab={1}>
      <div className="flex flex-col gap-3 p-4">
        {OPTIONS.map(o => (
          <MenuCard key={o.to} to={o.to} title={o.title} description={o.description}>
            {hasDraft(o.phase, o.draftKey) && (
              <span className="badge">
                <span className="size-1.5 rounded-full bg-[var(--color-primary)]" />
                Draft saved
              </span>
            )}
          </MenuCard>
        ))}
      </div>
    </Layout>
  );
}

export default Scouting;
