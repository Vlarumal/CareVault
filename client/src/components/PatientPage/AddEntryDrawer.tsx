import React, { useEffect, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useTheme } from '@mui/material/styles';
import './AddEntryDrawer.css';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface AddEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const AddEntryDrawer: React.FC<AddEntryDrawerProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const theme = useTheme();
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      <CSSTransition
        in={isOpen}
        timeout={200}
        classNames='backdrop'
        unmountOnExit
        nodeRef={backdropRef}
      >
        <div
          className='drawer-backdrop'
          onClick={onClose}
          aria-hidden='true'
          ref={backdropRef}
        />
      </CSSTransition>
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames='drawer'
        unmountOnExit
        nodeRef={drawerRef}
      >
        <div
          className='drawer'
          tabIndex={-1}
          role='dialog'
          aria-modal='true'
          aria-label='Add entry'
          ref={drawerRef}
          style={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <IconButton
            className='drawer-close'
            onClick={onClose}
            aria-label='Close drawer'
            sx={{
              justifyContent: 'flex-end',
              color: theme.palette.text.secondary,
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: theme.palette.primary.main,
                outlineOffset: 2,
              },
            }}
          >
            <Close />
          </IconButton>
          <div
            className='drawer-content'
            style={{ color: theme.palette.text.primary }}
          >
            {children}
          </div>
        </div>
      </CSSTransition>
    </>
  );
};

export default AddEntryDrawer;
