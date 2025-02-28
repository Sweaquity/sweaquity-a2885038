
import { useState, useEffect, useCallback } from "react";
import { setupCvStorageBucket } from "@/utils/setupStorage";

export const useBucketStatus = () => {
  const [bucketReady, setBucketReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStorage = useCallback(async () => {
    try {
      setIsChecking(true);
      const ready = await setupCvStorageBucket();
      setBucketReady(ready);
      if (!ready) {
        setStorageError("CV storage is not available. Please refresh bucket status or contact support.");
        console.log("CV storage bucket not ready");
      } else {
        setStorageError(null);
      }
      return ready;
    } catch (error) {
      console.error("Error checking storage:", error);
      setStorageError("Error checking CV storage availability.");
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  return {
    bucketReady,
    storageError,
    isChecking,
    checkStorage
  };
};
