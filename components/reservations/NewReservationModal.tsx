'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  DateInput,
  Textarea,
  Card,
  CardBody,
  Progress,
  Avatar,
  Chip
} from '@heroui/react';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CakeIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { CalendarDate } from '@internationalized/date';
import toast from 'react-hot-toast';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  childName: string;
  childAge: string;
  eventDate: CalendarDate | null;
  eventTime: string;
  packageId: string;
  specialComments: string;
}

const timeSlots = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

interface PackageOption {
  _id: string;
  name: string;
  number: string;
  description?: string;
  maxGuests: number;
  pricing: {
    mondayToThursday: number;
    fridayToSunday: number;
  };
  isActive: boolean;
}

const stepConfig = [
  { 
    title: 'Información del Cliente', 
    subtitle: 'Datos de contacto del responsable', 
    icon: UserIcon,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50'
  },
  { 
    title: 'Información del Festejado/a', 
    subtitle: 'Datos del niño/a que celebra', 
    icon: CakeIcon,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'from-pink-50 to-rose-50'
  },
  { 
    title: 'Detalles del Evento', 
    subtitle: 'Fecha, hora y paquete seleccionado', 
    icon: CalendarIcon,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-50 to-emerald-50'
  }
];

export default function NewReservationModal({
  isOpen,
  onClose,
  onSuccess
}: NewReservationModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    childName: '',
    childAge: '',
    eventDate: null,
    eventTime: '',
    packageId: '',
    specialComments: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      childName: '',
      childAge: '',
      eventDate: null,
      eventTime: '',
      packageId: '',
      specialComments: ''
    });
    setStep(1);
  };

  // Cargar paquetes disponibles
  React.useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/admin/packages');
        const data = await response.json();
        if (data.success) {
          const activePackages = data.data.filter((pkg: PackageOption) => pkg.isActive);
          setPackages(activePackages);
        } else {
          toast.error('Error al cargar los paquetes');
        }
      } catch (error) {
        console.error('Error loading packages:', error);
        toast.error('Error al cargar los paquetes');
      } finally {
        setLoadingPackages(false);
      }
    };

    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const validateStep1 = () => {
    return formData.customerName.trim() && formData.customerEmail.trim() && formData.customerPhone.trim();
  };

  const validateStep2 = () => {
    return formData.childName.trim() && formData.childAge;
  };

  const validateStep3 = () => {
    return formData.eventDate && formData.eventTime && formData.packageId;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    
    try {
      const reservationData = {
        packageId: formData.packageId,
        eventDate: formData.eventDate ? new Date(
          formData.eventDate.year,
          formData.eventDate.month - 1,
          formData.eventDate.day
        ).toISOString() : '',
        eventTime: formData.eventTime,
        customer: {
          name: formData.customerName.trim(),
          email: formData.customerEmail.trim(),
          phone: formData.customerPhone.trim()
        },
        child: {
          name: formData.childName.trim(),
          age: parseInt(formData.childAge)
        },
        specialComments: formData.specialComments.trim() || undefined,
        foodOptionId: undefined,
        foodExtras: [],
        extraServices: [],
        eventThemeId: undefined,
        selectedThemePackage: undefined,
        selectedTheme: undefined
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('¡Reserva creada exitosamente!');
        onSuccess();
        handleClose();
      } else {
        console.error('Error response:', data);
        toast.error(data.error || data.message || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const currentStepConfig = stepConfig[step - 1];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-2">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <motion.div 
              className={`
                relative w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300
                ${step >= stepNumber 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {step > stepNumber ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckIcon className="w-6 h-6" />
                </motion.div>
              ) : (
                stepNumber
              )}
              
              {step === stepNumber && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ zIndex: -1 }}
                />
              )}
            </motion.div>
            {stepNumber < 3 && (
              <motion.div 
                className={`
                  w-16 h-1 mx-3 rounded-full transition-all duration-300
                  ${step > stepNumber 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                    : 'bg-gray-200'
                  }
                `}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: step > stepNumber ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => {
    const StepIcon = currentStepConfig.icon;
    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <motion.div 
            className={`w-20 h-20 bg-gradient-to-br ${currentStepConfig.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <StepIcon className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStepConfig.title}</h3>
          <p className="text-gray-600">{currentStepConfig.subtitle}</p>
        </div>
        
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              label="Nombre completo"
              placeholder="Ej: María González"
              value={formData.customerName}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customerName: value }))}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<UserIcon className="w-5 h-5 text-gray-400" />}
              classNames={{
                input: "text-gray-900 text-base",
                inputWrapper: "h-14 border-2 border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white transition-all duration-200"
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              label="Correo electrónico"
              placeholder="Ej: maria@email.com"
              type="email"
              value={formData.customerEmail}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customerEmail: value }))}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<EnvelopeIcon className="w-5 h-5 text-gray-400" />}
              classNames={{
                input: "text-gray-900 text-base",
                inputWrapper: "h-14 border-2 border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white transition-all duration-200"
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Input
              label="Teléfono"
              placeholder="Ej: 55 1234 5678"
              value={formData.customerPhone}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<PhoneIcon className="w-5 h-5 text-gray-400" />}
              classNames={{
                input: "text-gray-900 text-base",
                inputWrapper: "h-14 border-2 border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white transition-all duration-200"
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    );
  };

  const renderStep2 = () => {
    const StepIcon = currentStepConfig.icon;
    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <motion.div 
            className={`w-20 h-20 bg-gradient-to-br ${currentStepConfig.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
            whileHover={{ scale: 1.05, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <StepIcon className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStepConfig.title}</h3>
          <p className="text-gray-600">{currentStepConfig.subtitle}</p>
        </div>
        
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              label="Nombre del niño/a"
              placeholder="Ej: Sofía"
              value={formData.childName}
              onValueChange={(value) => setFormData(prev => ({ ...prev, childName: value }))}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<HeartIcon className="w-5 h-5 text-pink-400" />}
              classNames={{
                input: "text-gray-900 text-base",
                inputWrapper: "h-14 border-2 border-gray-200 hover:border-pink-400 focus-within:border-pink-500 bg-white transition-all duration-200"
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Select
              label="Edad del festejado/a"
              placeholder="Selecciona la edad"
              selectedKeys={formData.childAge ? [formData.childAge] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData(prev => ({ ...prev, childAge: selected }));
              }}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<StarIcon className="w-5 h-5 text-yellow-400" />}
              classNames={{
                trigger: "h-14 border-2 border-gray-200 hover:border-pink-400 focus-within:border-pink-500 bg-white transition-all duration-200",
                value: "text-gray-900 text-base"
              }}
            >
              {Array.from({ length: 15 }, (_, i) => i + 1).map((age) => (
                <SelectItem key={age.toString()}>
                  {age} {age === 1 ? 'año' : 'años'}
                </SelectItem>
              ))}
            </Select>
          </motion.div>

          {formData.childName && formData.childAge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl bg-gradient-to-br ${currentStepConfig.bgColor} border border-pink-200`}
            >
              <div className="flex items-center gap-4">
                <Avatar
                  name={formData.childName}
                  className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 text-white"
                />
                <div>
                  <p className="font-semibold text-gray-900">{formData.childName}</p>
                  <p className="text-sm text-gray-600">{formData.childAge} {formData.childAge === '1' ? 'año' : 'años'}</p>
                </div>
                <div className="ml-auto">
                  <Chip color="secondary" variant="flat" size="sm">
                    ¡Festejado/a!
                  </Chip>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderStep3 = () => {
    const StepIcon = currentStepConfig.icon;
    return (
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <motion.div 
            className={`w-20 h-20 bg-gradient-to-br ${currentStepConfig.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <StepIcon className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStepConfig.title}</h3>
          <p className="text-gray-600">{currentStepConfig.subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DateInput
              label="Fecha del evento"
              value={formData.eventDate}
              onChange={(date) => setFormData(prev => ({ ...prev, eventDate: date }))}
              isRequired
              variant="bordered"
              size="lg"
              minValue={new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())}
              classNames={{
                input: "text-gray-900 text-base",
                inputWrapper: "h-14 border-2 border-gray-200 hover:border-green-400 focus-within:border-green-500 bg-white transition-all duration-200"
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Select
              label="Hora del evento"
              placeholder="Selecciona la hora"
              selectedKeys={formData.eventTime ? [formData.eventTime] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData(prev => ({ ...prev, eventTime: selected }));
              }}
              isRequired
              variant="bordered"
              size="lg"
              startContent={<ClockIcon className="w-5 h-5 text-green-400" />}
              classNames={{
                trigger: "h-14 border-2 border-gray-200 hover:border-green-400 focus-within:border-green-500 bg-white transition-all duration-200",
                value: "text-gray-900 text-base"
              }}
            >
              {timeSlots.map((time) => (
                <SelectItem key={time}>
                  {time}
                </SelectItem>
              ))}
            </Select>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Select
            label="Paquete de celebración"
            placeholder={loadingPackages ? "Cargando paquetes..." : "Selecciona un paquete"}
            selectedKeys={formData.packageId ? [formData.packageId] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setFormData(prev => ({ ...prev, packageId: selected }));
            }}
            isRequired
            variant="bordered"
            size="lg"
            isDisabled={loadingPackages}
            startContent={<SparklesIcon className="w-5 h-5 text-purple-400" />}
            classNames={{
              trigger: "h-14 border-2 border-gray-200 hover:border-green-400 focus-within:border-green-500 bg-white transition-all duration-200",
              value: "text-gray-900 text-base"
            }}
          >
            {packages.map((pkg) => (
              <SelectItem key={pkg._id} textValue={`${pkg.number} - ${pkg.name}`}>
                <div className="flex flex-col py-2">
                  <span className="font-semibold text-gray-900">{pkg.number} - {pkg.name}</span>
                  <span className="text-sm text-green-600 font-medium">
                    L-J: ${pkg.pricing.mondayToThursday.toLocaleString()} |
                    V-D: ${pkg.pricing.fridayToSunday.toLocaleString()} MXN
                  </span>
                  <span className="text-xs text-gray-500">
                    Hasta {pkg.maxGuests} invitados{pkg.description ? ` - ${pkg.description}` : ''}
                  </span>
                </div>
              </SelectItem>
            ))}
          </Select>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Textarea
            label="Comentarios especiales (opcional)"
            placeholder="Alguna solicitud especial, alergias, o comentarios adicionales..."
            value={formData.specialComments}
            onValueChange={(value) => setFormData(prev => ({ ...prev, specialComments: value }))}
            minRows={3}
            variant="bordered"
            classNames={{
              input: "text-gray-900 text-base",
              inputWrapper: "border-2 border-gray-200 hover:border-green-400 focus-within:border-green-500 bg-white transition-all duration-200"
            }}
          />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      isDismissable={!loading}
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/60 backdrop-blur-md",
        base: "bg-white shadow-2xl border-0 max-h-[95vh]",
        wrapper: "z-[1001] items-center justify-center p-4",
        body: "p-0",
        header: "p-0",
        footer: "p-0"
      }}
    >
      <ModalContent className="bg-white rounded-3xl overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <ModalHeader className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                >
                  <CalendarIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Nueva Reserva</h2>
                  <p className="text-white/80">Crea una nueva celebración paso a paso</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/80 mb-2">Paso {step} de 3</div>
                <Progress 
                  value={(step / 3) * 100} 
                  className="w-32"
                  color="default"
                  size="sm"
                  classNames={{
                    track: "bg-white/20",
                    indicator: "bg-white"
                  }}
                />
              </div>
            </div>
          </ModalHeader>

          {/* Body */}
          <ModalBody className="p-8 bg-white">
            <div className="max-w-2xl mx-auto">
              {renderStepIndicator()}
              
              <Card className={`border-0 shadow-lg bg-gradient-to-br ${currentStepConfig.bgColor}`}>
                <CardBody className="p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </div>
          </ModalBody>

          {/* Footer */}
          <ModalFooter className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="flat"
                      onPress={() => setStep(step - 1)}
                      isDisabled={loading}
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                      size="lg"
                      startContent={<ArrowLeftIcon className="w-4 h-4" />}
                    >
                      Anterior
                    </Button>
                  </motion.div>
                )}
              </div>
              
              <div className="flex gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="light"
                    onPress={handleClose}
                    isDisabled={loading}
                    className="text-gray-600 hover:bg-gray-200 font-medium"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </motion.div>
                
                {step < 3 ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onPress={() => {
                        if (step === 1 && !validateStep1()) {
                          toast.error('Completa todos los campos del cliente');
                          return;
                        }
                        if (step === 2 && !validateStep2()) {
                          toast.error('Completa la información del festejado/a');
                          return;
                        }
                        setStep(step + 1);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium shadow-lg"
                      size="lg"
                      endContent={<ArrowRightIcon className="w-4 h-4" />}
                    >
                      Siguiente
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onPress={handleSubmit}
                      isLoading={loading}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 font-medium shadow-lg"
                      size="lg"
                      startContent={!loading ? <CheckIcon className="w-4 h-4" /> : undefined}
                    >
                      {loading ? 'Creando reserva...' : 'Crear Reserva'}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </ModalFooter>
        </motion.div>
      </ModalContent>
    </Modal>
  );
}