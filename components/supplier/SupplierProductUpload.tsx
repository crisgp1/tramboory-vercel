"use client";

import { useState, useCallback } from "react";
import {
  Paper,
  Button,
  TextInput,
  Textarea,
  Select,
  Badge,
  Progress,
  Image,
  Modal,
  Group,
  Stack,
  Text,
  Title,
  Grid,
  ActionIcon,
  Center,
  FileInput,
  NumberInput,
  Container,
  Alert
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
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
  const [opened, { open, close }] = useDisclosure(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");
  
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
    { value: "electronics", label: "Electrónicos" },
    { value: "furniture", label: "Muebles" },
    { value: "office", label: "Oficina" },
    { value: "cleaning", label: "Limpieza" },
    { value: "food", label: "Alimentos" },
    { value: "clothing", label: "Ropa y Uniformes" },
    { value: "tools", label: "Herramientas" },
    { value: "other", label: "Otros" }
  ];

  const units = [
    { value: "pcs", label: "Piezas" },
    { value: "kg", label: "Kilogramos" },
    { value: "lts", label: "Litros" },
    { value: "m", label: "Metros" },
    { value: "box", label: "Cajas" },
    { value: "pack", label: "Paquetes" }
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
          close();
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
          <Stack gap="md">
            <Title order={4}>Información Básica</Title>
            
            <TextInput
              label="Nombre del Producto"
              placeholder="Ej: Laptop HP ProBook 450"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.currentTarget.value)}
              error={errors.name}
              leftSection={<CubeIcon className="w-4 h-4" />}
              required
            />

            <Textarea
              label="Descripción"
              placeholder="Describe las características principales del producto..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.currentTarget.value)}
              error={errors.description}
              minRows={3}
              required
            />

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Categoría"
                  placeholder="Selecciona una categoría"
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value)}
                  data={categories}
                  error={errors.category}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Marca"
                  placeholder="Ej: HP, Samsung, etc."
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.currentTarget.value)}
                  leftSection={<TagIcon className="w-4 h-4" />}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        );

      case 2:
        return (
          <Stack gap="md">
            <Title order={4}>Precio y Disponibilidad</Title>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="SKU / Código"
                  placeholder="Ej: HP-PB450-001"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.currentTarget.value)}
                  error={errors.sku}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="Precio"
                  placeholder="0.00"
                  leftSection="$"
                  decimalScale={2}
                  min={0}
                  value={formData.price}
                  onChange={(value) => handleInputChange('price', typeof value === 'number' ? value : 0)}
                  error={errors.price}
                  required
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <NumberInput
                  label="Cantidad Mínima"
                  placeholder="1"
                  min={1}
                  value={formData.minQuantity}
                  onChange={(value) => handleInputChange('minQuantity', typeof value === 'number' ? value : 1)}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <NumberInput
                  label="Cantidad Máxima"
                  placeholder="1000"
                  min={1}
                  value={formData.maxQuantity}
                  onChange={(value) => handleInputChange('maxQuantity', typeof value === 'number' ? value : 1000)}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Unidad"
                  placeholder="Selecciona"
                  value={formData.unit}
                  onChange={(value) => handleInputChange('unit', value)}
                  data={units}
                  error={errors.unit}
                  required
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Especificaciones Técnicas"
              placeholder="Detalles técnicos, dimensiones, características especiales..."
              value={formData.specifications}
              onChange={(e) => handleInputChange('specifications', e.currentTarget.value)}
              minRows={3}
            />
          </Stack>
        );

      case 3:
        return (
          <Stack gap="md">
            <Title order={4}>Imágenes del Producto</Title>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--mantine-color-blue-4)' : 'var(--mantine-color-gray-4)'}`,
                borderRadius: 'var(--mantine-radius-md)',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'var(--mantine-color-blue-0)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: 'none' }}
              />
              <CloudArrowUpIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: 'var(--mantine-color-gray-5)' }} />
              <Text size="lg" fw={500} c="dark.7" mb="sm">
                {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra imágenes aquí'}
              </Text>
              <Text size="sm" c="dimmed">
                O haz clic para seleccionar archivos (máximo 6 imágenes, 5MB cada una)
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                Formatos soportados: JPG, PNG, WebP
              </Text>
            </div>

            {errors.images && (
              <Text c="red" size="sm">{errors.images}</Text>
            )}

            {formData.images.length > 0 && (
              <Grid>
                {formData.images.map((image, index) => (
                  <Grid.Col key={index} span={{ base: 6, md: 4 }}>
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        h={120}
                        style={{ objectFit: 'cover' }}
                        radius="md"
                      />
                      <ActionIcon
                        size="sm"
                        color="red"
                        style={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => removeImage(index)}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </ActionIcon>
                    </div>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Stack>
        );

      case 4:
        return (
          <Stack gap="md">
            <Title order={4}>Etiquetas y Finalización</Title>
            
            <div>
              <Text size="sm" fw={500} mb="xs">Etiquetas (palabras clave)</Text>
              
              {formData.tags.length > 0 && (
                <Group gap="xs" mb="sm">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="light"
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeTag(index)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </Group>
              )}
              
              <Group>
                <TextInput
                  placeholder="Escribe una etiqueta"
                  value={newTag}
                  onChange={(e) => setNewTag(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newTag.trim()) {
                        addTag(newTag.trim());
                        setNewTag('');
                      }
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={() => {
                    if (newTag.trim()) {
                      addTag(newTag.trim());
                      setNewTag('');
                    }
                  }}
                  disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
                >
                  Agregar
                </Button>
              </Group>
            </div>

            {/* Resumen del producto */}
            <Paper bg="gray.0" p="md" withBorder>
              <Text fw={500} mb="md">Resumen del Producto</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Nombre:</Text>
                  <Text size="sm" fw={500}>{formData.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Categoría:</Text>
                  <Text size="sm" fw={500}>{categories.find(c => c.value === formData.category)?.label}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">SKU:</Text>
                  <Text size="sm" fw={500}>{formData.sku}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Precio:</Text>
                  <Text size="sm" fw={500}>${formData.price.toLocaleString()}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Unidad:</Text>
                  <Text size="sm" fw={500}>{units.find(u => u.value === formData.unit)?.label}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Imágenes:</Text>
                  <Text size="sm" fw={500}>{formData.images.length} archivo(s)</Text>
                </Group>
              </Stack>
            </Paper>

            {loading && (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Subiendo producto...</Text>
                  <Text size="sm" fw={500}>{uploadProgress}%</Text>
                </Group>
                <Progress value={uploadProgress} />
              </Stack>
            )}

            {errors.submit && (
              <Alert color="red" icon={<ExclamationTriangleIcon className="w-5 h-5" />}>
                {errors.submit}
              </Alert>
            )}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Button
        size="lg"
        leftSection={<PlusIcon className="w-5 h-5" />}
        onClick={open}
      >
        Agregar Nuevo Producto
      </Button>

      <Modal 
        opened={opened} 
        onClose={close}
        size="xl"
        closeOnClickOutside={!loading}
        closeOnEscape={!loading}
        withCloseButton={!loading}
        title={
          <Stack gap="xs">
            <Title order={3}>Agregar Nuevo Producto</Title>
            <Group>
              <Progress
                value={(currentStep / 4) * 100}
                style={{ flex: 1 }}
                size="sm"
              />
              <Text size="sm" c="dimmed">
                Paso {currentStep} de 4
              </Text>
            </Group>
          </Stack>
        }
      >
        <Stack gap="lg">
          {renderStep()}
          
          <Group justify="flex-end" mt="lg">
            <Button
              variant="light"
              onClick={currentStep === 1 ? close : prevStep}
              disabled={loading}
            >
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={loading}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                color="green"
                onClick={handleSubmit}
                loading={loading}
                leftSection={uploadProgress === 100 ? <CheckCircleIcon className="w-5 h-5" /> : undefined}
              >
                {loading ? 'Subiendo...' : uploadProgress === 100 ? 'Completado' : 'Crear Producto'}
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </>
  );
}