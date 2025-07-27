import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { AuthModal } from '../auth/AuthModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onAuthClick={() => setIsAuthModalOpen(true)}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};