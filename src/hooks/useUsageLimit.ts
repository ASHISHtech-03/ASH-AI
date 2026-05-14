import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface UsageData {
  isPremium: boolean;
  uploadCount: number;
  chatCount: number;
  lastRefillTime: number;
}

export const useUsageLimit = (userId: string | undefined) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        let currentUsage: UsageData = {
          isPremium: !!data.isPremium,
          uploadCount: data.uploadCount ?? 10,
          chatCount: data.chatCount ?? 10,
          lastRefillTime: data.lastRefillTime ? new Date(data.lastRefillTime).getTime() : Date.now()
        };

        // Refill logic
        if (!currentUsage.isPremium) {
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          const hoursPassed = Math.floor((now - currentUsage.lastRefillTime) / oneHour);

          if (hoursPassed > 0) {
            let updated = false;
            if (currentUsage.uploadCount < 10) {
              currentUsage.uploadCount = Math.min(10, currentUsage.uploadCount + hoursPassed);
              updated = true;
            }
            if (currentUsage.chatCount < 10) {
              currentUsage.chatCount = Math.min(10, currentUsage.chatCount + hoursPassed);
              updated = true;
            }

            if (updated) {
              currentUsage.lastRefillTime = now;
              await updateDoc(userRef, {
                uploadCount: currentUsage.uploadCount,
                chatCount: currentUsage.chatCount,
                lastRefillTime: new Date(now).toISOString()
              });
            }
          }
        }
        
        setUsage(currentUsage);
      } else {
        // Init new user usage
        const initial = {
          isPremium: false,
          uploadCount: 10,
          chatCount: 10,
          lastRefillTime: new Date().toISOString()
        };
        await setDoc(userRef, initial, { merge: true });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const decrementUpload = useCallback(async () => {
    if (!userId || !usage || usage.isPremium) return true;
    if (usage.uploadCount <= 0) return false;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      uploadCount: usage.uploadCount - 1
    });
    return true;
  }, [userId, usage]);

  const decrementChat = useCallback(async () => {
    if (!userId || !usage || usage.isPremium) return true;
    if (usage.chatCount <= 0) return false;

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      chatCount: usage.chatCount - 1
    });
    return true;
  }, [userId, usage]);

  return { usage, loading, decrementUpload, decrementChat };
};
