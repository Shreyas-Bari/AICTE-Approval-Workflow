import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Shell } from '../components/layout/Shell';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <Header />
      <Shell>
        <Outlet />
      </Shell>
      <Footer />
    </div>
  );
};
