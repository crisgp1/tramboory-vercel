"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Divider,
  Spinner
} from "@heroui/react"
import {
  QrCodeIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"
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
        return 'primary'
      case 'inventory':
        return 'warning'
      case 'receiving':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      scrollBehavior="inside"
      backdrop="opaque"
      classNames={{
        backdrop: "bg-gray-900/20",
        base: "bg-white border border-gray-200 max-h-[90vh] my-4",
        wrapper: "z-[1001] items-center justify-center p-4 overflow-y-auto"
      }}
    >
      <ModalContent>
        <ModalHeader className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Chip
                  color={getModeColor()}
                  size="sm"
                  variant="flat"
                >
                  {mode.toUpperCase()}
                </Chip>
                <span className="text-sm text-gray-600">{getModeDescription()}</span>
              </div>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="px-6">
          <div className="space-y-6">
            {/* Cámara */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <div className="text-center">
                  {!hasCamera ? (
                    <div className="py-8">
                      <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-gray-600">No se detectó cámara disponible</p>
                      <p className="text-sm text-gray-500">Usa la entrada manual a continuación</p>
                    </div>
                  ) : cameraError ? (
                    <div className="py-8">
                      <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-red-600 mb-2">{cameraError}</p>
                      <Button
                        color="primary"
                        variant="light"
                        onPress={startCamera}
                      >
                        Intentar de nuevo
                      </Button>
                    </div>
                  ) : !isScanning ? (
                    <div className="py-8">
                      <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">Presiona para activar la cámara</p>
                      <Button
                        color="primary"
                        startContent={<CameraIcon className="w-4 h-4" />}
                        onPress={startCamera}
                      >
                        Activar Cámara
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-64 object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-48 h-32 border-2 border-blue-500 rounded-lg bg-blue-500/10">
                              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Spinner size="sm" color="primary" />
                        <span className="text-sm text-gray-600">Buscando código de barras...</span>
                      </div>
                      <Button
                        color="danger"
                        variant="light"
                        onPress={stopCamera}
                      >
                        Detener Cámara
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Entrada manual */}
            <Card className="border border-gray-200">
              <CardBody className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Entrada Manual</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresa el código de barras manualmente"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                    startContent={<QrCodeIcon className="w-4 h-4 text-gray-400" />}
                    isDisabled={loading}
                    variant="flat"
                    classNames={{
                      input: "text-gray-900",
                      inputWrapper: "bg-gray-50 border-0 hover:bg-gray-100 focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-900"
                    }}
                  />
                  <Button
                    color="primary"
                    isIconOnly
                    onPress={handleManualLookup}
                    isLoading={loading}
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Historial de escaneos */}
            {scanHistory.length > 0 && (
              <Card className="border border-gray-200">
                <CardBody className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Historial de Escaneos</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {scanHistory.map((scan, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {scan.success ? (
                            <div className="relative">
                              <CheckCircleIcon className="w-4 h-4 text-emerald-600 drop-shadow-sm" />
                              <div className="absolute inset-0 w-4 h-4 bg-gradient-to-br from-white/30 to-transparent rounded-full pointer-events-none" />
                            </div>
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{scan.barcode}</p>
                            {scan.product ? (
                              <p className="text-xs text-gray-600">{scan.product.name}</p>
                            ) : (
                              <p className="text-xs text-red-600">Producto no encontrado</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {scan.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter className="px-6 py-4">
          <div className="flex gap-3 justify-end w-full">
            <Button
              variant="light"
              onPress={() => {
                stopCamera()
                onClose()
              }}
            >
              Cerrar
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}