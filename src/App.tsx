import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { DestinationPicker } from './components/DestinationPicker'
import { InfoPopup } from './components/InfoPopup'
import { NavigationHUD } from './components/NavigationHUD'
import { PermissionScreen } from './components/PermissionScreen'
import { startCameraStream, stopCameraStream } from './ar/camera'
import { ARRenderer } from './ar/renderer'
import { buildCampusGraph } from './navigation/graph'
import { GpsService, type GpsReading } from './navigation/gps'
import { HeadingService } from './navigation/heading'
import { buildRoute } from './navigation/route'
import { bearingBetween, haversineDistance } from './utils/geo'
import { normalizeAngle } from './utils/math'

const REACHED_THRESHOLD_METERS = 14

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
  const [routeError, setRouteError] = useState<string | null>(null)
  const [arrivedNodeId, setArrivedNodeId] = useState<string | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const arRendererRef = useRef<ARRenderer | null>(null)
  const gpsServiceRef = useRef<GpsService | null>(null)
  const headingServiceRef = useRef<HeadingService | null>(null)

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

    setDistanceMeters(distanceToDestination)
    setNextWaypointName(nextName)
    setRouteMode(route ? 'graph' : 'direct')

    if (!route) {
      setRouteError('Graph path unavailable. Using direct guidance.')
    } else {
      setRouteError(null)
    }

    if (distanceToDestination <= REACHED_THRESHOLD_METERS) {
      setArrivedNodeId(activeDestinationId)
      setActiveDestinationId(null)
      arRendererRef.current?.clearNavigation()
      return
    }

    const relativeBearing = normalizeAngle(nextBearing - heading)
    arRendererRef.current?.setNavigationDirection(relativeBearing, distanceToDestination)
  }, [activeDestinationId, allPermissionsGranted, graph, heading, position])

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
          />
        ) : null}

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
