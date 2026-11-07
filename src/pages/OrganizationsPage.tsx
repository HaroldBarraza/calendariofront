import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, PowerOff } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import { useDebounce } from '../components/ui/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useAuthStore } from '../stores/auth.store';
import { organizationsService, type OrganizationInput } from '../services/organizations.service';
import { organizationSchema, type OrganizationFormData } from '../schemas/catalog.schema';
import type { Organization } from '../types/api';

export function OrganizationsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = role === 'ADMIN';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const list = usePaginatedList<Organization>({
    endpoint: '/organizations',
    initialLimit: 10,
  });
  // sincroniza search con el hook
  if (list.search !== debouncedSearch) list.setSearch(debouncedSearch);

  const [editing, setEditing] = useState<Organization | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [target, setTarget] = useState<Organization | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormData>({ resolver: zodResolver(organizationSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', contactName: '', contactPhone: '' });
    setOpenForm(true);
  };

  const openEdit = (o: Organization) => {
    setEditing(o);
    reset({
      name: o.name,
      description: o.description ?? '',
      contactName: o.contactName ?? '',
      contactPhone: o.contactPhone ?? '',
    });
    setOpenForm(true);
  };

  const onSubmit = async (values: OrganizationFormData) => {
    setSaving(true);
    try {
      const payload: OrganizationInput = {
        name: values.name,
        description: values.description || undefined,
        contactName: values.contactName || undefined,
        contactPhone: values.contactPhone || undefined,
      };
      if (editing) {
        await organizationsService.update(editing.id, payload);
        toast.success('Organización actualizada');
      } else {
        await organizationsService.create(payload);
        toast.success('Organización creada');
      }
      setOpenForm(false);
      list.refetch();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'No se pudo guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!target) return;
    setDeactivating(true);
    try {
      await organizationsService.deactivate(target.id);
      toast.success('Organización desactivada');
      setTarget(null);
      list.refetch();
    } catch {
      toast.error('No se pudo desactivar');
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Organizaciones"
        description="Catálogo de organizaciones responsables de actividades"
        actions={
          canWrite && (
            <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
              Nueva organización
            </Button>
          )
        }
      />

      <input
        type="search"
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />

      {list.loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : list.data.length === 0 ? (
        <EmptyState
          title="Sin organizaciones"
          description={search ? 'Prueba con otro término.' : 'Crea la primera organización.'}
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="hidden w-full text-sm sm:table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{o.name}</p>
                    {o.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{o.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {o.contactName ?? '—'}
                    {o.contactPhone && (
                      <span className="block text-xs text-slate-400">{o.contactPhone}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={o.isActive ? 'green' : 'gray'}>
                      {o.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(o)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {o.isActive && (
                          <button
                            onClick={() => setTarget(o)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="Desactivar"
                          >
                            <PowerOff className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Vista móvil como tarjetas */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {list.data.map((o) => (
              <li key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{o.name}</p>
                    {o.contactName && (
                      <p className="text-xs text-slate-500">{o.contactName}</p>
                    )}
                  </div>
                  <Badge variant={o.isActive ? 'green' : 'gray'}>
                    {o.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                {canWrite && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(o)}>
                      Editar
                    </Button>
                    {o.isActive && (
                      <Button size="sm" variant="danger" onClick={() => setTarget(o)}>
                        Desactivar
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Pagination
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        onPageChange={list.setPage}
      />

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? 'Editar organización' : 'Nueva organización'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenForm(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear'}
            </Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nombre *"
            id="name"
            {...register('name')}
            error={errors.name?.message}
          />
          <Textarea
            label="Descripción"
            id="description"
            rows={3}
            {...register('description')}
          />
          <Input label="Responsable" id="contactName" {...register('contactName')} />
          <Input label="Teléfono" id="contactPhone" {...register('contactPhone')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title="Desactivar organización"
        message={`¿Confirmas desactivar "${target?.name}"? Podrás reactivarla más adelante.`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={deactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}