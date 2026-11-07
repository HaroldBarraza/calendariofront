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
import { placesService } from '../services/places.service';
import { placeSchema, type PlaceFormData } from '../schemas/catalog.schema';
import type { Place } from '../types/api';

export function PlacesPage() {
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = role === 'ADMIN';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const list = usePaginatedList<Place>({ endpoint: '/places', initialLimit: 10 });
  if (list.search !== debouncedSearch) list.setSearch(debouncedSearch);

  const [editing, setEditing] = useState<Place | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [target, setTarget] = useState<Place | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', address: '', reference: '', description: '' });
    setOpenForm(true);
  };
  const openEdit = (p: Place) => {
    setEditing(p);
    reset({
      name: p.name,
      address: p.address,
      reference: p.reference ?? '',
      description: p.description ?? '',
    });
    setOpenForm(true);
  };

  const onSubmit = async (values: PlaceFormData) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        address: values.address,
        reference: values.reference || undefined,
        description: values.description || undefined,
      };
      if (editing) {
        await placesService.update(editing.id, payload);
        toast.success('Lugar actualizado');
      } else {
        await placesService.create(payload);
        toast.success('Lugar creado');
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
      await placesService.deactivate(target.id);
      toast.success('Lugar desactivado');
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
        title="Lugares"
        description="Catálogo de lugares disponibles"
        actions={canWrite && <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Nuevo lugar</Button>}
      />

      <input
        type="search"
        placeholder="Buscar por nombre o dirección…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />

      {list.loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : list.data.length === 0 ? (
        <EmptyState title="Sin lugares" description={search ? 'Prueba con otro término.' : 'Crea el primer lugar.'} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="hidden w-full text-sm sm:table">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.reference && <p className="text-xs text-slate-500 line-clamp-1">{p.reference}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.address}</td>
                  <td className="px-4 py-3"><Badge variant={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Editar"><Pencil className="h-4 w-4" /></button>
                        {p.isActive && (
                          <button onClick={() => setTarget(p)} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Desactivar"><PowerOff className="h-4 w-4" /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-slate-100 sm:hidden">
            {list.data.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.address}</p>
                  </div>
                  <Badge variant={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                {canWrite && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Editar</Button>
                    {p.isActive && <Button size="sm" variant="danger" onClick={() => setTarget(p)}>Desactivar</Button>}
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
        title={editing ? 'Editar lugar' : 'Nuevo lugar'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenForm(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>{editing ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Nombre *" id="name" {...register('name')} error={errors.name?.message} />
          <Input label="Dirección *" id="address" {...register('address')} error={errors.address?.message} />
          <Input label="Referencia" id="reference" {...register('reference')} />
          <Textarea label="Descripción" id="description" rows={2} {...register('description')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title="Desactivar lugar"
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