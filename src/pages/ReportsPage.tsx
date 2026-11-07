import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { api } from '../services/axios';
import { organizationsService } from '../services/organizations.service';
import { neighborhoodsService } from '../services/neighborhoods.service';
import { placesService } from '../services/places.service';
import type { Neighborhood, Organization, Place } from '../types/api';

export function ReportsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [downloading, setDownloading] = useState(false);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    organizationId: '',
    neighborhoodId: '',
    placeId: '',
    status: '',
    timeDefined: '',
  });

  useEffect(() => {
    organizationsService.list({ limit: 100, isActive: true }).then((r) => setOrgs(r.data));
    neighborhoodsService.list({ limit: 100, isActive: true }).then((r) => setNeighborhoods(r.data));
    placesService.list({ limit: 100, isActive: true }).then((r) => setPlaces(r.data));
  }, []);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.organizationId) params.organizationId = filters.organizationId;
      if (filters.neighborhoodId) params.neighborhoodId = filters.neighborhoodId;
      if (filters.placeId) params.placeId = filters.placeId;
      if (filters.status) params.status = filters.status;
      if (filters.timeDefined) params.timeDefined = filters.timeDefined;

      const response = await api.get('/reports/activities.pdf', {
        params,
        responseType: 'blob',
      });

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-actividades-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Reporte descargado');
    } catch {
      toast.error('No se pudo generar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reportes"
        description="Genera reportes PDF de actividades con filtros"
      />

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Filtros del reporte
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
            <input
              type="date"
              min="2027-01-01"
              max="2027-12-31"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
            <input
              type="date"
              min="2027-01-01"
              max="2027-12-31"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Organización</label>
            <select
              value={filters.organizationId}
              onChange={(e) => setFilters({ ...filters, organizationId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Barrio</label>
            <select
              value={filters.neighborhoodId}
              onChange={(e) => setFilters({ ...filters, neighborhoodId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lugar</label>
            <select
              value={filters.placeId}
              onChange={(e) => setFilters({ ...filters, placeId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {places.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="PLANNED">Planificadas</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="COMPLETED">Realizadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Modalidad</label>
            <select
              value={filters.timeDefined}
              onChange={(e) => setFilters({ ...filters, timeDefined: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="true">Con horario</option>
              <option value="false">Sin horario</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={downloadPdf}
            loading={downloading}
            icon={<Download className="h-4 w-4" />}
          >
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800 ring-1 ring-blue-200">
        <p className="font-medium">Sobre el reporte</p>
        <p className="mt-1 text-xs text-blue-700">
          El PDF incluye encabezado, fecha de generación, filtros aplicados, tabla completa de
          actividades y resumen estadístico. Si no especificas fechas, incluye todo el año 2027.
        </p>
      </div>
    </div>
  );
}