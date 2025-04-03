import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, setMonth, setYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthYearPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState<Date>(value || new Date());
  const [view, setView] = useState<'months' | 'years'>('months');

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentDate.getFullYear(), i, 1);
    return {
      value: i,
      label: format(date, 'MMM', { locale: ptBR }),
    };
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - 2 + i;
    return {
      value: year,
      label: year.toString(),
    };
  });

  const handlePrevious = () => {
    if (view === 'years') {
      const newYear = currentDate.getFullYear() - 10;
      setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
    } else {
      setCurrentDate(prevDate => {
        const newDate = subMonths(prevDate, 12);
        return new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      });
    }
  };

  const handleNext = () => {
    if (view === 'years') {
      const newYear = currentDate.getFullYear() + 10;
      setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
    } else {
      setCurrentDate(prevDate => {
        const newDate = addMonths(prevDate, 12);
        return new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      });
    }
  };

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
    setCurrentDate(newDate);
    onChange(newDate);
    onClose();
  };

  const handleSelectYear = (year: number) => {
    const newDate = new Date(year, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
    setView('months');
  };

  const handlePreviousYear = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(prevDate.getFullYear() - 1);
      return newDate;
    });
  };

  const handleNextYear = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setFullYear(prevDate.getFullYear() + 1);
      return newDate;
    });
  };

  return (
    <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePreviousYear}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <span className="text-lg font-semibold text-gray-900">
          {currentDate.getFullYear()}
        </span>
        
        <button
          type="button"
          onClick={handleNextYear}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {view === 'months'
          ? months.map(month => (
              <button
                key={month.value}
                onClick={() => handleSelectMonth(month.value)}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${currentDate.getMonth() === month.value
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                {month.label}
              </button>
            ))
          : years.map(year => (
              <button
                key={year.value}
                onClick={() => handleSelectYear(year.value)}
                className={`
                  p-2 text-sm rounded-lg transition-colors
                  ${currentDate.getFullYear() === year.value
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                {year.label}
              </button>
            ))}
      </div>
    </div>
  );
};