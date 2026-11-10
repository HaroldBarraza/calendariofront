import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, LogIn, Sparkles } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormData) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success('Bienvenido');
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'No se pudo iniciar sesión';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f8fc]">
      {/* ─── Panel izquierdo: imagen de fondo con blur ─── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        {/* Imagen base */}
        <img
          src="src\assets\725578814_1008872051499431_5792838287208812922_n.jpg"
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          aria-hidden="true"
        />

        {/* Blur sutil para dar profundidad */}
        <div className="absolute inset-0 backdrop-blur-[0.5px]" />

        {/* Overlay con degradado para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-blue-900/70" />

        {/* Viñeta oscura en los bordes para enfocar el centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(15,23,42,0.35)_100%)]" />

        {/* Contenido encima */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold drop-shadow-md">Calendario Actividades 2027</span>
        </div>

{/*         <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-md">
            Planifica, organiza y ejecuta tu 2027.
          </h1>
          <p className="max-w-md text-blue-50 drop-shadow">
            Gestiona las actividades anuales de tu organización desde un solo lugar.
            Calendario interactivo, conflictos detectados automáticamente y reportes en PDF.
          </p>
        </div> */}

        <p className="relative z-10 text-xs text-blue-100 drop-shadow">
          © {new Date().getFullYear()} Planifica.app · Todos los derechos reservados
        </p>
      </div>

      {/* ─── Panel derecho: formulario ─── */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Planifica.app</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa tus credenciales para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Sistema de Planificación 2027
          </p>
        </div>
      </div>
    </div>
  );
}