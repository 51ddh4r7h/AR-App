import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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

const badgeVariant = (status: PermissionState): 'secondary' | 'destructive' | 'outline' => {
  if (status === 'granted') {
    return 'secondary'
  }
  if (status === 'denied') {
    return 'destructive'
  }
  return 'outline'
}

export function PermissionScreen({
  camera,
  gps,
  motion,
  weakGps,
  onRequestCamera,
  onRequestGps,
  onRequestMotion,
}: PermissionScreenProps) {
  const rows: Array<{
    label: string
    status: PermissionState
    onRequest: () => void
  }> = [
    { label: 'Camera', status: camera, onRequest: onRequestCamera },
    { label: 'GPS', status: gps, onRequest: onRequestGps },
    { label: 'Motion', status: motion, onRequest: onRequestMotion },
  ]

  return (
    <Card className="pointer-events-auto w-[min(92vw,420px)] m-auto border-white/10 bg-slate-950/70 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg">SIDTM AR Navigator</CardTitle>
        <CardDescription>
          Enable permissions to start immersive campus navigation.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map(({ label, status, onRequest }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <Badge variant={badgeVariant(status)}>{statusLabel[status]}</Badge>
              <Button size="sm" onClick={onRequest} disabled={canProceed(status)}>
                {canProceed(status) ? 'Done' : 'Allow'}
              </Button>
            </div>
          </div>
        ))}
        {weakGps ? (
          <p className="text-xs text-amber-300">GPS signal weak. Move to open sky.</p>
        ) : null}
        <p className="text-xs text-slate-400">
          If denied, open browser settings and enable permissions.
        </p>
      </CardContent>
    </Card>
  )
}
