import { useEffect, useState } from 'react';
import { loadAllPhases, recordEvents } from './RecordData';

// This device's records and forms for every phase (see loadAllPhases), reloaded whenever stored
// records change. null until first loaded.
export default function useDeviceData() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let latestLoad = 0;
    let active = true;
    const reload = () => {
      // Only the newest load is applied, in case an older one finishes after it
      const load = ++latestLoad;
      loadAllPhases().then(result => {
        if (active && load === latestLoad) setData(result);
      });
    };
    reload();
    recordEvents.addEventListener('change', reload);
    return () => {
      active = false;
      recordEvents.removeEventListener('change', reload);
    };
  }, []);

  return data;
}
