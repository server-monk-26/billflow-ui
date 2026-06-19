import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { DropdownOption, DropdownProps } from './Dropdown.types';

/**
 * Dropdown / single-select (CLAUDE.md §6.1). Token-themed, headless-style: a trigger button +
 * a popover listbox. Closes on outside click / Escape. Used for the topbar context switchers
 * (legal entity · storage unit, Design Spec §10). Built without the UI library so the trigger
 * matches the app's compact finance-pro chrome exactly.
 */
export function Dropdown<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  ariaLabel,
  label,
  error,
  required = false,
  leadingIcon,
  size = 'md',
  disabled = false,
  fullWidth = false,
  'data-testid': testId,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected: DropdownOption<T> | undefined = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  const trigger = (
    <div
      ref={containerRef}
      style={{ position: 'relative', ...(fullWidth ? { width: '100%' } : {}) }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...((ariaLabel ?? label) ? { 'aria-label': ariaLabel ?? label } : {})}
        data-testid={testId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-2)',
          width: fullWidth ? '100%' : 'auto',
          height: size === 'sm' ? '28px' : 'var(--row-h)',
          padding: '0 var(--sp-2)',
          background: 'var(--surface)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--r)',
          color: selected ? 'var(--text)' : 'var(--text-3)',
          font: 'inherit',
          fontSize: 'var(--fs-label)',
          cursor: disabled ? 'default' : 'pointer',
          maxWidth: fullWidth ? '100%' : 220,
        }}
      >
        {leadingIcon}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={1.8} style={{ flex: 'none', color: 'var(--text-3)' }} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: '100%',
            listStyle: 'none',
            margin: 0,
            padding: 'var(--sp-1)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => choose(opt.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    choose(opt.value);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-2)',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-soft)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 'var(--fs-label)', fontWeight: 500 }}>{opt.label}</span>
                  {opt.sublabel && (
                    <span className="mono" style={{ display: 'block', fontSize: 'var(--fs-eyebrow)', color: 'var(--text-3)' }}>
                      {opt.sublabel}
                    </span>
                  )}
                </span>
                {isSelected && <Check size={14} strokeWidth={2.4} style={{ flex: 'none' }} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  // Bare control (e.g. topbar switcher) when there's no label/error.
  if (!label && !error) return trigger;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 'var(--fs-label)',
            fontWeight: 500,
            color: 'var(--text-2)',
            marginBottom: 'var(--sp-1)',
          }}
        >
          {label}
          {required && (
            <span aria-hidden style={{ color: 'var(--danger)' }}>
              {' '}
              *
            </span>
          )}
        </span>
      )}
      {trigger}
      {error && (
        <span style={{ marginTop: 'var(--sp-1)', fontSize: 'var(--fs-label)', color: 'var(--danger)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
