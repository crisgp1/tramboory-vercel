'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availability: { [key: string]: 'available' | 'limited' | 'unavailable' };
  minDate?: Date;
  maxDate?: Date;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDate,
  onDateSelect,
  availability,
  minDate = new Date(),
  maxDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setAnimationDirection(direction === 'prev' ? 'left' : 'right');
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDateAvailability = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return availability[dateKey] || 'available';
  };

  const isDateDisabled = (date: Date) => {
    if (!date) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (maxDate && date > maxDate) return true;
    
    return getDateAvailability(date) === 'unavailable';
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate || !date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDateSelect(date);
  };

  const days = getDaysInMonth(currentDate);

  const slideVariants = {
    enter: (direction: string) => ({
      x: direction === 'right' ? 400 : -400,
      opacity: 0,
      scale: 0.95,
      rotateY: direction === 'right' ? 15 : -15
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0
    },
    exit: (direction: string) => ({
      zIndex: 0,
      x: direction === 'right' ? -400 : 400,
      opacity: 0,
      scale: 0.95,
      rotateY: direction === 'right' ? -15 : 15
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="modern-calendar bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full mx-auto"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="calendar-header bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20" />
        <div className="flex items-center justify-between relative z-10">
          <motion.button
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth('prev')}
            className="p-3 rounded-full hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </motion.button>
          
          <motion.div 
            key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </motion.div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateMonth('next')}
            className="p-3 rounded-full hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Day names */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="day-names grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200"
      >
        {dayNames.map((day, index) => (
          <motion.div 
            key={day} 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
            className="p-4 text-center text-sm font-semibold text-gray-600"
          >
            {day}
          </motion.div>
        ))}
      </motion.div>

      {/* Calendar grid */}
      <div className="calendar-grid p-6 bg-white min-h-[400px] relative overflow-hidden">
        <AnimatePresence mode="wait" custom={animationDirection}>
          <motion.div
            key={`${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            custom={animationDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 200, damping: 20 },
              opacity: { duration: 0.3 },
              scale: { type: "spring", stiffness: 200, damping: 20 },
              rotateY: { type: "spring", stiffness: 200, damping: 20 }
            }}
            className="grid grid-cols-7 gap-3 absolute inset-6"
          >
            {days.map((date, index) => {
              if (!date) {
                return <motion.div key={index} className="h-14" />;
              }

              const availability = getDateAvailability(date);
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <motion.button
                  key={date.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.02,
                    type: "spring",
                    stiffness: 300
                  }}
                  whileHover={!disabled ? { 
                    scale: 1.1, 
                    y: -3,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                  } : {}}
                  whileTap={!disabled ? { scale: 0.95 } : {}}
                  onClick={() => handleDateClick(date)}
                  disabled={disabled}
                  className={`
                    relative h-14 w-full rounded-2xl font-semibold text-sm transition-all duration-300 border-2 flex items-center justify-center
                    ${selected 
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl ring-4 ring-indigo-200 border-indigo-500 scale-105' 
                      : today
                        ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 ring-2 ring-blue-300 border-blue-400'
                        : disabled
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50 border-gray-200'
                          : availability === 'available'
                            ? 'text-gray-700 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:text-green-700 hover:border-green-300 bg-white border-gray-200'
                            : availability === 'limited'
                              ? 'text-gray-700 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-yellow-100 hover:text-yellow-700 hover:border-yellow-300 bg-white border-gray-200'
                              : 'text-gray-300 cursor-not-allowed bg-gray-50 border-gray-200'
                    }
                  `}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 + 0.1 }}
                  >
                    {date.getDate()}
                  </motion.span>
                  
                  {/* Availability indicator */}
                  {!disabled && !selected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.02 + 0.2, type: "spring" }}
                      className={`
                        absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-sm
                        ${availability === 'available' 
                          ? 'bg-green-500 shadow-green-200' 
                          : availability === 'limited' 
                            ? 'bg-yellow-500 shadow-yellow-200' 
                            : 'bg-red-500 shadow-red-200'
                        }
                      `} 
                    />
                  )}
                  
                  {/* Today indicator */}
                  {today && !selected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.02 + 0.3, type: "spring" }}
                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm" 
                    />
                  )}
                  
                  {/* Selection glow effect */}
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-2xl -z-10"
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="calendar-legend bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6"
      >
        <div className="flex items-center justify-center gap-8 text-sm">
          {[
            { color: 'bg-green-500', label: 'Disponible', shadow: 'shadow-green-200' },
            { color: 'bg-yellow-500', label: 'Limitado', shadow: 'shadow-yellow-200' },
            { color: 'bg-red-500', label: 'No disponible', shadow: 'shadow-red-200' }
          ].map((item, index) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <motion.div 
                whileHover={{ scale: 1.2, rotate: 360 }}
                className={`w-4 h-4 rounded-full shadow-md ${item.color} ${item.shadow}`}
              />
              <span className="text-gray-700 font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomCalendar;