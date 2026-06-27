import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const toDate = (value?: string) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

const isSameDay = (first: Date | null, second: Date | null) =>
  Boolean(
    first &&
      second &&
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate(),
  );

const isBetween = (date: Date, start: Date | null, end: Date | null) =>
  Boolean(start && end && date > start && date < end);

const formatDateLabel = (value?: string, fallback = 'Add date') => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const days: (Date | null)[] = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return days;
};

const CalendarMonth: React.FC<{
  monthDate: Date;
  selectedStart: Date | null;
  selectedEnd?: Date | null;
  onSelect: (date: Date) => void;
}> = ({ monthDate, selectedStart, selectedEnd = null, onSelect }) => (
  <div className="space-y-3">
    <h3 className="text-center text-sm font-bold text-neutral-900">
      {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
    </h3>
    <div className="grid grid-cols-7 gap-y-1">
      {weekdays.map((day) => (
        <div key={day} className="py-1 text-center text-[10px] font-bold text-neutral-400">
          {day}
        </div>
      ))}
      {getCalendarDays(monthDate).map((date, index) => {
        if (!date) return <div key={`empty-${index}`} />;

        const isStart = isSameDay(date, selectedStart);
        const isEnd = isSameDay(date, selectedEnd);
        const isMiddle = isBetween(date, selectedStart, selectedEnd);
        const isSingleSelected = isStart && !selectedEnd;

        return (
          <button
            key={toDateString(date)}
            type="button"
            onClick={() => onSelect(date)}
            className={[
              'relative flex aspect-square items-center justify-center text-sm font-semibold transition-colors',
              isMiddle ? 'bg-primary-50 text-neutral-900' : 'text-neutral-700',
              isStart && selectedEnd ? 'rounded-l-full bg-primary-600 text-white' : '',
              isEnd && selectedStart ? 'rounded-r-full bg-primary-600 text-white' : '',
              isSingleSelected ? 'rounded-full bg-primary-600 text-white' : '',
              !isStart && !isEnd ? 'hover:rounded-full hover:bg-neutral-50 hover:ring-1 hover:ring-neutral-900' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {date.getDate()}
          </button>
        );
      })}
    </div>
  </div>
);

const CalendarPopover: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
}> = ({ children, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute left-0 z-50 mt-2 w-[min(42rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white shadow-2xl"
    >
      {children}
    </div>
  );
};

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Add date',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const draftDate = toDate(draftValue);
  const [visibleMonth, setVisibleMonth] = useState(
    toDate(value) ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const openCalendar = () => {
    const currentDate = toDate(value);
    setDraftValue(value);
    if (currentDate) {
      setVisibleMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }
    setIsOpen(true);
  };

  const confirmDate = () => {
    onChange(draftValue);
    setIsOpen(false);
  };

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={openCalendar}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-left text-sm text-neutral-900 shadow-sm transition-all hover:border-neutral-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <span className={value ? 'font-medium' : 'text-neutral-400'}>
          {formatDateLabel(value, placeholder)}
        </span>
        <Calendar className="h-4 w-4 text-neutral-400" />
      </button>

      {isOpen && (
        <CalendarPopover onClose={() => setIsOpen(false)}>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-neutral-900">Select date</p>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-8 p-5 md:grid-cols-2">
            {[visibleMonth, addMonths(visibleMonth, 1)].map((month) => (
              <CalendarMonth
                key={`${month.getFullYear()}-${month.getMonth()}`}
                monthDate={month}
                selectedStart={draftDate}
                onSelect={(date) => setDraftValue(toDateString(date))}
              />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-4">
            <button
              type="button"
              onClick={() => setDraftValue('')}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 underline hover:bg-neutral-50"
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDate}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </CalendarPopover>
      )}
    </div>
  );
};

interface DateRangePickerProps {
  startValue: string;
  endValue: string;
  onChange: (range: { start: string; end: string }) => void;
  startLabel?: string;
  endLabel?: string;
  className?: string;
  error?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startValue,
  endValue,
  onChange,
  startLabel = 'Check-in',
  endLabel = 'Check-out',
  className = '',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [draftStartValue, setDraftStartValue] = useState(startValue);
  const [draftEndValue, setDraftEndValue] = useState(endValue);
  const draftStartDate = toDate(draftStartValue);
  const draftEndDate = toDate(draftEndValue);
  const [visibleMonth, setVisibleMonth] = useState(
    toDate(startValue) ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const openCalendar = (nextSelecting: 'start' | 'end') => {
    const currentStart = toDate(startValue);
    setDraftStartValue(startValue);
    setDraftEndValue(endValue);
    setSelecting(nextSelecting);
    if (currentStart) {
      setVisibleMonth(new Date(currentStart.getFullYear(), currentStart.getMonth(), 1));
    }
    setIsOpen(true);
  };

  const selectDate = (date: Date) => {
    const nextValue = toDateString(date);

    if (selecting === 'start' || !draftStartDate || (draftEndDate && date > draftEndDate)) {
      setDraftStartValue(nextValue);
      setDraftEndValue('');
      setSelecting('end');
      return;
    }

    if (draftStartDate && date < draftStartDate) {
      setDraftStartValue(nextValue);
      setDraftEndValue(draftStartValue);
      setSelecting('end');
      return;
    }

    setDraftEndValue(nextValue);
    setSelecting('start');
  };

  const confirmRange = () => {
    onChange({ start: draftStartValue, end: draftEndValue });
    setIsOpen(false);
  };

  return (
    <div className={['relative', className].filter(Boolean).join(' ')}>
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600">
        <button
          type="button"
          onClick={() => openCalendar('start')}
          className={[
            'border-r border-neutral-200 px-3 pb-2 pt-2 text-left transition-colors hover:bg-neutral-50',
            selecting === 'start' && isOpen ? 'bg-primary-50' : '',
          ].join(' ')}
        >
          <span className="block text-[10px] font-extrabold uppercase text-neutral-900">
            {startLabel}
          </span>
          <span className={startValue ? 'mt-1 block truncate text-sm font-semibold text-neutral-900' : 'mt-1 block text-sm text-neutral-400'}>
            {formatDateLabel(startValue, 'Add date')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => openCalendar('end')}
          className={[
            'px-3 pb-2 pt-2 text-left transition-colors hover:bg-neutral-50',
            selecting === 'end' && isOpen ? 'bg-primary-50' : '',
          ].join(' ')}
        >
          <span className="block text-[10px] font-extrabold uppercase text-neutral-900">
            {endLabel}
          </span>
          <span className={endValue ? 'mt-1 block truncate text-sm font-semibold text-neutral-900' : 'mt-1 block text-sm text-neutral-400'}>
            {formatDateLabel(endValue, 'Add date')}
          </span>
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}

      {isOpen && (
        <CalendarPopover onClose={() => setIsOpen(false)}>
          <div className="flex flex-col gap-4 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="hidden rounded-full p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 sm:inline-flex"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-bold text-neutral-900">Select dates</p>
              <p className="text-xs text-neutral-500">
                {selecting === 'start' ? 'Choose your start date' : 'Choose your end date'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftStartValue('');
                  setDraftEndValue('');
                  setSelecting('start');
                }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 underline hover:bg-neutral-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 p-5 md:grid-cols-2">
            {[visibleMonth, addMonths(visibleMonth, 1)].map((month) => (
              <CalendarMonth
                key={`${month.getFullYear()}-${month.getMonth()}`}
                monthDate={month}
                selectedStart={draftStartDate}
                selectedEnd={draftEndDate}
                onSelect={selectDate}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-2 text-sm sm:w-80">
              <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2">
                <span className="block text-[10px] font-bold uppercase text-primary-700">
                  {startLabel}
                </span>
                <span className="mt-0.5 block truncate font-semibold text-neutral-900">
                  {formatDateLabel(draftStartValue, 'Add date')}
                </span>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
                <span className="block text-[10px] font-bold uppercase text-neutral-500">
                  {endLabel}
                </span>
                <span className="mt-0.5 block truncate font-semibold text-neutral-900">
                  {formatDateLabel(draftEndValue, 'Add date')}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRange}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </CalendarPopover>
      )}
    </div>
  );
};
