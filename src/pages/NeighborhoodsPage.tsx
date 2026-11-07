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
import { neighborhoodsService } from '../services/neighborhoods.service';
import { neighborhoodSchema, type NeighborhoodFormData } from '../schemas/catalog.schema';
import type { Neighborhood } from '../types/api';

export function NeighborhoodsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = role === 'ADMIN';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const list = usePaginatedList<Neighborhood>({ endpoint: '/neighborhoods', initialLimit: 10 });
  if (list.search !== debouncedSearch) list.setSearch(debouncedSearch);

  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [target, setTarget] = useState<Neighborhood | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NeighborhoodFormData>({
    resolver: zodResolver(neighborhoodSchema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', reference: '' });
    setOpenForm(true);
  };
  const openEdit = (n: Neighborhood) => {
    setEditing(n);
    reset({
      name: n.name,
      description: n.description ?? '',
      reference: n.reference ?? '',
    });
    setOpenForm(true);
  };

  const onSubmit = async (values: NeighborhoodFormData) => {
    setSaving(true);
    try {
      if (editing) {
        await neighborhoodsService.update(editing.id, {
          name: values.name,
          description: values.description || undefined,
          reference: values.reference || undefined,
        });
        toast.success('Barrio actualizado');
      } else {
        await neighborhoodsService.create({
          name: values.name,
          description: values.description || undefined,
          reference: values.reference || undefined,
        });
        toast.success('Barrio creado');
      }
      setOpenForm(false);
      list.refetch();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'No se pudo guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!target) return;
    setDeactivating(true);
    try {
      await neighborhoodsService.deactivate(target.id);
      toast.success('Barrio desactivado');
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
        title="Barrios"
        description="Catálogo de barrios donde se realizan actividades"
        actions={canWrite && <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Nuevo barrio</Button>}
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
        <EmptyState title="Sin barrios" description={search ? 'Prueba con otro término.' : 'Crea el primer barrio.'} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="hidden w-full text-sm sm:table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((n) => (
                <tr key={n.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{n.name}</p>
                    {n.description && <p className="text-xs text-slate-500 line-clamp-1">{n.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{n.reference ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={n.isActive ? 'green' : 'gray'}>{n.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(n)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Editar"><Pencil className="h-4 w-4" /></button>
                        {n.isActive && (
                          <button onClick={() => setTarget(n)} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Desactivar"><PowerOff className="h-4 w-4" /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-slate-100 sm:hidden">
            {list.data.map((n) => (
              <li key={n.id} className="p-4">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-slate-900">{n.name}</p>
                  <Badge variant={n.isActive ? 'green' : 'gray'}>{n.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                {canWrite && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(n)}>Editar</Button>
                    {n.isActive && <Button size="sm" variant="danger" onClick={() => setTarget(n)}>Desactivar</Button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Pagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? 'Editar barrio' : 'Nuevo barrio'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenForm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>{editing ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Nombre *" id="name" {...register('name')} error={errors.name?.message} />
          <Textarea label="Descripción" id="description" rows={2} {...register('description')} />
          <Input label="Referencia" id="reference" {...register('reference')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title="Desactivar barrio"
        message={`¿Desactivar "${target?.name}"?`}
        confirmLabel="Desactivar"
        variant="danger"
        loading={deactivating}
        onConfirm={confirmDeactivate}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}