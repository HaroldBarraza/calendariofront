import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useDebounce } from '../components/ui/useDebounce';
import { useAuthStore } from '../stores/auth.store';
import {
  activitiesService,
  type ActivityInput,
} from '../services/activities.service';
import { organizationsService } from '../services/organizations.service';
import { neighborhoodsService } from '../services/neighborhoods.service';
import { placesService } from '../services/places.service';
import { activitySchema, type ActivityFormData } from '../schemas/activity.schema';
import { cn } from '../lib/utils';
import type {
  Activity,
  ActivityStatus,
  Conflict,
  Neighborhood,
  Organization,
  Place,
} from '../types/api';

// ─────────────────────────────────────────────
// Constantes visuales
// ─────────────────────────────────────────────

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const PLANNING_YEAR = 2027;

const STATUS: Record<
  ActivityStatus,
  { label: string; dot: string; pill: string; border: string }
> = {
  PLANNED: {
    label: 'Planificada',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-700 ring-blue-200',
    border: 'border-blue-500',
  },
  CONFIRMED: {
    label: 'Confirmada',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    border: 'border-emerald-500',
  },
  COMPLETED: {
    label: 'Realizada',
    dot: 'bg-purple-500',
    pill: 'bg-purple-50 text-purple-700 ring-purple-200',
    border: 'border-purple-500',
  },
  CANCELLED: {
    label: 'Cancelada',
    dot: 'bg-red-500',
    pill: 'bg-red-50 text-red-700 ring-red-200',
    border: 'border-red-500',
  },
};

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

interface Cell {
  date: Date;
  key: string;
  inMonth: boolean;
}

function buildGrid(year: number, month: number): Cell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startWeekday = (first.getUTCDay() + 6) % 7;
  const cells: Cell[] = [];

  const prevLast = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 2, prevLast - i));
    cells.push({ date: d, key: d.toISOString().slice(0, 10), inMonth: false });
  }
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    cells.push({ date, key: date.toISOString().slice(0, 10), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last.getTime() + 86400000);
    cells.push({ date: next, key: next.toISOString().slice(0, 10), inMonth: false });
  }
  return cells;
}

function formatLongDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][
    date.getUTCDay()
  ];
  return `${weekday}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────

export function ActivitiesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = role === 'ADMIN' || role === 'PLANNER';

  const today = new Date();
  const initialMonth =
    today.getUTCFullYear() === PLANNING_YEAR
      ? { year: PLANNING_YEAR, month: today.getUTCMonth() + 1 }
      : { year: PLANNING_YEAR, month: 1 };
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const [byDate, setByDate] = useState<Map<string, Activity[]>>(new Map());
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    organizationsService.list({ limit: 100, isActive: true }).then((r) => setOrgs(r.data));
    neighborhoodsService.list({ limit: 100, isActive: true }).then((r) =>
      setNeighborhoods(r.data),
    );
    placesService.list({ limit: 100, isActive: true }).then((r) => setPlaces(r.data));
  }, []);

  const fetchMonth = useCallback(async () => {
    const mm = String(currentMonth.month).padStart(2, '0');
    const from = `${currentMonth.year}-${mm}-01`;
    const lastDay = new Date(Date.UTC(currentMonth.year, currentMonth.month, 0)).getUTCDate();
    const to = `${currentMonth.year}-${mm}-${String(lastDay).padStart(2, '0')}`;

    setLoading(true);
    try {
      const all: Activity[] = [];
      let page = 1;
      let more = true;
      while (more) {
        const res = await activitiesService.list({
          dateFrom: from,
          dateTo: to,
          includeDeleted: true,
          page,
          limit: 100,
        });
        all.push(...res.data);
        more = page < res.totalPages;
        page++;
      }
      const map = new Map<string, Activity[]>();
      for (const a of all) {
        const key = a.activityDate.slice(0, 10);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(a);
      }
      map.forEach((list) =>
        list.sort((a, b) => {
          if (a.timeDefined !== b.timeDefined) return a.timeDefined ? -1 : 1;
          return (a.startTime ?? '').localeCompare(b.startTime ?? '');
        }),
      );
      setByDate(map);
    } catch {
      setByDate(new Map());
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    void fetchMonth();
  }, [fetchMonth]);

  const cells = useMemo(
    () => buildGrid(currentMonth.year, currentMonth.month),
    [currentMonth],
  );

  const filtered = useMemo(() => {
    if (!debouncedSearch && !statusFilter && !orgFilter) return byDate;
    const out = new Map<string, Activity[]>();
    byDate.forEach((list, key) => {
      const f = list.filter((a) => {
        if (statusFilter && a.status !== statusFilter) return false;
        if (orgFilter && a.organizationId !== orgFilter) return false;
        if (debouncedSearch && !a.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
          return false;
        return true;
      });
      if (f.length) out.set(key, f);
    });
    return out;
  }, [byDate, debouncedSearch, statusFilter, orgFilter]);

  const monthTotal = useMemo(() => {
    let n = 0;
    filtered.forEach((l) => (n += l.length));
    return n;
  }, [filtered]);

  // Modales
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Activity | null>(null);
  const [confirmKind, setConfirmKind] = useState<'delete' | 'restore' | null>(null);
  const [acting, setActing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ActivityFormData>({ resolver: zodResolver(activitySchema) });

  const timeDefined = watch('timeDefined');
  const orgId = watch('organizationId');
  const placeId = watch('placeId');
  const currentOrg = useMemo(() => orgs.find((o) => o.id === orgId), [orgs, orgId]);
  const currentPlace = useMemo(() => places.find((p) => p.id === placeId), [places, placeId]);

  // Navegación
  const goPrev = () =>
    setCurrentMonth(({ year, month }) => ({ year, month: month === 1 ? 12 : month - 1 }));
  const goNext = () =>
    setCurrentMonth(({ year, month }) => ({ year, month: month === 12 ? 1 : month + 1 }));
  const goToday = () =>
    setCurrentMonth(
      today.getUTCFullYear() === PLANNING_YEAR
        ? { year: PLANNING_YEAR, month: today.getUTCMonth() + 1 }
        : { year: PLANNING_YEAR, month: 1 },
    );

  // Formulario
  const openCreate = (prefill?: string) => {
    setEditing(null);
    reset({
      name: '',
      description: '',
      activityDate:
        prefill ??
        `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`,
      timeDefined: true,
      startTime: '09:00',
      status: 'PLANNED',
      observations: '',
      placeId: '',
      organizationId: '',
      neighborhoodId: '',
    });
    setConflicts(null);
    setFormOpen(true);
  };

  const openEdit = (a: Activity) => {
    setEditing(a);
    reset({
      name: a.name,
      description: a.description ?? '',
      activityDate: a.activityDate.slice(0, 10),
      timeDefined: a.timeDefined,
      startTime: a.startTime ? a.startTime.slice(11, 16) : '',
      status: a.status,
      observations: a.observations ?? '',
      placeId: a.placeId,
      organizationId: a.organizationId,
      neighborhoodId: a.neighborhoodId,
    });
    setConflicts(null);
    setSelected(null);
    setFormOpen(true);
  };

  const onSubmit = async (values: ActivityFormData) => {
    if (
      values.timeDefined &&
      values.startTime &&
      values.placeId &&
      values.organizationId &&
      !conflicts
    ) {
      try {
        const r = await activitiesService.checkConflicts({
          activityDate: values.activityDate,
          timeDefined: values.timeDefined,
          startTime: values.startTime,
          placeId: values.placeId,
          organizationId: values.organizationId,
          excludeId: editing?.id,
        });
        if (r.hasConflicts) {
          setConflicts(r.conflicts);
          return;
        }
      } catch {}
    }

    setSaving(true);
    try {
      const payload: ActivityInput = {
        name: values.name,
        description: values.description || undefined,
        activityDate: values.activityDate,
        timeDefined: values.timeDefined,
        startTime: values.timeDefined ? values.startTime : undefined,
        status: values.status,
        observations: values.observations || undefined,
        placeId: values.placeId,
        organizationId: values.organizationId,
        neighborhoodId: values.neighborhoodId,
        force: Boolean(conflicts),
      };
      if (editing) {
        await activitiesService.update(editing.id, payload);
        toast.success('Actividad actualizada');
      } else {
        await activitiesService.create(payload);
        toast.success('Actividad creada');
      }
      setFormOpen(false);
      setConflicts(null);
      await fetchMonth();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'No se pudo guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = async () => {
    if (!confirmTarget || !confirmKind) return;
    setActing(true);
    try {
      if (confirmKind === 'delete') {
        await activitiesService.softDelete(confirmTarget.id);
        toast.success('Actividad eliminada');
      } else {
        await activitiesService.restore(confirmTarget.id);
        toast.success('Actividad restaurada');
      }
      setConfirmTarget(null);
      setConfirmKind(null);
      setSelected(null);
      await fetchMonth();
    } catch {
      toast.error('No se pudo completar la acción');
    } finally {
      setActing(false);
    }
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Planeación anual</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Actividades
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {monthTotal} actividad(es) en {MONTHS[currentMonth.month - 1]} {currentMonth.year}
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => openCreate()}
            icon={<Plus className="h-4 w-4" />}
          >
            Nueva actividad
          </Button>
        )}
      </div>

      {/* Barra navegación + filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-32.5 text-center text-sm font-bold text-slate-900">
            {MONTHS[currentMonth.month - 1]} {currentMonth.year}
          </h2>
          <button
            onClick={goNext}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Hoy
          </button>
        </div>
        <div className="flex flex-1 flex-wrap gap-2 xl:justify-end">
          <div className="relative min-w-45 flex-1 xl:max-w-55">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar actividad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todos los estados</option>
            <option value="PLANNED">Planificadas</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="COMPLETED">Realizadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todas las organizaciones</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Estados
        </span>
        {Object.values(STATUS).map((s) => (
          <span
            key={s.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1',
              s.pill,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            {s.label}
          </span>
        ))}
        {loading && <span className="ml-auto text-xs text-slate-400">Cargando…</span>}
      </div>

      {/* Cuadrícula */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider',
                i > 4 ? 'text-blue-500' : 'text-slate-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        <div className={cn('grid grid-cols-7', loading && 'opacity-60')}>
          {cells.map((cell) => {
            const list = filtered.get(cell.key) ?? [];
            const isToday = cell.key === todayKey;
            return (
              <button
                key={cell.key}
                onClick={() => setDayKey(cell.key)}
                className={cn(
                  'group relative min-h-25 border-b border-r border-slate-100 p-2 text-left transition hover:bg-slate-50/80 sm:min-h-30.5',
                  !cell.inMonth && 'bg-slate-50/40',
                  isToday && 'bg-blue-50/30 ring-2 ring-inset ring-blue-500',
                )}
              >
                <div
                  className={cn(
                    'mb-2 flex justify-end',
                    !cell.inMonth && 'opacity-40',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-full text-xs font-semibold',
                      isToday
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-500 group-hover:bg-white',
                    )}
                  >
                    {cell.date.getUTCDate()}
                  </span>
                </div>

                {/* Desktop: chips */}
                <div className="hidden space-y-1 sm:block">
                  {list.slice(0, 2).map((a) => (
                    <span
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(a);
                      }}
                      title={`${a.timeDefined && a.startTime ? a.startTime.slice(11, 16) + ' · ' : ''}${a.name}`}
                      className="flex cursor-pointer items-center gap-1.5 truncate rounded-full border border-transparent bg-slate-50 px-2 py-1 text-left text-[10px] font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                    >
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS[a.status].dot)} />
                      <span className="truncate">
                        {a.timeDefined && a.startTime ? `${a.startTime.slice(11, 16)} · ` : ''}
                        {a.name}
                      </span>
                    </span>
                  ))}
                  {list.length > 2 && (
                    <span className="block px-2 text-[10px] font-semibold text-slate-400">
                      +{list.length - 2} más
                    </span>
                  )}
                </div>

                {/* Móvil: dots */}
                <div className="flex flex-wrap justify-end gap-1 sm:hidden">
                  {list.slice(0, 4).map((a) => (
                    <span
                      key={a.id}
                      className={cn('h-2 w-2 rounded-full', STATUS[a.status].dot)}
                    />
                  ))}
                  {list.length > 4 && (
                    <span className="text-[9px] font-bold text-slate-400">+</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal del día */}
      {dayKey && (
        <Modal onClose={() => setDayKey(null)}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Agenda del día
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                {formatLongDate(dayKey)}
              </h2>
            </div>
            <button
              onClick={() => setDayKey(null)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {(filtered.get(dayKey) ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">
                Sin actividades registradas para este día.
              </p>
            ) : (
              (filtered.get(dayKey) ?? []).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setDayKey(null);
                    setSelected(a);
                  }}
                  className={cn(
                    'w-full rounded-xl border border-slate-200 border-l-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md',
                    STATUS[a.status].border,
                    a.deletedAt && 'opacity-60',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-sm font-bold text-slate-900',
                          a.deletedAt && 'line-through',
                        )}
                      >
                        {a.name}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        {a.timeDefined && a.startTime ? (
                          <>
                            <Clock3 className="h-3.5 w-3.5" />
                            {a.startTime.slice(11, 16)}
                          </>
                        ) : (
                          <>
                            <CalendarX className="h-3.5 w-3.5 text-amber-500" />
                            Sin hora
                          </>
                        )}
                        <span className="text-slate-300">•</span>
                        <MapPin className="h-3.5 w-3.5" />
                        {a.place.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1',
                        STATUS[a.status].pill,
                      )}
                    >
                      {STATUS[a.status].label}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {canWrite && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => {
                  openCreate(dayKey);
                  setDayKey(null);
                }}
                size="sm"
                icon={<Plus className="h-4 w-4" />}
              >
                Nueva actividad este día
              </Button>
            </div>
          )}
        </Modal>
      )}

      {/* Modal de detalle */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', STATUS[selected.status].dot)} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Detalle de actividad
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {selected.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                    STATUS[selected.status].pill,
                  )}
                >
                  {STATUS[selected.status].label}
                </span>
                {selected.timeDefined && selected.startTime ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {selected.startTime.slice(11, 16)} hrs
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Sin hora definida
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {selected.deletedAt && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700 ring-1 ring-red-200">
              Esta actividad está eliminada. Puedes restaurarla.
            </div>
          )}

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Meta
              icon={CalendarDays}
              label="Fecha"
              value={formatLongDate(selected.activityDate.slice(0, 10))}
            />
            <Meta icon={MapPin} label="Lugar" value={`${selected.place.name} — ${selected.place.address}`} />
            <Meta icon={Building2} label="Organización" value={selected.organization.name} />
            <Meta icon={MapPin} label="Barrio" value={selected.neighborhood.name} />
          </div>

          {selected.description && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Descripción
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.description}</p>
            </div>
          )}

          {selected.observations && (
            <div className="mt-3 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Observaciones
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.observations}</p>
            </div>
          )}

          {canWrite && (
            <div className="mt-6 flex justify-end gap-3">
              {selected.deletedAt ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmTarget(selected);
                    setConfirmKind('restore');
                  }}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  Restaurar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => openEdit(selected)}
                    icon={<Pencil className="h-4 w-4" />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirmTarget(selected);
                      setConfirmKind('delete');
                    }}
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Modal formulario */}
      {formOpen && (
        <Modal onClose={() => { setFormOpen(false); setConflicts(null); }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {editing ? 'Editar actividad' : 'Nueva actividad'}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                {editing ? 'Modifica los datos' : 'Registra una actividad'}
              </h2>
            </div>
            <button
              onClick={() => { setFormOpen(false); setConflicts(null); }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form className="mt-6 space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <Input label="Nombre *" id="name" {...register('name')} error={errors.name?.message} />
            <Textarea label="Descripción" id="description" rows={2} {...register('description')} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Fecha *"
                id="activityDate"
                type="date"
                min={`${PLANNING_YEAR}-01-01`}
                max={`${PLANNING_YEAR}-12-31`}
                {...register('activityDate')}
                error={errors.activityDate?.message}
              />
              <Select label="Estado *" id="status" {...register('status')} error={errors.status?.message}>
                <option value="PLANNED">Planificada</option>
                <option value="CONFIRMED">Confirmada</option>
                <option value="COMPLETED">Realizada</option>
                <option value="CANCELLED">Cancelada</option>
              </Select>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                id="timeDefined"
                {...register('timeDefined')}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="timeDefined" className="text-sm text-slate-700">
                La actividad tiene hora definida
              </label>
            </div>

            {timeDefined && (
              <Input
                label="Hora de inicio *"
                id="startTime"
                type="time"
                {...register('startTime')}
                error={errors.startTime?.message}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Organización *" id="organizationId" {...register('organizationId')} error={errors.organizationId?.message}>
                <option value="">Selecciona…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                {currentOrg && !orgs.find((o) => o.id === currentOrg.id) && (
                  <option value={currentOrg.id}>{currentOrg.name}</option>
                )}
              </Select>
              <Select label="Barrio *" id="neighborhoodId" {...register('neighborhoodId')} error={errors.neighborhoodId?.message}>
                <option value="">Selecciona…</option>
                {neighborhoods.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </Select>
            </div>

            <Select label="Lugar *" id="placeId" {...register('placeId')} error={errors.placeId?.message}>
              <option value="">Selecciona…</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}
              {currentPlace && !places.find((p) => p.id === currentPlace.id) && (
                <option value={currentPlace.id}>{currentPlace.name} — {currentPlace.address}</option>
              )}
            </Select>

            <Textarea label="Observaciones" id="observations" rows={2} {...register('observations')} />

            {conflicts && conflicts.length > 0 && (
              <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                  Se detectaron conflictos
                </p>
                <ul className="mt-2 space-y-1">
                  {conflicts.map((c) => (
                    <li key={c.activityId} className="text-xs text-amber-800">
                      <span
                        className={cn(
                          'mr-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
                          c.level === 'HIGH'
                            ? 'bg-red-50 text-red-700 ring-red-200'
                            : 'bg-amber-50 text-amber-700 ring-amber-200',
                        )}
                      >
                        {c.level === 'HIGH' ? 'Alto' : 'Advertencia'}
                      </span>
                      {c.reason}: <strong>{c.activityName}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => { setFormOpen(false); setConflicts(null); }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                {conflicts ? 'Guardar de todas formas' : editing ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget && confirmKind)}
        title={confirmKind === 'delete' ? 'Eliminar actividad' : 'Restaurar actividad'}
        message={
          confirmKind === 'delete'
            ? `¿Eliminar "${confirmTarget?.name}"? Podrás restaurarla después.`
            : `¿Restaurar "${confirmTarget?.name}"?`
        }
        confirmLabel={confirmKind === 'delete' ? 'Eliminar' : 'Restaurar'}
        variant={confirmKind === 'delete' ? 'danger' : 'primary'}
        loading={acting}
        onConfirm={confirmAction}
        onCancel={() => { setConfirmTarget(null); setConfirmKind(null); }}
      />
    </section>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}