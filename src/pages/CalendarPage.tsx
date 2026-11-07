import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import listPlugin from "@fullcalendar/react/list";
import interactionPlugin from "@fullcalendar/react/interaction";
import type { EventClickInfo, EventInput, CalendarRef } from '@fullcalendar/react';

// Estilos obligatorios para la v7
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

import { CalendarX, Clock } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { calendarService } from "../services/activities.service";
import { organizationsService } from "../services/organizations.service";
import { neighborhoodsService } from "../services/neighborhoods.service";
import { placesService } from "../services/places.service";
import type {
  Activity,
  ActivityStatus,
  Neighborhood,
  Organization,
  Place,
} from "../types/api";

const STATUS_COLOR: Record<ActivityStatus, string> = {
  PLANNED: "#3b82f6",
  CONFIRMED: "#10b981",
  COMPLETED: "#8b5cf6",
  CANCELLED: "#ef4444",
};

const STATUS_LABEL: Record<ActivityStatus, string> = {
  PLANNED: "Planificada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
};

export function CalendarPage() {
  // ✅ SOLUCIÓN 1: Tipar el ref correctamente con InstanceType
  const calendarRef = useRef<CalendarRef>(null);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const [filters, setFilters] = useState({
    organizationId: "",
    neighborhoodId: "",
    placeId: "",
    status: "",
  });

  const [scheduled, setScheduled] = useState<Activity[]>([]);
  const [unscheduled, setUnscheduled] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Activity | null>(null);

  useEffect(() => {
    organizationsService
      .list({ limit: 100, isActive: true })
      .then((r) => setOrgs(r.data));
    neighborhoodsService
      .list({ limit: 100, isActive: true })
      .then((r) => setNeighborhoods(r.data));
    placesService
      .list({ limit: 100, isActive: true })
      .then((r) => setPlaces(r.data));
  }, []);

  const fetchRange = useCallback(
    async (from: string, to: string) => {
      setLoading(true);
      try {
        const data = await calendarService.getRange({
          dateFrom: from,
          dateTo: to,
          organizationId: filters.organizationId || undefined,
          neighborhoodId: filters.neighborhoodId || undefined,
          placeId: filters.placeId || undefined,
          status: filters.status || undefined,
        });
        setScheduled(data.scheduled);
        setUnscheduled(data.unscheduled);
      } catch {
        setScheduled([]);
        setUnscheduled([]);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const events: EventInput[] = useMemo(
    () =>
      scheduled.map((a) => ({
        id: a.id,
        title: a.name,
        start: `${a.activityDate.slice(0, 10)}T${a.startTime?.slice(11, 16) ?? "00:00"}:00`,
        backgroundColor: STATUS_COLOR[a.status],
        borderColor: STATUS_COLOR[a.status],
        extendedProps: { activity: a },
      })),
    [scheduled],
  );

  const handleDatesSet = (arg: { startStr: string; endStr: string }) => {
    void fetchRange(arg.startStr.slice(0, 10), arg.endStr.slice(0, 10));
  };

  const handleEventClick = (info: EventClickInfo) => {
    const activity = info.event.extendedProps.activity as Activity;
    setSelected(activity);
  };

  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      void fetchRange(
        api.view.activeStart.toISOString().slice(0, 10),
        api.view.activeEnd.toISOString().slice(0, 10),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario 2027"
        description="Vista anual, mensual, semanal y diaria de las actividades"
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={filters.organizationId}
          onChange={(e) =>
            setFilters({ ...filters, organizationId: e.target.value })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todas las organizaciones</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          value={filters.neighborhoodId}
          onChange={(e) =>
            setFilters({ ...filters, neighborhoodId: e.target.value })
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los barrios</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <select
          value={filters.placeId}
          onChange={(e) => setFilters({ ...filters, placeId: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los lugares</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PLANNED">Planificadas</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="COMPLETED">Realizadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
        {loading && (
          <span className="self-center text-xs text-slate-500">Cargando…</span>
        )}
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            classicThemePlugin,
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView="dayGridMonth"
          initialDate="2027-01-01"
          validRange={{ start: "2027-01-01", end: "2028-01-01" }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
          }}
          // ✅ SOLUCIÓN 2: Usar la propiedad 'buttons' en lugar de 'buttonText'
          buttons={{
            today: { text: "Hoy" },
            dayGridMonth: { text: "Mes" },
            timeGridWeek: { text: "Semana" },
            timeGridDay: { text: "Día" },
            listMonth: { text: "Lista" },
          }}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          locale="es"
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2">
          <CalendarX className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            Actividades sin horario definido ({unscheduled.length})
          </h2>
        </div>
        {unscheduled.length === 0 ? (
          <p className="text-xs text-slate-500">
            No hay actividades sin horario en el rango visible.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {unscheduled.map((a) => (
              <li
                key={a.id}
                className="flex cursor-pointer items-center justify-between py-2 hover:bg-slate-50"
                onClick={() => setSelected(a)}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.activityDate.slice(0, 10)} · {a.place.name}
                  </p>
                </div>
                <Badge variant="yellow">Sin hora</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Cerrar
          </Button>
        }
      >
        {selected && (
          <div className="space-y-2 text-sm">
            <p className="text-slate-600">
              {selected.description || "Sin descripción."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Info label="Fecha" value={selected.activityDate.slice(0, 10)} />
              <Info
                label="Hora"
                value={
                  selected.timeDefined && selected.startTime ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selected.startTime.slice(11, 16)}
                    </span>
                  ) : (
                    "Sin definir"
                  )
                }
              />
              <Info label="Estado" value={STATUS_LABEL[selected.status]} />
              <Info label="Organización" value={selected.organization.name} />
              <Info label="Barrio" value={selected.neighborhood.name} />
              <Info
                label="Lugar"
                value={`${selected.place.name} — ${selected.place.address}`}
              />
            </div>
            {selected.observations && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Observaciones
                </p>
                <p className="text-sm text-slate-700">
                  {selected.observations}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}
