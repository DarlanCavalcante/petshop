import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { motion } from 'framer-motion';

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectPath', window.location.pathname);
      router.push('/login');
    }
    return null;
  }

  return <>{children}</>;
}
