import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <Header collapsed={sidebarCollapsed} />
      
      <motion.main
        initial={false}
        animate={{ 
          marginLeft: sidebarCollapsed ? 80 : 280,
          paddingTop: 80 
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </motion.main>
    </div>
  );
}
