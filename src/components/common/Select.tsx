'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useClickOutsideMultiple } from '@/hooks/useClickOutside';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  searchable?: boolean;
  id?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  error = false,
  searchable = false,
  id,
  name,
  size = 'md',
  variant = 'default',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, showAbove: false });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(filteredOptions.length * 48 + (searchable ? 60 : 16), 320);
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      // Calculate width - on mobile, use smaller min-width
      const isMobile = window.innerWidth < 640;
      const minWidth = isMobile ? 180 : 220;
      const dropdownWidth = Math.max(rect.width, minWidth);

      // Calculate left position, ensuring dropdown stays within viewport
      let left = rect.left;
      const rightOverflow = left + dropdownWidth - window.innerWidth;
      if (rightOverflow > 0) {
        // Dropdown would overflow right edge, shift it left
        left = Math.max(8, left - rightOverflow - 8); // 8px padding from edge
      }
      // Also ensure it doesn't overflow left edge
      if (left < 8) {
        left = 8;
      }

      setDropdownPosition({
        top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left,
        width: Math.min(dropdownWidth, window.innerWidth - 16), // Max width with 8px padding on each side
        showAbove,
      });
    }
  }, [filteredOptions.length, searchable]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Close on outside click
  useClickOutsideMultiple(
    [triggerRef as React.RefObject<HTMLElement>, dropdownRef as React.RefObject<HTMLElement>],
    () => {
      setIsOpen(false);
      setSearchQuery('');
    },
    isOpen
  );

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when options change
  useEffect(() => {
    if (isOpen) {
      const currentIndex = filteredOptions.findIndex(opt => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, filteredOptions, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li[data-selectable="true"]');
      const highlightedItem = items[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const option = filteredOptions[highlightedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
            setSearchQuery('');
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex < filteredOptions.length ? nextIndex : 0;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => {
            const nextIndex = prev - 1;
            return nextIndex >= 0 ? nextIndex : filteredOptions.length - 1;
          });
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-5 py-3 text-base min-h-[48px]',
  };

  const dropdown = mounted && isOpen ? createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-[1px]"
        onClick={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`fixed z-[9999] ${dropdownPosition.showAbove ? 'animate-in fade-in-0 slide-in-from-bottom-2' : 'animate-in fade-in-0 slide-in-from-top-2'} duration-200`}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border-subtle)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          {/* Search input */}
          {searchable && (
            <div className="p-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--color-text-muted)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-[260px] overflow-y-auto p-2 scrollbar-thin"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    data-selectable={!option.disabled ? 'true' : 'false'}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                      transition-all duration-150 ease-out
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--color-accent-soft)'
                        : isHighlighted
                          ? 'var(--color-bg-tertiary)'
                          : 'transparent',
                    }}
                  >
                    {/* Icon */}
                    {option.icon && (
                      <div
                        className={`
                          w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                          transition-all duration-150
                        `}
                        style={{
                          backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-bg-muted)',
                          color: isSelected ? 'white' : 'var(--color-text-secondary)',
                        }}
                      >
                        {option.icon}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium truncate transition-colors duration-150"
                        style={{
                          color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                        }}
                      >
                        {option.label}
                      </div>
                      {option.description && (
                        <div
                          className="text-xs truncate mt-0.5"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {option.description}
                        </div>
                      )}
                    </div>

                    {/* Check mark */}
                    <div
                      className={`
                        w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                        transition-all duration-150
                        ${isSelected ? 'scale-100' : 'scale-0'}
                      `}
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden native select for form compatibility */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom select trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 rounded-xl text-left
          transition-all duration-200 ease-out
          ${sizeClasses[size]}
          ${variant === 'minimal'
            ? `bg-transparent hover:bg-[var(--color-bg-tertiary)] ${isOpen ? 'bg-[var(--color-bg-tertiary)]' : ''}`
            : `border ${error
                ? 'border-red-400 focus:ring-2 focus:ring-red-500/20'
                : isOpen
                  ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20'
                  : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border)]'
              }`
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none
        `}
        style={{
          backgroundColor: variant === 'minimal' ? 'transparent' : 'var(--color-bg-secondary)',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className="block truncate"
          style={{
            color: selectedOption ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-text-tertiary)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdown}
    </div>
  );
}
