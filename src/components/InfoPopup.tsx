import type { CampusNode } from '../navigation/graph'

interface InfoPopupProps {
  destination: CampusNode
  onClose: () => void
}

export function InfoPopup({ destination, onClose }: InfoPopupProps) {
  return (
    <section className="info-popup">
      <h3>{destination.name}</h3>
      <p>{destination.description}</p>
      {destination.openHours ? <p>Open: {destination.openHours}</p> : null}
      {destination.highlights?.length ? (
        <ul>
          {destination.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
  )
}

