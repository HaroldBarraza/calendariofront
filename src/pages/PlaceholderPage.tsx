import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          {description ?? 'Esta sección estará disponible próximamente.'}
        </p>
      </header>

      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Construction className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">En construcción</p>
        <p className="mt-1 text-xs text-slate-500">
          Estamos trabajando en este módulo.
        </p>
      </div>
    </div>
  );
}