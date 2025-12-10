import { useState, useEffect } from 'react';
import { onAuthStateChange } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get additional user data from Firestore
        try {
          const { getCurrentUserData } = await import('../services/auth');
          const result = await getCurrentUserData(firebaseUser.uid);
          if (result.success) {
            setUserData(result.userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
};