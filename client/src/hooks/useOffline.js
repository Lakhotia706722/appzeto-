import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You're offline — changes will sync when reconnected", {
        id: 'offline-toast',
        duration: Infinity,
      });
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.dismiss('offline-toast');
      toast.success('Back online');
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return isOffline;
};
