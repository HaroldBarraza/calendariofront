import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persistir el estado de colapso en desktop
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const handleToggle = () => {
    // Desktop: alterna collapse. Móvil: abre drawer.
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Sidebar desktop colapsable */}
      <div
        className={`hidden transition-all duration-200 ease-in-out lg:block ${
          collapsed ? 'w-18' : 'w-66'
        }`}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Drawer móvil */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          onNavigate={() => setMobileOpen(false)}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={handleToggle} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-360">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}