"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Modal,
  Button,
  TextInput,
  Card,
  Badge,
  Loader,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  Paper
} from "@mantine/core"
import {
  IconQrcode,
  IconCamera,
  IconSearch,
  IconCircleCheck,
  IconCircleX,
  IconAlertTriangle
} from "@tabler/icons-react"
import toast from "react-hot-toast"

interface Product {
  _id: string
  name: string
  sku: string
  barcode?: string
  currentStock: number
  unit: string
  location: string
  status: 'active' | 'inactive' | 'discontinued'
}

interface ScanResult {
  barcode: string
  product?: Product
  timestamp: Date
  success: boolean
}

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onProductFound: (product: Product) => void
  mode: 'lookup' | 'inventory' | 'receiving'
  title?: string
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onProductFound,
  mode,
  title = "Escáner de Códigos de Barras"
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen])

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setHasCamera(videoDevices.length > 0)
    } catch (error) {
      console.error('Error checking camera availability:', error)
      setHasCamera(false)
    }
  }

  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsScanning(true)
      
      const constraints = {
        video: {
          facingMode: 'environment', // Usar cámara trasera si está disponible
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      // Simular detección de código de barras
      // En una implementación real, usarías una librería como QuaggaJS o ZXing
      simulateBarcodeDetection()
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraError('No se pudo acceder a la cámara. Verifica los permisos.')
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
  }

  const simulateBarcodeDetection = () => {
    // Esta es una simulación. En una implementación real, integrarías
    // una librería de detección de códigos de barras como QuaggaJS
    const interval = setInterval(() => {
      if (!isScanning) {
        clearInterval(interval)
        return
      }
      
      // Simular detección aleatoria para demostración
      if (Math.random() > 0.95) {
        const simulatedBarcode = `${Math.floor(Math.random() * 1000000000000)}`
        handleBarcodeDetected(simulatedBarcode)
        clearInterval(interval)
      }
    }, 100)
  }

  const handleBarcodeDetected = async (barcode: string) => {
    stopCamera()
    await lookupProduct(barcode)
  }

  const lookupProduct = async (barcode: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/inventory/products/barcode/${encodeURIComponent(barcode)}`)
      
      const scanResult: ScanResult = {
        barcode,
        timestamp: new Date(),
        success: false
      }
      
      if (response.ok) {
        const data = await response.json()
        scanResult.product = data.product
        scanResult.success = true
        
        toast.success(`Producto encontrado: ${data.product.name}`)
        onProductFound(data.product)
        
        // Agregar al historial
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]) // Mantener últimos 10
        
      } else {
        scanResult.success = false
        toast.error('Producto no encontrado')
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)])
      }
      
    } catch (error) {
      console.error('Error looking up product:', error)
      toast.error('Error al buscar el producto')
      
      const scanResult: ScanResult = {
        barcode,
        timestamp: new Date(),
        success: false
      }
      setScanHistory(prev => [scanResult, ...prev.slice(0, 9)])
    } finally {
      setLoading(false)
    }
  }

  const handleManualLookup = () => {
    if (!manualBarcode.trim()) {
      toast.error('Ingresa un código de barras')
      return
    }
    
    lookupProduct(manualBarcode.trim())
    setManualBarcode('')
  }

  const getModeDescription = () => {
    switch (mode) {
      case 'lookup':
        return 'Buscar información del producto'
      case 'inventory':
        return 'Realizar conteo de inventario'
      case 'receiving':
        return 'Recibir productos en almacén'
      default:
        return 'Escanear código de barras'
    }
  }

  const getModeColor = () => {
    switch (mode) {
      case 'lookup':
        return 'blue'
      case 'inventory':
        return 'orange'
      case 'receiving':
        return 'green'
      default:
        return 'gray'
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="lg"
      title={null}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        body: { padding: 0 },
        header: { display: 'none' }
      }}
    >
      <Stack gap="lg">
        <Paper p="lg" withBorder={false}>
          <Group>
            <ActionIcon
              size="lg"
              radius="md"
              color="blue"
              variant="light"
            >
              <IconQrcode size={20} />
            </ActionIcon>
            <Stack gap={2}>
              <Title order={4} size="lg" fw={600}>{title}</Title>
              <Group gap="xs">
                <Badge
                  color={getModeColor()}
                  size="sm"
                  variant="light"
                >
                  {mode.toUpperCase()}
                </Badge>
                <Text size="sm" c="dimmed">{getModeDescription()}</Text>
              </Group>
            </Stack>
          </Group>
        </Paper>
        
        <Stack gap="lg" p="lg" pt={0}>
            {/* Cámara */}
            <Card withBorder p="md">
                <Stack align="center" gap="md">
                  {!hasCamera ? (
                    <Stack align="center" gap="md" py="xl">
                      <IconAlertTriangle size={48} color="orange" />
                      <Text ta="center" c="dimmed">No se detectó cámara disponible</Text>
                      <Text size="sm" ta="center" c="dimmed">Usa la entrada manual a continuación</Text>
                    </Stack>
                  ) : cameraError ? (
                    <Stack align="center" gap="md" py="xl">
                      <IconCircleX size={48} color="red" />
                      <Text ta="center" c="red">{cameraError}</Text>
                      <Button
                        color="blue"
                        variant="light"
                        onClick={startCamera}
                      >
                        Intentar de nuevo
                      </Button>
                    </Stack>
                  ) : !isScanning ? (
                    <Stack align="center" gap="md" py="xl">
                      <IconCamera size={48} color="gray" />
                      <Text ta="center" c="dimmed">Presiona para activar la cámara</Text>
                      <Button
                        color="blue"
                        leftSection={<IconCamera size={16} />}
                        onClick={startCamera}
                      >
                        Activar Cámara
                      </Button>
                    </Stack>
                  ) : (
                    <Stack gap="md">
                      <div style={{ position: 'relative', backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden' }}>
                        <video
                          ref={videoRef}
                          style={{ width: '100%', height: '256px', objectFit: 'cover' }}
                          autoPlay
                          playsInline
                          muted
                        />
                        <div style={{ 
                          position: 'absolute', 
                          inset: 0, 
                          border: '2px solid #228be6', 
                          borderRadius: '8px', 
                          pointerEvents: 'none' 
                        }}>
                          <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)' 
                          }}>
                            <div style={{ 
                              width: '192px', 
                              height: '128px', 
                              border: '2px solid #228be6', 
                              borderRadius: '8px', 
                              backgroundColor: 'rgba(34, 139, 230, 0.1)' 
                            }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '16px', height: '16px', borderTop: '2px solid #228be6', borderLeft: '2px solid #228be6' }}></div>
                              <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', borderTop: '2px solid #228be6', borderRight: '2px solid #228be6' }}></div>
                              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '16px', height: '16px', borderBottom: '2px solid #228be6', borderLeft: '2px solid #228be6' }}></div>
                              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', borderBottom: '2px solid #228be6', borderRight: '2px solid #228be6' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Group justify="center">
                        <Loader size="sm" color="blue" />
                        <Text size="sm" c="dimmed">Buscando código de barras...</Text>
                      </Group>
                      <Button
                        color="red"
                        variant="light"
                        onClick={stopCamera}
                      >
                        Detener Cámara
                      </Button>
                    </Stack>
                  )}
                </Stack>
            </Card>

            {/* Entrada manual */}
            <Card withBorder p="md">
              <Stack gap="md">
                <Text size="sm" fw={500}>Entrada Manual</Text>
                <Group>
                  <TextInput
                    placeholder="Ingresa el código de barras manualmente"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                    leftSection={<IconQrcode size={16} />}
                    disabled={loading}
                    variant="filled"
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    color="blue"
                    size="lg"
                    onClick={handleManualLookup}
                    loading={loading}
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>

            {/* Historial de escaneos */}
            {scanHistory.length > 0 && (
              <Card withBorder p="md">
                <Stack gap="md">
                  <Text size="sm" fw={500}>Historial de Escaneos</Text>
                  <Stack gap="xs" style={{ maxHeight: '192px', overflowY: 'auto' }}>
                    {scanHistory.map((scan, index) => (
                      <Paper key={index} p="sm" bg="gray.0" radius="md">
                        <Group justify="space-between">
                          <Group gap="sm">
                            {scan.success ? (
                              <IconCircleCheck size={16} color="green" />
                            ) : (
                              <IconCircleX size={16} color="red" />
                            )}
                            <Stack gap={2}>
                              <Text size="sm" fw={500}>{scan.barcode}</Text>
                              {scan.product ? (
                                <Text size="xs" c="dimmed">{scan.product.name}</Text>
                              ) : (
                                <Text size="xs" c="red">Producto no encontrado</Text>
                              )}
                            </Stack>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {scan.timestamp.toLocaleTimeString()}
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            )}
        </Stack>
        
        <Paper p="lg" withBorder style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => {
                stopCamera()
                onClose()
              }}
            >
              Cerrar
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  )
}