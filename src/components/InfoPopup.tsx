import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CampusNode } from '../navigation/graph'

interface InfoPopupProps {
  destination: CampusNode
  onClose: () => void
}

export function InfoPopup({ destination, onClose }: InfoPopupProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="border-white/10 bg-slate-950 text-white">
        <DialogHeader>
          <DialogTitle>{destination.name}</DialogTitle>
          <DialogDescription>{destination.description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-400">You are here</span>
            {destination.openHours ? (
              <Badge variant="outline">{destination.openHours}</Badge>
            ) : null}
          </div>
          {destination.highlights?.length ? (
            <ul className="ml-5 list-disc space-y-1 text-sm text-slate-300">
              {destination.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
