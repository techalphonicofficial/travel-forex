'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '12px',
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          fontWeight: '500',
        },
      }}
    />
  );
}
