import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { DestinationPicker } from './components/DestinationPicker'
import { InfoPopup } from './components/InfoPopup'
import { NavigationHUD } from './components/NavigationHUD'
import { PermissionScreen } from './components/PermissionScreen'
import { startCameraStream, stopCameraStream } from './ar/camera'
import { ARRenderer } from './ar/renderer'
import { buildCampusGraph, type CampusNode } from './navigation/graph'
import { GpsService, type GpsReading } from './navigation/gps'
import { HeadingService } from './navigation/heading'
import { buildRoute } from './navigation/route'
import { bearingBetween, haversineDistance } from './utils/geo'
import { normalizeAngle } from './utils/math'

const ARRIVAL_RADIUS_METERS = 25
const STRAIGHT_AHEAD_THRESHOLD = 12

const getTurnInstruction = (relativeBearing: number): string => {
  const magnitude = Math.abs(relativeBearing)
  if (magnitude <= STRAIGHT_AHEAD_THRESHOLD) {
    return 'Go straight'
  }
  if (magnitude <= 45) {
    return relativeBearing < 0 ? 'Slight left' : 'Slight right'
  }
  if (magnitude <= 120) {
    return relativeBearing < 0 ? 'Turn left' : 'Turn right'
  }
  return 'Turn around'
}

const getProximityLabel = (
  distanceMeters: number,
  deltaFromPrevious: number | null,
): string => {
  if (distanceMeters <= 20) {
    return 'Very close'
  }
  if (distanceMeters <= 50) {
    return 'Close'
  }
  if (deltaFromPrevious === null) {
    return 'Hold heading'
  }
  if (deltaFromPrevious >= 1.5) {
    return 'Getting closer'
  }
  if (deltaFromPrevious <= -1.5) {
    return 'Moving away'
  }
  return 'Hold heading'
}

