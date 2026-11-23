import { applyUpdate } from '../../lib/appUpdate';

// Shown when a new version of the app has downloaded and is waiting to take over
function UpdateBanner() {
  return (
    <div className="update-banner">
      <span>A new version of Telescope is ready.</span>
      <button type="button" onClick={applyUpdate} className="update-banner-btn">
        Update
      </button>
    </div>
  );
}

export default UpdateBanner;
