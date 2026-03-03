import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, LatLng } from 'react-native-maps'
import * as Location from 'expo-location'
import { useLocalSearchParams } from 'expo-router'
import { getSocket } from '../utils/socket'

interface IncomingRide {
  rideId: string
  origin: { lat: number; lng: number; address: string }
  destination: { lat: number; lng: number; address: string }
  geometry?: [number, number][]
  distance?: number
  duration?: number
  fare?: number
}

interface ActiveRide {
  rideId: string
  origin: { lat: number; lng: number; address: string }
  destination: { lat: number; lng: number; address: string }
}

type RidePhase = 'driver_assigned' | 'in_progress' | 'payment_pending' | 'paid' | 'completed' | 'cancelled' | null

export default function HomeScreen() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>()
  const mapRef = useRef<MapView>(null)

  const [connected, setConnected] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [incomingRide, setIncomingRide] = useState<IncomingRide | null>(null)
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)
  const [ridePhase, setRidePhase] = useState<RidePhase>(null)
  const [routeCoords, setRouteCoords] = useState<LatLng[] | null>(null)
  const [locationReady, setLocationReady] = useState(false)

  // OTP
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  // Segunda corrida
  const [canAcceptSecondRide, setCanAcceptSecondRide] = useState(false)
  const [hasQueuedRide, setHasQueuedRide] = useState(false)

  const isOnlineRef = useRef(isOnline)
  isOnlineRef.current = isOnline

  const driverIdRef = useRef(driverId)
  driverIdRef.current = driverId

  // GPS watch
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        ({ coords }) => {
          const loc = { lat: coords.latitude, lng: coords.longitude }
          setDriverLocation(loc)
          setLocationReady(true)

          if (isOnlineRef.current) {
            const socket = getSocket()
            socket.emit('DRIVER_LOCATION_UPDATE', {
              driverId: driverIdRef.current,
              lat: coords.latitude,
              lng: coords.longitude,
            })
          }
        }
      )
    })()

    return () => {
      subscription?.remove()
    }
  }, [])

  // Socket events
  useEffect(() => {
    const socket = getSocket()

    socket.connect()
    if (socket.connected) setConnected(true)

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Nova corrida disponível
    socket.on('RIDE_REQUEST', (ride: IncomingRide) => {
      setIncomingRide(ride)
    })

    // Atualizações de status da corrida
    socket.on('RIDE_STATUS_UPDATE', ({ status, rideId }: { rideId: string; status: RidePhase }) => {
      setRidePhase(status)
      if (status === 'completed' || status === 'cancelled') {
        // Limpa o estado da corrida atual — segunda corrida (se houver) será ativada via RIDE_ROUTE_UPDATE
        if (!hasQueuedRide) {
          setActiveRide(null)
          setRouteCoords(null)
          setCanAcceptSecondRide(false)
          setHasQueuedRide(false)
        }
      }
    })

    // Backend confirma OTP inválido
    socket.on('OTP_INVALID', () => {
      setOtpError(true)
      setOtpLoading(false)
    })

    // Backend confirma OTP correto — corrida iniciada
    socket.on('OTP_VERIFIED', () => {
      setOtpInput('')
      setOtpError(false)
      setOtpLoading(false)
      setRidePhase('in_progress')
    })

    // Nova rota de navegação (driver→embarque ou embarque→destino, ou segunda corrida)
    socket.on('RIDE_ROUTE_UPDATE', ({
      rideId,
      phase,
      destination,
      destinationRide,
      geometry,
    }: {
      rideId: string
      phase: 'to_pickup' | 'to_destination'
      origin: { lat: number; lng: number; address: string }
      destination: { lat: number; lng: number; address: string }
      destinationRide?: { lat: number; lng: number; address: string }
      geometry: [number, number][] | null
    }) => {
      // Quando phase === 'to_pickup' de uma nova corrida (segunda corrida iniciando),
      // o rideId difere da corrida atual — atualiza activeRide
      setActiveRide(prev => {
        if (!prev || prev.rideId !== rideId) {
          // Nova corrida se tornando ativa (segunda corrida iniciou)
          setCanAcceptSecondRide(false)
          setHasQueuedRide(false)
          setRidePhase('driver_assigned')
          setOtpInput('')
          setOtpError(false)
          return {
            rideId,
            origin: destination,                          // embarque da nova corrida
            destination: destinationRide ?? destination,  // destino da nova corrida
          }
        }
        return prev
      })

      if (geometry && geometry.length > 0) {
        const coords: LatLng[] = geometry.map(([lng, lat]) => ({ latitude: lat, longitude: lng }))
        setRouteCoords(coords)
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
          animated: true,
        })
      }
    })

    // Backend sinaliza que motorista pode aceitar segunda corrida (< 3km do destino)
    socket.on('SECOND_RIDE_AVAILABLE', () => {
      setCanAcceptSecondRide(true)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('RIDE_REQUEST')
      socket.off('RIDE_STATUS_UPDATE')
      socket.off('OTP_INVALID')
      socket.off('OTP_VERIFIED')
      socket.off('RIDE_ROUTE_UPDATE')
      socket.off('SECOND_RIDE_AVAILABLE')
    }
  }, [hasQueuedRide])

  // Ajusta mapa ao receber nova corrida
  useEffect(() => {
    if (!incomingRide || !driverLocation) return
    const coords: LatLng[] = [
      { latitude: driverLocation.lat, longitude: driverLocation.lng },
      { latitude: incomingRide.origin.lat, longitude: incomingRide.origin.lng },
      { latitude: incomingRide.destination.lat, longitude: incomingRide.destination.lng },
    ]
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
      animated: true,
    })
  }, [incomingRide])

  function toggleOnline() {
    const socket = getSocket()
    if (!isOnline) {
      if (!driverLocation) return
      socket.emit('DRIVER_ONLINE', {
        driverId,
        lat: driverLocation.lat,
        lng: driverLocation.lng,
      })
      setIsOnline(true)
    } else {
      socket.emit('DRIVER_OFFLINE', { driverId })
      setIsOnline(false)
    }
  }

  function handleAccept() {
    if (!incomingRide) return
    const socket = getSocket()
    socket.emit('RIDE_REQUEST_RESPONSE', {
      rideId: incomingRide.rideId,
      driverId,
      accepted: true,
    })

    const isSecondRide = canAcceptSecondRide && !!activeRide

    if (isSecondRide) {
      // Segunda corrida: apenas enfileira, mantém corrida atual
      setHasQueuedRide(true)
    } else {
      // Primeira corrida: ativa imediatamente
      setActiveRide({
        rideId: incomingRide.rideId,
        origin: incomingRide.origin,
        destination: incomingRide.destination,
      })
      setRidePhase('driver_assigned')
    }

    setIncomingRide(null)
  }

  function handleReject() {
    if (!incomingRide) return
    const socket = getSocket()
    socket.emit('RIDE_REQUEST_RESPONSE', {
      rideId: incomingRide.rideId,
      driverId,
      accepted: false,
    })
    setIncomingRide(null)
  }

  function handleConfirmOtp() {
    if (!activeRide || !otpInput.trim()) return
    const socket = getSocket()
    setOtpError(false)
    setOtpLoading(true)
    socket.emit('OTP_VALIDATE', {
      rideId: activeRide.rideId,
      driverId,
      otp: otpInput.trim(),
    })
  }

  function handlePayment() {
    if (!activeRide) return
    const socket = getSocket()
    socket.emit('RIDE_PAYMENT_REQUEST', {
      rideId: activeRide.rideId,
      driverId,
    })
    setRidePhase('payment_pending')
  }

  // Polyline: rota real do ORS ou linha reta como fallback
  const polylineCoords = useMemo<LatLng[]>(() => {
    if (!activeRide) return []
    return routeCoords ?? [
      { latitude: activeRide.origin.lat, longitude: activeRide.origin.lng },
      { latitude: activeRide.destination.lat, longitude: activeRide.destination.lng },
    ]
  }, [activeRide, routeCoords])

  const initialRegion = driverLocation
    ? {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: -23.55,
        longitude: -46.63,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={mapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Você"
            pinColor="#22c55e"
          />
        )}

        {activeRide && (
          <>
            <Marker
              coordinate={{ latitude: activeRide.origin.lat, longitude: activeRide.origin.lng }}
              title="Embarque"
              pinColor="#3b82f6"
            />
            <Marker
              coordinate={{ latitude: activeRide.destination.lat, longitude: activeRide.destination.lng }}
              title="Destino"
              pinColor="#ef4444"
            />
          </>
        )}

        {polylineCoords.length > 0 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={ridePhase === 'in_progress' ? '#f59e0b' : '#22c55e'}
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Loading overlay */}
      {!locationReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Obtendo localização...</Text>
        </View>
      )}

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>{connected ? 'Conectado' : 'Desconectado'}</Text>
          <View style={styles.spacer} />
          {canAcceptSecondRide && !hasQueuedRide && (
            <View style={styles.secondRideBadge}>
              <Text style={styles.secondRideBadgeText}>2ª corrida disponível</Text>
            </View>
          )}
          {hasQueuedRide && (
            <View style={[styles.secondRideBadge, styles.secondRideQueuedBadge]}>
              <Text style={styles.secondRideBadgeText}>2ª corrida enfileirada ✓</Text>
            </View>
          )}
          <View style={[styles.onlineBadge, { backgroundColor: isOnline ? '#14532d' : '#1a1a1a' }]}>
            <Text style={[styles.onlineBadgeText, { color: isOnline ? '#22c55e' : '#666' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {activeRide && (
          <View style={styles.activeRideCard}>
            <Text style={styles.activeRideTitle}>Corrida ativa</Text>
            <Text style={styles.activeRideText} numberOfLines={1}>
              Para: {activeRide.destination.address}
            </Text>
          </View>
        )}

        {/* Fase 1: aguardando passageiro — entrada de OTP */}
        {activeRide && ridePhase === 'driver_assigned' && (
          <View style={styles.otpContainer}>
            <Text style={styles.otpLabel}>Código de embarque</Text>
            <Text style={styles.otpHint}>Solicite o código ao passageiro</Text>
            <TextInput
              style={[styles.otpInput, otpError && styles.otpInputError]}
              placeholder="000000"
              placeholderTextColor="#555"
              value={otpInput}
              onChangeText={text => {
                setOtpInput(text.replace(/\D/g, '').slice(0, 6))
                setOtpError(false)
              }}
              keyboardType="number-pad"
              maxLength={6}
              editable={!otpLoading}
            />
            {otpError && (
              <Text style={styles.otpErrorText}>Código incorreto. Tente novamente.</Text>
            )}
            <TouchableOpacity
              style={[styles.confirmOtpButton, (otpInput.length < 6 || otpLoading) && styles.confirmOtpButtonDisabled]}
              onPress={handleConfirmOtp}
              disabled={otpInput.length < 6 || otpLoading}
            >
              {otpLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Confirmar Embarque</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Fase 2: em andamento */}
        {activeRide && ridePhase === 'in_progress' && (
          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <Text style={styles.actionButtonText}>Finalizar Corrida</Text>
          </TouchableOpacity>
        )}

        {/* Fase 3: processando pagamento */}
        {activeRide && (ridePhase === 'payment_pending' || ridePhase === 'paid') && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.processingText}>
              {ridePhase === 'payment_pending' ? 'Processando pagamento...' : 'Pagamento confirmado!'}
            </Text>
          </View>
        )}

        {/* Botão online/offline (apenas quando sem corrida ativa) */}
        {!activeRide && (
          <TouchableOpacity
            style={[styles.onlineButton, isOnline ? styles.offlineButton : styles.goOnlineButton]}
            onPress={toggleOnline}
            disabled={!locationReady}
          >
            <Text style={styles.onlineButtonText}>
              {isOnline ? 'Ficar Offline' : 'Ficar Online'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de nova corrida */}
      <Modal visible={incomingRide !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {canAcceptSecondRide && activeRide ? 'Segunda corrida!' : 'Nova corrida!'}
            </Text>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Origem</Text>
              <Text style={styles.modalValue}>{incomingRide?.origin.address}</Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Destino</Text>
              <Text style={styles.modalValue}>{incomingRide?.destination.address}</Text>
            </View>

            {(incomingRide?.distance || incomingRide?.duration || incomingRide?.fare) && (
              <View style={styles.routeChips}>
                {incomingRide?.distance != null && (
                  <View style={styles.routeChip}>
                    <Text style={styles.routeChipLabel}>Distância</Text>
                    <Text style={styles.routeChipValue}>{incomingRide.distance.toFixed(1)} km</Text>
                  </View>
                )}
                {incomingRide?.duration != null && (
                  <View style={styles.routeChip}>
                    <Text style={styles.routeChipLabel}>Tempo</Text>
                    <Text style={styles.routeChipValue}>{incomingRide.duration} min</Text>
                  </View>
                )}
                {incomingRide?.fare != null && (
                  <View style={[styles.routeChip, styles.fareChip]}>
                    <Text style={styles.routeChipLabel}>Tarifa</Text>
                    <Text style={styles.fareChipValue}>
                      R$ {incomingRide.fare.toFixed(2).replace('.', ',')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                <Text style={styles.rejectButtonText}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <Text style={styles.acceptButtonText}>
                  {canAcceptSecondRide && activeRide ? 'Enfileirar' : 'Aceitar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 15,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#aaa',
    fontSize: 13,
  },
  spacer: { flex: 1 },
  secondRideBadge: {
    backgroundColor: '#1a2e1a',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  secondRideQueuedBadge: {
    borderColor: '#f59e0b',
    backgroundColor: '#1a1a00',
  },
  secondRideBadgeText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  onlineBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  onlineBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeRideCard: {
    backgroundColor: '#0d2a1a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#166534',
  },
  activeRideTitle: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeRideText: {
    color: '#aaa',
    fontSize: 13,
  },
  // OTP
  otpContainer: {
    gap: 8,
  },
  otpLabel: {
    color: '#e5e5e5',
    fontSize: 15,
    fontWeight: '700',
  },
  otpHint: {
    color: '#666',
    fontSize: 12,
  },
  otpInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  otpInputError: {
    borderColor: '#ef4444',
  },
  otpErrorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
  },
  confirmOtpButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmOtpButtonDisabled: {
    backgroundColor: '#0d1f3c',
  },
  paymentButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a0d2e',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4c1d95',
  },
  processingText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '500',
  },
  onlineButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  goOnlineButton: {
    backgroundColor: '#22c55e',
  },
  offlineButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  onlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalInfoRow: {
    gap: 4,
  },
  modalLabel: {
    color: '#666',
    fontSize: 12,
  },
  modalValue: {
    color: '#e5e5e5',
    fontSize: 15,
    fontWeight: '500',
  },
  routeChips: {
    flexDirection: 'row',
    gap: 8,
  },
  routeChip: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  fareChip: {
    backgroundColor: '#0d2a1a',
    borderWidth: 1,
    borderColor: '#166534',
  },
  routeChipLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  routeChipValue: {
    color: '#e5e5e5',
    fontSize: 13,
    fontWeight: '700',
  },
  fareChipValue: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#2a0a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
})

// Dark map style
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0d1221' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b92a5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1221' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#111929' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#1b253b' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#0e1620' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091e1d' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1adad0' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#091e1d' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#0d1f18' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3a5a4a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#131c2e' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: '#141e32' }] },
  { featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{ color: '#1b253b' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#546070' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#1b253b' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#222d44' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#7b92a5' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#222d44' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a3850' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b8c8d8' }] },
  { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#0d1221' }] },
  { featureType: 'road.highway', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#131c2e' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#4a6070' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#1b253b' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1b253b' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#222d44' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9db8c8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c8dae8' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#7b92a5' }] },
]
