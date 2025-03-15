
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface BusinessContextType {
  business: any | null;
  isLoading: boolean;
  error: string | null;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [business, setBusiness] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBusiness = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('businesses_id', session.user.id)
        .maybeSingle();

      if (error) throw error;
      setBusiness(data);
    } catch (error: any) {
      console.error('Error loading business:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusiness();
  }, []);

  return (
    <BusinessContext.Provider value={{ 
      business, 
      isLoading, 
      error,
      refreshBusiness: loadBusiness 
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusinessContext = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return context;
};
