import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Building2,
  MapPin,
  Map,
  Users,
  FileText,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { cn } from '../../lib/utils';
import type { Role } from '../../types/api';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/activities', label: 'Actividades', icon: ClipboardList },
  { to: '/organizations', label: 'Organizaciones', icon: Building2 },
  { to: '/neighborhoods', label: 'Barrios', icon: Map },
  { to: '/places', label: 'Lugares', icon: MapPin },
  { to: '/users', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
  { to: '/reports', label: 'Reportes', icon: FileText },
];

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed = false, onNavigate, onClose }: SidebarProps) {
  const role = useAuthStore((s) => s.user?.role);
  const visible = ITEMS.filter((i) => !i.roles || (role && i.roles.includes(role)));

  // Estado local de hover (solo aplica cuando collapsed=true)
  const [hovered, setHovered] = useState(false);
  const expanded = !collapsed || hovered;
  const floating = collapsed && hovered;

  return (
    <aside
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white py-5 transition-all duration-200 ease-in-out',
        expanded ? 'w-[264px] px-4' : 'w-[72px] px-2',
        floating && 'absolute inset-y-0 left-0 z-30 shadow-2xl shadow-slate-900/10',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center',
          expanded ? 'justify-between px-2' : 'justify-center',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          {expanded && (
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-950">
                Planifica<span className="text-blue-600">.app</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Gestión 2027
              </p>
            </div>
          )}
        </div>
        {onClose && expanded && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Sección Workspace */}
      <div
        className={cn(
          'mt-10',
          expanded
            ? 'px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400'
            : 'h-3',
        )}
      >
        {expanded && 'Workspace'}
      </div>

      {/* Navegación */}
      <nav
        className={cn(
          'mt-3 space-y-1',
          !expanded && 'flex flex-col items-center',
        )}
      >
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={!expanded ? label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center rounded-xl font-medium transition-all',
                expanded
                  ? 'w-full gap-3 px-3 py-2.5 text-left text-sm'
                  : 'h-11 w-11 justify-center',
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
                {expanded && (
                  <>
                    {label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </>
                )}
                {!expanded && isActive && (
                  <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'mt-auto border-t border-slate-100 pt-4',
          !expanded && 'flex justify-center',
        )}
      >
        {expanded ? (
          <p className="text-[10px] text-slate-400">Estaca Bellavista 2027</p>
        ) : (
          <div
            className="h-2 w-2 rounded-full bg-slate-200"
            title="Planifica.app v1.0"
          />
        )}
      </div>
    </aside>
  );
}