export type VehicleStatus = 'recibido' | 'diagnostico' | 'en_reparacion' | 'listo' | 'entregado';
export type TaskStatus = 'pendiente' | 'en_curso' | 'completada';

export type Vehicle = {
  id: string;
  owner_id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string;
  mileage: number | null;
  status: VehicleStatus;
  status_changed_at: string;
  entered_at: string;
  estimated_delivery: string | null;
  notes: string | null;
};

export type Task = {
  id: string;
  vehicle_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  updated_at: string;
};

export type Client = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
};

/** Aviso del taller al cliente (texto ya redactado y revisado). */
export type VehicleUpdate = {
  id: string;
  vehicle_id: string;
  author_name: string;
  message: string;
  created_at: string;
};

// Pasos que se muestran en el seguimiento ('entregado' es el final, fuera de la barra).
export const VEHICLE_STEPS: { status: VehicleStatus; label: string }[] = [
  { status: 'recibido', label: 'Recibido' },
  { status: 'diagnostico', label: 'Diagnóstico' },
  { status: 'en_reparacion', label: 'En reparación' },
  { status: 'listo', label: 'Listo' },
];

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  recibido: 'Recibido en el taller',
  diagnostico: 'En diagnóstico',
  en_reparacion: 'En reparación',
  listo: 'Listo para recoger',
  entregado: 'Entregado',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completada: 'Completada',
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

export function formatTime(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday ? `Hoy, ${time}` : `${formatDate(iso)}, ${time}`;
}
