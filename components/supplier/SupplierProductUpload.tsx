"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Progress,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import {
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TagIcon,
  CubeIcon
} from "@heroicons/react/24/outline";
// Using native HTML5 drag and drop instead of react-dropzone

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sku: string;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  brand: string;
  specifications: string;
  tags: string[];
  images: File[];
}

interface SupplierProductUploadProps {
  supplierId: string;
  onSuccess?: () => void;
}

export default function SupplierProductUpload({ supplierId, onSuccess }: SupplierProductUploadProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    sku: "",
    price: 0,
    minQuantity: 1,
    maxQuantity: 1000,
    unit: "",
    brand: "",
    specifications: "",
    tags: [],
    images: []
  });

  const categories = [
    { key: "electronics", label: "Electrónicos" },
    { key: "furniture", label: "Muebles" },
    { key: "office", label: "Oficina" },
    { key: "cleaning", label: "Limpieza" },
    { key: "food", label: "Alimentos" },
    { key: "clothing", label: "Ropa y Uniformes" },
    { key: "tools", label: "Herramientas" },
    { key: "other", label: "Otros" }
  ];

  const units = [
    { key: "pcs", label: "Piezas" },
    { key: "kg", label: "Kilogramos" },
    { key: "lts", label: "Litros" },
    { key: "m", label: "Metros" },
    { key: "box", label: "Cajas" },
    { key: "pack", label: "Paquetes" }
  ];

  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles].slice(0, 6) // Max 6 images
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
        if (!formData.description.trim()) newErrors.description = "La descripción es requerida";
        if (!formData.category) newErrors.category = "La categoría es requerida";
        break;
      case 2:
        if (!formData.sku.trim()) newErrors.sku = "El SKU es requerido";
        if (formData.price <= 0) newErrors.price = "El precio debe ser mayor a 0";
        if (!formData.unit) newErrors.unit = "La unidad es requerida";
        break;
      case 3:
        if (formData.images.length === 0) newErrors.images = "Se requiere al menos una imagen";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      
      // Add product data
      formDataToSend.append('productData', JSON.stringify({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        sku: formData.sku,
        price: formData.price,
        minQuantity: formData.minQuantity,
        maxQuantity: formData.maxQuantity,
        unit: formData.unit,
        brand: formData.brand,
        specifications: formData.specifications,
        tags: formData.tags,
        supplierId
      }));

      // Add images
      formData.images.forEach((image, index) => {
        formDataToSend.append(`images`, image);
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/supplier/products', {
        method: 'POST',
        body: formDataToSend,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        setTimeout(() => {
          onSuccess?.();
          onClose();
          resetForm();
        }, 1000);
      } else {
        throw new Error('Error al crear el producto');
      }
    } catch (error) {
      console.error('Error uploading product:', error);
      setErrors({ submit: 'Error al crear el producto. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      subcategory: "",
      sku: "",
      price: 0,
      minQuantity: 1,
      maxQuantity: 1000,
      unit: "",
      brand: "",
      specifications: "",
      tags: [],
      images: []
    });
    setCurrentStep(1);
    setErrors({});
    setUploadProgress(0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
            
            <Input
              label="Nombre del Producto"
              placeholder="Ej: Laptop HP ProBook 450"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              startContent={<CubeIcon className="w-4 h-4 text-gray-400" />}
            />

            <Textarea
              label="Descripción"
              placeholder="Describe las características principales del producto..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              isInvalid={!!errors.description}
              errorMessage={errors.description}
              minRows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Categoría"
                placeholder="Selecciona una categoría"
                selectedKeys={formData.category ? [formData.category] : []}
                onSelectionChange={(keys) => handleInputChange('category', Array.from(keys)[0])}
                isInvalid={!!errors.category}
                errorMessage={errors.category}
              >
                {categories.map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>

              <Input
                label="Marca"
                placeholder="Ej: HP, Samsung, etc."
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Precio y Disponibilidad</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SKU / Código"
                placeholder="Ej: HP-PB450-001"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                isInvalid={!!errors.sku}
                errorMessage={errors.sku}
              />

              <Input
                label="Precio"
                type="number"
                placeholder="0.00"
                value={formData.price.toString()}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                isInvalid={!!errors.price}
                errorMessage={errors.price}
                startContent={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Cantidad Mínima"
                type="number"
                placeholder="1"
                value={formData.minQuantity.toString()}
                onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value) || 1)}
              />

              <Input
                label="Cantidad Máxima"
                type="number"
                placeholder="1000"
                value={formData.maxQuantity.toString()}
                onChange={(e) => handleInputChange('maxQuantity', parseInt(e.target.value) || 1000)}
              />

              <Select
                label="Unidad"
                placeholder="Selecciona"
                selectedKeys={formData.unit ? [formData.unit] : []}
                onSelectionChange={(keys) => handleInputChange('unit', Array.from(keys)[0])}
                isInvalid={!!errors.unit}
                errorMessage={errors.unit}
              >
                {units.map(unit => (
                  <SelectItem key={unit.key} value={unit.key}>
                    {unit.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Textarea
              label="Especificaciones Técnicas"
              placeholder="Detalles técnicos, dimensiones, características especiales..."
              value={formData.specifications}
              onChange={(e) => handleInputChange('specifications', e.target.value)}
              minRows={3}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Imágenes del Producto</h3>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input 
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra imágenes aquí'}
              </p>
              <p className="text-sm text-gray-500">
                O haz clic para seleccionar archivos (máximo 6 imágenes, 5MB cada una)
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Formatos soportados: JPG, PNG, WebP
              </p>
            </div>

            {errors.images && (
              <p className="text-red-500 text-sm">{errors.images}</p>
            )}

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="solid"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage(index)}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Etiquetas y Finalización</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas (palabras clave)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeTag(index)}
                    variant="flat"
                    color="primary"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
              <Input
                placeholder="Escribe una etiqueta y presiona Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            {/* Resumen del producto */}
            <Card className="bg-gray-50">
              <CardBody className="p-4">
                <h4 className="font-semibold mb-3">Resumen del Producto</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Nombre:</span> {formData.name}</p>
                  <p><span className="font-medium">Categoría:</span> {categories.find(c => c.key === formData.category)?.label}</p>
                  <p><span className="font-medium">SKU:</span> {formData.sku}</p>
                  <p><span className="font-medium">Precio:</span> ${formData.price.toLocaleString()}</p>
                  <p><span className="font-medium">Unidad:</span> {units.find(u => u.key === formData.unit)?.label}</p>
                  <p><span className="font-medium">Imágenes:</span> {formData.images.length} archivo(s)</p>
                </div>
              </CardBody>
            </Card>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subiendo producto...</span>
                  <span className="text-sm font-semibold">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} color="primary" />
              </div>
            )}

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <Button
        color="primary"
        size="lg"
        startContent={<PlusIcon className="w-5 h-5" />}
        onPress={onOpen}
        className="font-semibold"
      >
        Agregar Nuevo Producto
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        isDismissable={!loading}
        hideCloseButton={loading}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">Agregar Nuevo Producto</h2>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(currentStep / 4) * 100}
                    className="flex-1"
                    color="primary"
                    size="sm"
                  />
                  <span className="text-sm text-gray-500">
                    Paso {currentStep} de 4
                  </span>
                </div>
              </ModalHeader>
              
              <ModalBody>
                {renderStep()}
              </ModalBody>
              
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={currentStep === 1 ? onClose : prevStep}
                  isDisabled={loading}
                >
                  {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                </Button>
                
                {currentStep < 4 ? (
                  <Button
                    color="primary"
                    onPress={nextStep}
                    isDisabled={loading}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    color="success"
                    onPress={handleSubmit}
                    isLoading={loading}
                    startContent={uploadProgress === 100 ? <CheckCircleIcon className="w-5 h-5" /> : undefined}
                  >
                    {loading ? 'Subiendo...' : uploadProgress === 100 ? 'Completado' : 'Crear Producto'}
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}