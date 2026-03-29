'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';

const Container = styled.div`
  position: relative;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  padding-right: 44px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const CalendarIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 100;
  padding: 20px;
  display: ${({ $isOpen }) => $isOpen ? 'block' : 'none'};
  min-width: 320px;
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const MonthYearLabel = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const NavBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
`;

const WeekDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
`;

const WeekDay = styled.div`
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  padding: 8px 0;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const Day = styled.button<{ $isToday?: boolean; $isSelected?: boolean; $isOtherMonth?: boolean; $isPast?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: ${({ $isSelected }) => $isSelected ? '#4A90D9' : 'transparent'};
  color: ${({ $isSelected, $isOtherMonth, $isPast }) => 
    $isSelected ? '#fff' : 
    $isOtherMonth ? '#cbd5e1' : 
    $isPast ? '#94a3b8' : '#0f172a'};
  font-size: 14px;
  font-weight: ${({ $isToday }) => $isToday ? '600' : '400'};
  cursor: ${({ $isPast }) => $isPast ? 'not-allowed' : 'pointer'};
  transition: all 0.15s;
  
  ${({ $isToday, $isSelected }) => $isToday && !$isSelected && `
    border: 2px solid #4A90D9;
  `}
  
  &:hover:not(:disabled) {
    background: ${({ $isSelected, $isPast }) => 
      $isSelected ? '#4A90D9' : 
      $isPast ? 'transparent' : '#f1f5f9'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const TimeSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const TimeLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
`;

const TimeInputs = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TimeInput = styled.input`
  width: 60px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  color: #0f172a;
  
  &:focus {
    outline: none;
    border-color: #4A90D9;
  }
  
  /* Hide spinner */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
`;

const TimeSeparator = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: #64748b;
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const ResetBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    color: #0f172a;
  }
`;

// English weekday names
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// English month names
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface EnglishDateTimePickerProps {
  value: string; // ISO format or datetime-local format
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  label?: string;
}

const EnglishDateTimePicker: React.FC<EnglishDateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd.mm.yyyy',
  minDate = new Date(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse value
  const selectedDate = value ? new Date(value) : null;
  
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      setHours(String(selectedDate.getHours()).padStart(2, '0'));
      setMinutes(String(selectedDate.getMinutes()).padStart(2, '0'));
    }
  }, [value]);
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const formatDisplay = () => {
    if (!selectedDate) return '';
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = selectedDate.getFullYear();
    const h = String(selectedDate.getHours()).padStart(2, '0');
    const m = String(selectedDate.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${h}:${m}`;
  };
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Monday in our grid
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
  };
  
  const generateCalendarDays = () => {
    const days: { date: Date; isOtherMonth: boolean }[] = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isOtherMonth: true,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isOtherMonth: false,
      });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isOtherMonth: true,
      });
    }
    
    return days;
  };
  
  const handleDayClick = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date < now) return; // Don't allow past dates
    
    const h = parseInt(hours) || 12;
    const m = parseInt(minutes) || 0;
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
    onChange(newDate.toISOString().slice(0, 16));
  };
  
  const handleTimeChange = (type: 'hours' | 'minutes', val: string) => {
    let num = parseInt(val) || 0;
    if (type === 'hours') {
      num = Math.max(0, Math.min(23, num));
      setHours(String(num).padStart(2, '0'));
    } else {
      num = Math.max(0, Math.min(59, num));
      setMinutes(String(num).padStart(2, '0'));
    }
    
    if (selectedDate) {
      const h = type === 'hours' ? num : parseInt(hours);
      const m = type === 'minutes' ? num : parseInt(minutes);
      const newDate = new Date(selectedDate);
      newDate.setHours(h, m);
      onChange(newDate.toISOString().slice(0, 16));
    }
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const reset = () => {
    onChange('');
    setHours('12');
    setMinutes('00');
    setCurrentMonth(new Date());
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };
  
  const isPast = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date < now;
  };
  
  const days = generateCalendarDays();
  
  return (
    <Container ref={containerRef}>
      <InputWrapper>
        <StyledInput
          readOnly
          value={formatDisplay()}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          data-testid="datetime-picker-input"
        />
        <CalendarIcon>
          <Calendar size={18} />
        </CalendarIcon>
      </InputWrapper>
      
      <Dropdown $isOpen={isOpen} data-testid="datetime-picker-dropdown">
        <CalendarHeader>
          <NavBtn onClick={prevMonth}>
            <ChevronLeft size={18} />
          </NavBtn>
          <MonthYearLabel>
            {MONTHS[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
          </MonthYearLabel>
          <NavBtn onClick={nextMonth}>
            <ChevronRight size={18} />
          </NavBtn>
        </CalendarHeader>
        
        <WeekDays>
          {WEEKDAYS.map(day => (
            <WeekDay key={day}>{day}</WeekDay>
          ))}
        </WeekDays>
        
        <DaysGrid>
          {days.map((day, idx) => (
            <Day
              key={idx}
              $isToday={isToday(day.date)}
              $isSelected={isSameDay(selectedDate, day.date)}
              $isOtherMonth={day.isOtherMonth}
              $isPast={isPast(day.date)}
              onClick={() => handleDayClick(day.date)}
              disabled={isPast(day.date)}
            >
              {day.date.getDate()}
            </Day>
          ))}
        </DaysGrid>
        
        <TimeSection>
          <TimeLabel>Time</TimeLabel>
          <TimeInputs>
            <TimeInput
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => handleTimeChange('hours', e.target.value)}
              data-testid="time-hours-input"
            />
            <TimeSeparator>:</TimeSeparator>
            <TimeInput
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => handleTimeChange('minutes', e.target.value)}
              data-testid="time-minutes-input"
            />
          </TimeInputs>
        </TimeSection>
        
        <Footer>
          <ResetBtn onClick={reset} data-testid="reset-datetime-btn">
            <RotateCcw size={14} />
            Reset
          </ResetBtn>
        </Footer>
      </Dropdown>
    </Container>
  );
};

export default EnglishDateTimePicker;
