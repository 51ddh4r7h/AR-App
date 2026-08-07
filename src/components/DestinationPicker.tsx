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
    <section className="destination-card">
      <h2 className="destination-title">Where to?</h2>
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
      <div className="destination-fields">
        <label htmlFor="destination-select">Choose destination</label>
        <select
          id="destination-select"
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={onStart}>
          Start Navigation
        </button>
      </div>
    </section>
  )
}
