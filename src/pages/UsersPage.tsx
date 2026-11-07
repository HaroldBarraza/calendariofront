import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Pencil, ShieldCheck, ShieldOff } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { useAuthStore } from "../stores/auth.store";
import { usersService, type UserInput } from "../services/users.service";
import type { Role, User } from "../types/api";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  fullName: z.string().min(1, "El nombre es obligatorio").max(180),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "PLANNER", "VIEWER"]),
});

type UserFormData = z.infer<typeof userSchema>;

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrador",
  PLANNER: "Planificador",
  VIEWER: "Visor",
};

const ROLE_VARIANT: Record<Role, "red" | "blue" | "gray"> = {
  ADMIN: "red",
  PLANNER: "blue",
  VIEWER: "gray",
};

export function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const list = usePaginatedList<User>({ endpoint: "/users", initialLimit: 15 });

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({ resolver: zodResolver(userSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({ email: "", fullName: "", password: "", role: "VIEWER" });
    setOpenForm(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    reset({ email: u.email, fullName: u.fullName, password: "", role: u.role });
    setOpenForm(true);
  };

  const onSubmit = async (values: UserFormData) => {
    setSaving(true);
    try {
      if (editing) {
        const payload: Partial<UserInput> = {
          email: values.email,
          fullName: values.fullName,
          role: values.role,
        };
        if (values.password) payload.password = values.password;
        await usersService.update(editing.id, payload);
        toast.success("Usuario actualizado");
      } else {
        if (!values.password || values.password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          setSaving(false);
          return;
        }
        await usersService.create({
          email: values.email,
          fullName: values.fullName,
          password: values.password,
          role: values.role,
        });
        toast.success("Usuario creado");
      }
      setOpenForm(false);
      list.refetch();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "No se pudo guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await usersService.update(u.id, { isActive: !u.isActive });
      toast.success(u.isActive ? "Usuario desactivado" : "Usuario activado");
      list.refetch();
    } catch {
      toast.error("No se pudo actualizar");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios y roles del sistema"
        actions={
          <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
            Nuevo usuario
          </Button>
        }
      />

      {list.loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : list.data.length === 0 ? (
        <EmptyState title="Sin usuarios" />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.fullName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[u.role]}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? "green" : "gray"}>
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => toggleActive(u)}
                          className={`rounded p-1.5 ${
                            u.isActive
                              ? "text-red-500 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={u.isActive ? "Desactivar" : "Activar"}
                        >
                          {u.isActive ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpenForm(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              {editing ? "Guardar" : "Crear"}
            </Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nombre completo *"
            id="fullName"
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          <Input
            label="Email *"
            id="email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label={editing ? "Nueva contraseña (opcional)" : "Contraseña *"}
            id="password"
            type="password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Select
            label="Rol *"
            id="role"
            {...register("role")}
            error={errors.role?.message}
          >
            <option value="VIEWER">Visor</option>
            <option value="PLANNER">Planificador</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
