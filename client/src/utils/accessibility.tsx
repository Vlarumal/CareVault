import { useEffect, useRef } from 'react';

// Simple focus management utilities
export const useFocusTrap = (isOpen: boolean) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && ref.current) {
      ref.current.focus();
    }
  }, [isOpen]);

  return ref;
};

// ARIA utilities
export const ariaLabel = (label: string) => `aria-label="${label}"`;
export const ariaHidden = (isHidden: boolean) => `aria-hidden="${isHidden}"`;
export const role = (roleName: string) => `role="${roleName}"`;

// Keyboard event utilities
export const handleKeyDown = (event: React.KeyboardEvent, callback: (key: string) => void) => {
  const { key } = event;
  callback(key);
};

// Accessible dialog example
export const AccessibleDialog = ({
  isOpen,
  onClose,
  children,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) => {
  const dialogRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '20px',
        border: '1px solid #ccc',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      <h2 id="dialog-title">{title}</h2>
      <div id="dialog-description">{children}</div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};