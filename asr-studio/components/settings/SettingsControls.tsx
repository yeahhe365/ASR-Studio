import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const inputClassName =
  'w-full rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-input)] px-3 py-2.5 text-sm text-[var(--theme-text-primary)] shadow-sm transition-all duration-200 placeholder:text-[var(--theme-text-tertiary)] focus:border-[var(--theme-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)]/20 disabled:cursor-not-allowed disabled:opacity-60';

export const outlineButtonClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--theme-border-secondary)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50';

export const labelClassName = 'text-xs font-semibold uppercase text-[var(--theme-text-tertiary)]';

export const helpTextClassName = 'mt-2 text-xs leading-relaxed text-[var(--theme-text-tertiary)]';

export const dangerButtonClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300';

export const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  id: string;
}> = ({ enabled, onChange, disabled, id }) => (
  <button
    type="button"
    id={id}
    onClick={(event) => {
      event.stopPropagation();
      if (!disabled) {
        onChange(!enabled);
      }
    }}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-60 ${
      enabled
        ? 'border-transparent bg-[var(--theme-bg-accent)]'
        : 'border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]'
    }`}
    aria-pressed={enabled}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export const SectionBlock: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
}> = ({ title, icon, children, className, description }) => (
  <section
    className={`rounded-lg border border-[var(--theme-border-secondary)]/70 bg-[var(--theme-bg-secondary)]/30 px-3 py-4 sm:px-4 ${className || ''}`}
  >
    <div className="mb-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--theme-text-primary)]">
        {icon && <span className="text-[var(--theme-text-tertiary)]">{icon}</span>}
        {title}
      </h4>
      {description && <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">{description}</p>}
    </div>
    <div className="space-y-0.5">{children}</div>
  </section>
);

export const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  description?: string;
  className?: string;
}> = ({ title, icon, children, defaultOpen = false, description, className }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section
      className={`rounded-lg border border-[var(--theme-border-secondary)]/70 bg-[var(--theme-bg-secondary)]/20 ${className || ''}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full items-start gap-3 px-3 py-3.5 text-left transition-colors hover:bg-[var(--theme-bg-tertiary)]/30 sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[var(--theme-text-tertiary)]">{icon}</span>}
            <span className="text-sm font-semibold text-[var(--theme-text-primary)]">{title}</span>
          </div>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">{description}</p>
          )}
        </div>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--theme-text-tertiary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div id={contentId} className="space-y-0.5 border-t border-[var(--theme-border-secondary)]/60 px-3 py-3 sm:px-4">
          {children}
        </div>
      )}
    </section>
  );
};

export const SettingRow: React.FC<{
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  layout?: 'inline' | 'stacked';
  htmlFor?: string;
  onActivate?: () => void;
  disabled?: boolean;
}> = ({
  label,
  description,
  icon,
  children,
  className,
  labelClassName,
  layout = 'inline',
  htmlFor,
  onActivate,
  disabled,
}) => {
  const isInteractive = Boolean(onActivate) && !disabled;

  const handleActivate = () => {
    if (isInteractive) {
      onActivate?.();
    }
  };

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleActivate : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleActivate();
              }
            }
          : undefined
      }
      className={`flex flex-col gap-3 rounded-md px-2 py-3 transition-colors ${
        isInteractive
          ? 'cursor-pointer hover:bg-[var(--theme-bg-tertiary)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-border-focus)]'
          : 'hover:bg-[var(--theme-bg-tertiary)]/25'
      } ${
        layout === 'stacked'
          ? 'sm:flex-col sm:items-stretch sm:justify-start'
          : 'sm:flex-row sm:items-center sm:justify-between'
      } ${disabled ? 'opacity-60' : ''} ${className || ''}`}
    >
      <div className={`flex min-w-0 items-start gap-3 ${layout === 'stacked' ? 'pr-0' : 'pr-4'}`}>
        {icon && (
          <div className={`mt-0.5 flex-shrink-0 ${labelClassName ? 'opacity-90' : 'text-[var(--theme-text-tertiary)]'}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {htmlFor && !isInteractive ? (
            <label
              htmlFor={htmlFor}
              className={`text-sm font-medium ${labelClassName || 'text-[var(--theme-text-primary)]'}`}
            >
              {label}
            </label>
          ) : (
            <p className={`text-sm font-medium ${labelClassName || 'text-[var(--theme-text-primary)]'}`}>{label}</p>
          )}
          {description && (
            <p
              className={`mt-0.5 text-xs leading-relaxed ${labelClassName ? 'opacity-75' : 'text-[var(--theme-text-tertiary)]'}`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      <div
        className={
          layout === 'stacked'
            ? 'flex w-full min-w-0 items-center gap-2 sm:ml-0 sm:w-full sm:justify-start'
            : 'flex w-full flex-shrink-0 items-center gap-2 sm:ml-4 sm:w-auto sm:justify-end'
        }
        onClick={isInteractive ? (event) => event.stopPropagation() : undefined}
      >
        {children}
      </div>
    </div>
  );
};

export const SegmentedControl = <T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  ariaLabel: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={`grid w-full grid-cols-[repeat(var(--segments),minmax(0,1fr))] gap-1 rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]/35 p-1 shadow-sm sm:w-auto ${className || ''}`}
    style={{ '--segments': options.length } as React.CSSProperties}
  >
    {options.map((option) => {
      const isActive = value === option.value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            if (!disabled && !isActive) {
              onChange(option.value);
            }
          }}
          disabled={disabled}
          aria-pressed={isActive}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)] focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50 ${
            isActive
              ? 'bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] shadow-sm ring-1 ring-black/5 dark:ring-white/10'
              : 'text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-bg-tertiary)]/60 hover:text-[var(--theme-text-primary)]'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

export const ProviderSummary: React.FC<{
  title: string;
  details: string;
  note?: string;
}> = ({ title, details, note }) => (
  <div className="rounded-md border border-[var(--theme-border-secondary)] bg-[var(--theme-bg-tertiary)]/25 p-4">
    <p className="text-sm font-semibold text-[var(--theme-text-primary)]">{title}</p>
    <p className="mt-1 break-all font-mono text-xs leading-relaxed text-[var(--theme-text-tertiary)]">{details}</p>
    {note && <p className="mt-3 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">{note}</p>}
  </div>
);

export const ConfirmDialog: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  isBusy?: boolean;
  isDanger?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}> = ({ title, message, confirmLabel, isBusy, isDanger, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-sm rounded-lg border border-[var(--theme-border-primary)] bg-[var(--theme-bg-primary)] p-5 text-[var(--theme-text-primary)] shadow-2xl">
      <h3 className="text-base font-semibold text-[var(--theme-text-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--theme-text-tertiary)]">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="rounded-md border border-[var(--theme-border-secondary)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-bg-tertiary)] hover:text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-border-focus)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isBusy}
          className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isDanger
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[var(--theme-bg-accent)] text-[var(--theme-text-accent)] hover:bg-[var(--theme-bg-accent-hover)]'
          }`}
        >
          {isBusy ? '处理中' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