function App() {
  const graph = useMemo(() => buildCampusGraph(), [])
  const destinations = useMemo(() => Array.from(graph.nodes.values()), [graph.nodes])
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt')
  const [gpsPermission, setGpsPermission] = useState<PermissionState>('prompt')
  const [motionPermission, setMotionPermission] = useState<PermissionState>('prompt')
  const [selectedDestinationId, setSelectedDestinationId] = useState(
    destinations[0]?.id ?? '',
  )
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null)
  const [position, setPosition] = useState<GpsReading | null>(null)
  const [heading, setHeading] = useState(0)
  const [nextWaypointName, setNextWaypointName] = useState('Waiting for route...')
  const [distanceMeters, setDistanceMeters] = useState(0)
  const [routeMode, setRouteMode] = useState<'graph' | 'direct'>('graph')
  const [routePath, setRoutePath] = useState<CampusNode[] | null>(null)
  const [relativeBearing, setRelativeBearing] = useState(0)
  const [turnInstruction, setTurnInstruction] = useState('Go straight')
  const [proximityLabel, setProximityLabel] = useState('Hold heading')
  const [announcement, setAnnouncement] = useState('')
  const [routeError, setRouteError] = useState<string | null>(null)
  const [arrivedNodeId, setArrivedNodeId] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const arRendererRef = useRef<ARRenderer | null>(null)
  const gpsServiceRef = useRef<GpsService | null>(null)
  const headingServiceRef = useRef<HeadingService | null>(null)
  const previousDistanceRef = useRef<number | null>(null)
  const lastAnnouncementKeyRef = useRef<string>('')

  const weakGps = (position?.accuracy ?? Number.POSITIVE_INFINITY) > 20
  const allPermissionsGranted =
    cameraPermission === 'granted' &&
    gpsPermission === 'granted' &&
    motionPermission === 'granted'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const renderer = new ARRenderer(canvas)
    arRendererRef.current = renderer
    const resizeHandler = () => renderer.onResize()
    window.addEventListener('resize', resizeHandler)
    return () => {
      window.removeEventListener('resize', resizeHandler)
      renderer.dispose()
      arRendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!videoRef.current || !cameraStream) {
      return
    }
    videoRef.current.srcObject = cameraStream
    videoRef.current.play().catch(() => {
      setRouteError('Camera autoplay blocked. Tap the screen once and retry.')
    })
  }, [cameraStream])

  useEffect(() => () => stopCameraStream(cameraStream), [cameraStream])

  useEffect(() => {
    if (!allPermissionsGranted || !activeDestinationId || !position) {
      return
    }
    const destination = graph.nodes.get(activeDestinationId)
    if (!destination) {
      setRouteError('Selected destination is unavailable. Please reselect.')
      return
    }

    const route = buildRoute(graph, position, activeDestinationId)
    const distanceToDestination = haversineDistance(position, destination)
    const nextBearing = route?.nextBearing ?? bearingBetween(position, destination)
    const nextName = route?.nextNode?.name ?? destination.name

    const deltaFromPrevious =
      previousDistanceRef.current === null
        ? null
        : previousDistanceRef.current - distanceToDestination
    previousDistanceRef.current = distanceToDestination

    setDistanceMeters(distanceToDestination)
    setNextWaypointName(nextName)
    setRouteMode(route ? 'graph' : 'direct')
    setRoutePath(route?.path ?? null)

    if (!route) {
      setRouteError('Graph path unavailable. Using direct guidance.')
    } else {
      setRouteError(null)
    }

    if (distanceToDestination <= ARRIVAL_RADIUS_METERS) {
      setArrivedNodeId(activeDestinationId)
      setActiveDestinationId(null)
      setRoutePath(null)
      setAnnouncement(`You have arrived at ${destination.name}.`)
      arRendererRef.current?.clearNavigation()
      return
    }

    const nextRelativeBearing = normalizeAngle(nextBearing - heading)
    setRelativeBearing(nextRelativeBearing)
    setTurnInstruction(getTurnInstruction(nextRelativeBearing))
    setProximityLabel(getProximityLabel(distanceToDestination, deltaFromPrevious))
    arRendererRef.current?.setNavigationDirection(nextRelativeBearing, distanceToDestination)
  }, [activeDestinationId, allPermissionsGranted, graph, heading, position])

  useEffect(() => {
    if (!activeDestinationId) {
      return
    }
    const rounded = Math.round(distanceMeters / 10) * 10
    const key = `${turnInstruction}|${rounded}|${proximityLabel}`
    if (key !== lastAnnouncementKeyRef.current) {
      lastAnnouncementKeyRef.current = key
      setAnnouncement(
        `${turnInstruction}. About ${Math.max(0, rounded)} meters remaining. ${proximityLabel}.`,
      )
    }
  }, [activeDestinationId, distanceMeters, turnInstruction, proximityLabel])

  const requestCameraPermission = async (): Promise<void> => {
    try {
      const stream = await startCameraStream()
      setCameraStream(stream)
      setCameraPermission('granted')
      setRouteError(null)
    } catch (error) {
      setCameraPermission('denied')
      setRouteError(`Camera unavailable: ${(error as Error).message}`)
    }
  }

  const requestGpsPermission = (): void => {
    if (!navigator.geolocation) {
      setGpsPermission('denied')
      setRouteError('Geolocation is not supported on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (initialPos) => {
        setGpsPermission('granted')
        setPosition({
          latitude: initialPos.coords.latitude,
          longitude: initialPos.coords.longitude,
          accuracy: initialPos.coords.accuracy,
          timestamp: initialPos.timestamp,
        })
        const service = new GpsService(
          (reading) => {
            setPosition(reading)
          },
          (error) => {
            setGpsPermission('denied')
            setRouteError(`GPS error: ${error.message}`)
          },
        )
        gpsServiceRef.current?.stop()
        gpsServiceRef.current = service
        service.start()
      },
      (error) => {
        setGpsPermission('denied')
        setRouteError(`GPS permission denied: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const requestMotionPermission = async (): Promise<void> => {
    const permissionFn = (
      DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>
      }
    ).requestPermission

    if (permissionFn) {
      const result = await permissionFn()
      if (result !== 'granted') {
        setMotionPermission('denied')
        setRouteError('Motion permission denied.')
        return
      }
    }

    setMotionPermission('granted')
    const service = new HeadingService((nextHeading) => setHeading(nextHeading))
    headingServiceRef.current?.stop()
    headingServiceRef.current = service
    service.start()
  }

  useEffect(
    () => () => {
      gpsServiceRef.current?.stop()
      headingServiceRef.current?.stop()
    },
    [],
  )

  const activeDestination =
    (activeDestinationId && graph.nodes.get(activeDestinationId)) ||
    (selectedDestinationId && graph.nodes.get(selectedDestinationId)) ||
    null
  const arrivedDestination =
    (arrivedNodeId && graph.nodes.get(arrivedNodeId)) || null

  return (
    <main className="app-shell">
      <video ref={videoRef} className="camera-feed" playsInline muted />
      <canvas ref={canvasRef} className="ar-canvas" />
      <div className="overlay">
        {!allPermissionsGranted ? (
          <PermissionScreen
            camera={cameraPermission}
            gps={gpsPermission}
            motion={motionPermission}
            weakGps={weakGps}
            onRequestCamera={requestCameraPermission}
            onRequestGps={requestGpsPermission}
            onRequestMotion={requestMotionPermission}
          />
        ) : null}

        {allPermissionsGranted && !activeDestinationId ? (
          <DestinationPicker
            destinations={destinations}
            nodes={destinations}
            edges={graph.edges}
            selectedId={selectedDestinationId}
            onSelect={setSelectedDestinationId}
            onStart={() => {
              if (!selectedDestinationId) {
                setRouteError('Select a destination first.')
                return
              }
              setActiveDestinationId(selectedDestinationId)
              setArrivedNodeId(null)
              setNextWaypointName('Computing route...')
              setDistanceMeters(0)
              setRoutePath(null)
              setRelativeBearing(0)
              setTurnInstruction('Go straight')
              setProximityLabel('Hold heading')
              previousDistanceRef.current = null
              setRouteMode('graph')
              setRouteError(null)
            }}
          />
        ) : null}

        {allPermissionsGranted && activeDestinationId && activeDestination ? (
          <NavigationHUD
            destinationName={activeDestination.name}
            nextWaypointName={nextWaypointName}
            distanceMeters={distanceMeters}
            heading={heading}
            gpsAccuracy={position?.accuracy ?? 0}
            weakGps={weakGps}
            routeMode={routeMode}
            relativeBearing={relativeBearing}
            turnInstruction={turnInstruction}
            proximityLabel={proximityLabel}
            nodes={destinations}
            edges={graph.edges}
            userPosition={position}
            routePath={routePath}
            destination={activeDestination}
            arrivalRadiusMeters={ARRIVAL_RADIUS_METERS}
          />
        ) : null}

        <div className="sr-only" role="status" aria-live="polite">
          {announcement}
        </div>

        {routeError ? <div className="error-banner">{routeError}</div> : null}
      </div>

      {arrivedDestination ? (
        <InfoPopup
          destination={arrivedDestination}
          onClose={() => {
            setArrivedNodeId(null)
            setDistanceMeters(0)
          }}
        />
      ) : null}
    </main>
  )
}

export default App
