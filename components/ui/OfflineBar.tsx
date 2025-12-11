// components/ui/OfflineBar.tsx

'use client';

import React, { useEffect, useState } from 'react';



export default function OfflineBar(): React.ReactElement | null {

  const [isOnline, setIsOnline] = useState<boolean>(() => {

    // default to navigator.onLine if window is available

    if (typeof window !== 'undefined' && 'navigator' in window) {

      return navigator.onLine;

    }

    return true;

  });



  useEffect(() => {

    if (typeof window === 'undefined') return;



    // update state only if it actually changed (prevents redundant setState)

    const update = () => {

      const currentlyOnline = navigator.onLine;

      setIsOnline(prev => (prev === currentlyOnline ? prev : currentlyOnline));

    };



    // set initial value once (in case SSR -> hydration mismatch)

    update();



    window.addEventListener('online', update);

    window.addEventListener('offline', update);



    return () => {

      window.removeEventListener('online', update);

      window.removeEventListener('offline', update);

    };

  }, []);



  if (isOnline) return null;



  // put your actual UI here — example:

  return (

    <div aria-live="polite" style={{

      width: '100%',

      textAlign: 'center',

      padding: '8px 12px',

      background: '#ffe9e6',

      color: '#7a0019',

      fontSize: 14,

      position: 'fixed',

      top: 0,

      zIndex: 9999

    }}>

      You're offline — some features may be disabled.

    </div>

  );

}
