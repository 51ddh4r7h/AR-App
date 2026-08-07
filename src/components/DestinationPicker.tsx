import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CampusNode } from '../navigation/graph'
import { Minimap } from './Minimap'

interface DestinationPickerProps {
  destinations: CampusNode[]
  nodes: CampusNode[]
  edges: Array<{ from: CampusNode; to: CampusNode }>
  selectedId: string
  onSelect: (destinationId: string) => void
  onStart: () => void
}

export function DestinationPicker({
  destinations,
  nodes,
  edges,
  selectedId,
  onSelect,
  onStart,
}: DestinationPickerProps) {
  const selected = destinations.find((destination) => destination.id === selectedId) ?? null

  return (
    <Card className="w-[min(92vw,420px)] m-auto border-white/10 bg-slate-950/70 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg">Where to?</CardTitle>
        <CardDescription>
          Tap a point on the campus map or choose from the list.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
          <Minimap
            nodes={nodes}
            edges={edges}
            userPosition={null}
            heading={0}
            routePath={null}
            destination={selected}
            arrivalRadiusMeters={0}
            onSelect={onSelect}
            size={300}
            ariaLabel="Campus overview. Tap a location to choose it as your destination."
          />
        </div>
        <div className="flex flex-col gap-2">
          <Select value={selectedId} onValueChange={onSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose destination" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((destination) => (
                <SelectItem key={destination.id} value={destination.id}>
                  {destination.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="lg" onClick={onStart} className="h-11 w-full text-base">
            Start Navigation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
