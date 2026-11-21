import { useState } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';
import { PHASES, replaceRecords } from '../../lib/RecordData';
import useDeviceData from '../../lib/useDeviceData';

function records(n, kind) {
  return `${n} ${kind} record${n !== 1 ? 's' : ''}`;
}

// Shown while a phase is held on an older form because this device still has records collected
// with it. Clearing those records switches the phase to the latest form.
function OutdatedFormBanner() {
  const device = useDeviceData();
  const [confirming, setConfirming] = useState(false);

  const outdated = device ? PHASES.filter(p => device[p].outdated) : [];
  if (outdated.length === 0) return null;

  const names = outdated.join(' and ');
  const kinds = outdated.map(p => p.toLowerCase()).join(' and ');

  async function clear() {
    setConfirming(false);
    for (const p of outdated) await replaceRecords(p, []);
  }

  return (
    <>
      <div className="update-banner">
        <span>
          {outdated.length > 1 ? `Newer ${names} forms are` : `A newer ${names} form is`} available.
          Export your {kinds} records, then clear them to update.
        </span>
        <button type="button" onClick={() => setConfirming(true)} className="update-banner-btn">
          Clear
        </button>
      </div>
      {confirming && (
        <ConfirmDialog
          title={`Clear ${outdated.map(p => records(device[p].records.length, p.toLowerCase())).join(' and ')}?`}
          message="Export them first if you haven't. This can't be undone."
          confirmLabel="Clear"
          onCancel={() => setConfirming(false)}
          onConfirm={clear}
        />
      )}
    </>
  );
}

export default OutdatedFormBanner;
