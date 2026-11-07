import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  MapPin,
  Map,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { dashboardService, type DashboardFilters } from '../services/dashboard.service';
import { organizationsService } from '../services/organizations.service';
import { neighborhoodsService } from '../services/neighborhoods.service';
import { placesService } from '../services/places.service';
import type {
  DashboardCharts,
  DashboardSummary,
  Neighborhood,
  Organization,
  Place,
} from '../types/api';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#3b82f6',
  CONFIRMED: '#10b981',
  COMPLETED: '#8b5cf6',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planificadas',
  CONFIRMED: 'Confirmadas',
  COMPLETED: 'Realizadas',
  CANCELLED: 'Canceladas',
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [filters, setFilters] = useState<DashboardFilters>({});

  useEffect(() => {
    organizationsService.list({ limit: 100, isActive: true }).then((r) => setOrgs(r.data));
    neighborhoodsService.list({ limit: 100, isActive: true }).then((r) => setNeighborhoods(r.data));
    placesService.list({ limit: 100, isActive: true }).then((r) => setPlaces(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([dashboardService.summary(filters), dashboardService.charts(filters)])
      .then(([s, c]) => {
        setSummary(s);
        setCharts(c);
      })
      .catch(() => {
        setSummary(null);
        setCharts(null);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const clearFilters = () => setFilters({});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Resumen estadístico de la planificación 2027"
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.organizationId ?? ''}
          onChange={(e) => setFilters({ ...filters, organizationId: e.target.value || undefined })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todas las organizaciones</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <select
          value={filters.neighborhoodId ?? ''}
          onChange={(e) => setFilters({ ...filters, neighborhoodId: e.target.value || undefined })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los barrios</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
        <select
          value={filters.placeId ?? ''}
          onChange={(e) => setFilters({ ...filters, placeId: e.target.value || undefined })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los lugares</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PLANNED">Planificadas</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="COMPLETED">Realizadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
        <select
          value={filters.month ?? ''}
          onChange={(e) =>
            setFilters({ ...filters, month: e.target.value ? Number(e.target.value) : undefined })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los meses</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={filters.timeDefined === undefined ? '' : String(filters.timeDefined)}
          onChange={(e) =>
            setFilters({
              ...filters,
              timeDefined: e.target.value === '' ? undefined : e.target.value === 'true',
            })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Toda modalidad</option>
          <option value="true">Con horario</option>
          <option value="false">Sin horario</option>
        </select>
        <button
          onClick={clearFilters}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Limpiar filtros
        </button>
      </div>

      {loading || !summary || !charts ? (
        <p className="text-sm text-slate-500">Cargando métricas…</p>
      ) : (
        <>
          {/* Tarjetas de actividades */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              label="Total actividades"
              value={summary.activities.total}
              icon={<ClipboardList className="h-4 w-4" />}
              tone="brand"
            />
            <StatCard
              label="Planificadas"
              value={summary.activities.planned}
              icon={<CalendarClock className="h-4 w-4" />}
              tone="blue"
            />
            <StatCard
              label="Confirmadas"
              value={summary.activities.confirmed}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="green"
            />
            <StatCard
              label="Realizadas"
              value={summary.activities.completed}
              icon={<CalendarCheck className="h-4 w-4" />}
              tone="purple"
            />
            <StatCard
              label="Canceladas"
              value={summary.activities.cancelled}
              icon={<XCircle className="h-4 w-4" />}
              tone="red"
            />
            <StatCard
              label="Con horario"
              value={summary.activities.withTime}
              icon={<CalendarCheck className="h-4 w-4" />}
              tone="green"
            />
            <StatCard
              label="Sin horario"
              value={summary.activities.withoutTime}
              icon={<CalendarX className="h-4 w-4" />}
              tone="yellow"
            />
            <StatCard
              label="Organizaciones"
              value={summary.catalogs.organizations}
              icon={<Building2 className="h-4 w-4" />}
              tone="brand"
            />
            <StatCard
              label="Barrios"
              value={summary.catalogs.neighborhoods}
              icon={<Map className="h-4 w-4" />}
              tone="blue"
            />
            <StatCard
              label="Lugares"
              value={summary.catalogs.places}
              icon={<MapPin className="h-4 w-4" />}
              tone="purple"
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Actividades por mes">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={charts.byMonth.map((count, i) => ({
                    mes: MONTHS[i].slice(0, 3),
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Actividades por estado">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.byStatus.map((s) => ({
                      name: STATUS_LABELS[s.status],
                      value: s.count,
                      status: s.status,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {charts.byStatus.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Actividades por organización">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.byOrganization.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Actividades por barrio">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.byNeighborhood.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Actividades por lugar">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.byPlace.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Modalidad de horario">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.byTimeDefined.map((t) => ({
                      name: t.label,
                      value: t.count,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

type Tone = 'brand' | 'blue' | 'green' | 'purple' | 'red' | 'yellow';

const TONE_STYLES: Record<Tone, string> = {
  brand: 'bg-blue-50 text-blue-700',
  blue: 'bg-sky-50 text-sky-700',
  green: 'bg-emerald-50 text-emerald-700',
  purple: 'bg-purple-50 text-purple-700',
  red: 'bg-red-50 text-red-700',
  yellow: 'bg-amber-50 text-amber-700',
};

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-md p-1.5 ${TONE_STYLES[tone]}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}