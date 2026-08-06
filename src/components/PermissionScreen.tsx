interface PermissionScreenProps {
  camera: PermissionState
  gps: PermissionState
  motion: PermissionState
  weakGps: boolean
  onRequestCamera: () => void
  onRequestGps: () => void
  onRequestMotion: () => void
}

const statusLabel: Record<PermissionState, string> = {
  granted: 'Granted',
  denied: 'Denied',
  prompt: 'Tap to allow',
}

const canProceed = (status: PermissionState): boolean => status === 'granted'

export function PermissionScreen({
  camera,
  gps,
  motion,
  weakGps,
  onRequestCamera,
  onRequestGps,
  onRequestMotion,
}: PermissionScreenProps) {
  return (
    <section className="permission-card">
      <h1>SIDTM AR Campus Navigator</h1>
      <p>Enable all permissions to start immersive navigation.</p>
      <div className="permission-list">
        <button type="button" onClick={onRequestCamera} disabled={canProceed(camera)}>
          Camera: {statusLabel[camera]}
        </button>
        <button type="button" onClick={onRequestGps} disabled={canProceed(gps)}>
          GPS: {statusLabel[gps]}
        </button>
        <button type="button" onClick={onRequestMotion} disabled={canProceed(motion)}>
          Motion: {statusLabel[motion]}
        </button>
      </div>
      {weakGps ? <p className="warning">GPS signal weak. Move to open sky.</p> : null}
      <p className="hint">If denied, open browser settings and enable permissions.</p>
    </section>
  )
}

