import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import Counter from '../ui/Counter';
import NumericInput from '../ui/NumericInput';
import Switch from '../ui/Switch';
import { PHASE_CONFIG, mergeAndStoreRecordData } from '../../lib/RecordData';

function defaultValue(question) {
  switch (question.type) {
    case 'counter': return question.min ?? 0;
    case 'switch':  return false;
    default:        return '';
  }
}

function isAnswered(question, value) {
  if (!question.required) return true;
  if (question.type === 'counter' || question.type === 'switch') return true;
  return value !== '' && value !== undefined && value !== null;
}

function Question({ question, value, onChange }) {
  switch (question.type) {
    case 'number':
      return <NumericInput label={question.label} value={value} onChange={onChange} max={question.max} />;
    case 'counter':
      return <Counter label={question.label} value={value} onChange={onChange} min={question.min} max={question.max} />;
    case 'switch':
      return <Switch label={question.label} value={value} onChange={onChange} />;
    case 'dropdown':
      return (
        <div className="flex flex-col gap-1">
          <label className="field-label">{question.label}</label>
          <select value={value} onChange={e => onChange(e.target.value)} className="field-input">
            <option value="">{question.placeholder ?? 'Select...'}</option>
            {question.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    case 'notes':
      return (
        <div className="flex flex-col gap-1">
          <label className="field-label">{question.label}</label>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            placeholder={question.placeholder}
            className="field-input resize-none"
          />
        </div>
      );
    default:
      return null;
  }
}

function ScoutingForm({ header, phase, draftKey }) {
  const navigate  = useNavigate();
  const pages     = phase.form.pages;
  const questions = pages.flatMap(p => p.questions);
  // Return to the Scouting menu on this form's tab (Match or Pit). Keeps the draft.
  const phaseKey  = Object.keys(PHASE_CONFIG).find(k => PHASE_CONFIG[k] === phase);
  const exit      = () => navigate(`/scouting?phase=${phaseKey}`);

  function loadDraft() {
    try { return JSON.parse(localStorage.getItem(draftKey)) ?? {}; } catch { return {}; }
  }

  const [page, setPage] = useState(() => Math.min(loadDraft().page ?? 0, pages.length - 1));
  const [data, setData] = useState(() => ({
    ...Object.fromEntries(questions.map(q => [q.id, defaultValue(q)])),
    ...(loadDraft().data ?? {}),
  }));

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ data, page }));
  }, [data, page, draftKey]);

  const set = key => value => setData(prev => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    const record = {
      timestamp:   new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      scouterName: localStorage.getItem('scouterName') ?? '',
    };
    for (const q of questions) {
      const value = data[q.id] ?? defaultValue(q);
      record[q.id] = q.type === 'number' ? Number(value) : value;
    }
    await mergeAndStoreRecordData(phase, [record]);
    localStorage.removeItem(draftKey);
    exit();
  }

  const current = pages[page];
  const isLast  = page === pages.length - 1;
  const isValid = current.questions.every(q => isAnswered(q, data[q.id]));

  return (
    <Layout header={header} tab={1} onBack={exit} hideNav>
      <div className="h-full flex flex-col">

        {/* Progress bar */}
        <div className="flex px-4 pt-3 pb-1 gap-1.5">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= page ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
            />
          ))}
        </div>
        <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-alt)]">
          {current.title}
        </p>

        {/* Scrollable page content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 flex flex-col gap-4 pb-2">
          {current.questions.map(q => (
            <Question key={q.id} question={q} value={data[q.id] ?? defaultValue(q)} onChange={set(q.id)} />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          {page > 0 && (
            <button onClick={() => setPage(p => p - 1)} className="flex-1 btn-outline">
              Back
            </button>
          )}
          <button
            onClick={isLast ? handleSubmit : () => setPage(p => p + 1)}
            disabled={!isValid}
            className="flex-1 btn-primary"
          >
            {isLast ? 'Submit' : 'Next'}
          </button>
        </div>

      </div>
    </Layout>
  );
}

export default ScoutingForm;
