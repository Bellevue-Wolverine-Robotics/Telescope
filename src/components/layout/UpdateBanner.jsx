import { applyUpdate } from '../../lib/appUpdate';

// Shown when a new version of the app has downloaded and is waiting to take over
function UpdateBanner() {
  return (
    <div className="update-banner">
      <span>A newer version of the app is available.</span>
      <button type="button" onClick={applyUpdate} className="update-banner-btn">
        Refresh
      </button>
    </div>
  );
}

export default UpdateBanner;
