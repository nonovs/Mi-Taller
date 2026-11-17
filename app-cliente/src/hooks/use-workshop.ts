import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Task, Vehicle, VehicleUpdate } from '@/lib/types';

type Query<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/** Coche con lo justo para la tarjeta de la lista: estado de las tareas y último aviso. */
export type VehicleSummary = Vehicle & {
  tasks: Pick<Task, 'status'>[];
  vehicle_updates: Pick<VehicleUpdate, 'message' | 'created_at' | 'author_name'>[];
};

/** Coches del cliente con sesión iniciada (RLS ya filtra por dueño). */
export function useVehicles(): Query<VehicleSummary[]> {
  const [data, setData] = useState<VehicleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: rows, error: queryError } = await supabase
      .from('vehicles')
      .select('*, tasks(status), vehicle_updates(message, created_at, author_name)')
      .order('entered_at', { ascending: false })
      .order('created_at', { referencedTable: 'vehicle_updates', ascending: false })
      .limit(1, { referencedTable: 'vehicle_updates' });
    setError(queryError?.message ?? null);
    setData((rows as VehicleSummary[] | null) ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Cargar al suscribirse: el canal llama a refresh cuando el taller cambia algo.
    const channel = supabase
      .channel('vehicles-list')
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

type VehicleDetail = { vehicle: Vehicle | null; tasks: Task[]; updates: VehicleUpdate[] };

/** Un coche con sus tareas y los avisos del taller, en tiempo real. */
export function useVehicleDetail(id: string): Query<VehicleDetail> {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updates, setUpdates] = useState<VehicleUpdate[]>([]);
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
        .order('created_at', { ascending: false }),
    ]);
    setError(
      vehicleResult.error?.message ??
        tasksResult.error?.message ??
        updatesResult.error?.message ??
        null,
    );
    setVehicle(vehicleResult.data);
    setTasks(tasksResult.data ?? []);
    setUpdates(updatesResult.data ?? []);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`vehicle-${id}`)
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

  return { data: { vehicle, tasks, updates }, error, isLoading, refresh };
}
