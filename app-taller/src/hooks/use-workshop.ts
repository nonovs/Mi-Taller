import { FunctionsHttpError } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Client, Task, TaskStatus, Vehicle, VehicleStatus, VehicleUpdate } from '@/lib/types';

type Query<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/** Coche con lo necesario para la lista del taller. */
export type VehicleRow = Vehicle & {
  tasks: Pick<Task, 'status'>[];
  vehicle_updates: Pick<VehicleUpdate, 'created_at'>[];
  client: Pick<Client, 'full_name'> | null;
};

/** Coches que están ahora en el taller (todos menos los ya entregados). */
export function useActiveVehicles(): Query<VehicleRow[]> {
  const [data, setData] = useState<VehicleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [vehiclesResult, clientsResult] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*, tasks(status), vehicle_updates(created_at)')
        .neq('status', 'entregado')
        .order('entered_at', { ascending: false })
        .order('created_at', { referencedTable: 'vehicle_updates', ascending: false })
        .limit(1, { referencedTable: 'vehicle_updates' }),
      supabase.from('clients').select('user_id, full_name'),
    ]);
    const names = new Map((clientsResult.data ?? []).map((client) => [client.user_id, client]));
    setError(vehiclesResult.error?.message ?? null);
    setData(
      ((vehiclesResult.data ?? []) as Omit<VehicleRow, 'client'>[]).map((vehicle) => ({
        ...vehicle,
        client: names.get(vehicle.owner_id) ?? null,
      })),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('taller-vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_updates' }, refresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') refresh();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { data, error, isLoading, refresh };
}

type VehicleChat = {
  vehicle: Vehicle | null;
  client: Client | null;
  tasks: Task[];
  updates: VehicleUpdate[];
};

/** Un coche con su cliente, tareas y avisos (del más antiguo al más nuevo). */
export function useVehicleChat(id: string): Query<VehicleChat> {
  const [state, setState] = useState<VehicleChat>({ vehicle: null, client: null, tasks: [], updates: [] });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [vehicleResult, tasksResult, updatesResult] = await Promise.all([
      supabase.from('vehicles').select('*').eq('id', id).maybeSingle(),
      supabase.from('tasks').select('*').eq('vehicle_id', id).order('position'),
      supabase
        .from('vehicle_updates')
        .select('*')
        .eq('vehicle_id', id)
        .order('created_at', { ascending: true }),
    ]);
    const vehicle = vehicleResult.data;
    const clientResult = vehicle
      ? await supabase.from('clients').select('*').eq('user_id', vehicle.owner_id).maybeSingle()
      : null;

    setError(
      vehicleResult.error?.message ??
        tasksResult.error?.message ??
        updatesResult.error?.message ??
        null,
    );
    setState({
      vehicle,
      client: clientResult?.data ?? null,
      tasks: tasksResult.data ?? [],
      updates: updatesResult.data ?? [],
    });
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`taller-vehicle-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles', filter: `id=eq.${id}` },
        refresh,
      )
      .on(
        'postgres_changes',
        // Sin filtro: Supabase no envía los borrados en suscripciones filtradas.
        { event: '*', schema: 'public', table: 'tasks' },
        refresh,
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vehicle_updates', filter: `vehicle_id=eq.${id}` },
        refresh,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') refresh();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refresh]);

  return { data: state, error, isLoading, refresh };
}

export async function setVehicleStatus(vehicleId: string, status: VehicleStatus) {
  const { error } = await supabase.from('vehicles').update({ status }).eq('id', vehicleId);
  if (error) throw new Error(error.message);
}

const NEXT_TASK_STATUS: Record<TaskStatus, TaskStatus> = {
  pendiente: 'en_curso',
  en_curso: 'completada',
  completada: 'pendiente',
};

/** Pendiente → En curso → Completada → Pendiente. */
export async function advanceTask(task: Task) {
  const { error } = await supabase
    .from('tasks')
    .update({ status: NEXT_TASK_STATUS[task.status] })
    .eq('id', task.id);
  if (error) throw new Error(error.message);
}

export async function addTask(vehicleId: string, title: string, position: number) {
  const { error } = await supabase.from('tasks').insert({ vehicle_id: vehicleId, title, position });
  if (error) throw new Error(error.message);
}

export async function updateTask(
  taskId: string,
  changes: Partial<Pick<Task, 'title' | 'description' | 'status'>>,
) {
  const { error } = await supabase.from('tasks').update(changes).eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw new Error(error.message);
}

export async function reorderTasks(vehicleId: string, taskIds: string[]) {
  const { error } = await supabase.rpc('reorder_tasks', { p_vehicle_id: vehicleId, p_task_ids: taskIds });
  if (error) throw new Error(error.message);
}

export type NewVehicle = {
  client: { email: string; full_name: string; phone: string | null };
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year: number | null;
    color: string;
    mileage: number | null;
    notes: string | null;
    estimated_delivery: string | null;
  };
  tasks: string[];
};

/** Da de alta el coche (y la cuenta del cliente si es nuevo). */
export async function createVehicle(input: NewVehicle) {
  return invoke<{ vehicle_id: string; client_email: string; temporary_password: string | null }>(
    'alta-coche',
    input,
  );
}

/** Nueva contraseña temporal para un cliente que ha olvidado la suya. */
export async function resetClientPassword(clientId: string) {
  return invoke<{ client_email: string; temporary_password: string }>('nueva-clave', {
    client_id: clientId,
  });
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload: { error?: string } = await error.context.json().catch(() => ({}));
      throw new Error(payload.error ?? 'Error del servidor.');
    }
    throw new Error('No se ha podido conectar con el servidor. Revisa la conexión.');
  }
  if (!data) throw new Error('Respuesta vacía del servidor.');
  return data;
}
