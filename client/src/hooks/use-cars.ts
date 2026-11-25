import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Car, InsertCar } from "@shared/schema";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function getSupabaseCars(): Promise<Car[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase public API config missing");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cars?select=*&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase cars fetch failed (${res.status})`);
  const rows = await res.json();
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name ?? [row.make, row.model, row.year].filter(Boolean).join(" "),
    category: String(row.category ?? "economy").toLowerCase(),
    pricePerDay: Number(row.price_per_day ?? row.price ?? 0),
    imageUrl: row.image_url ?? row.images?.[0] ?? "",
    images: Array.isArray(row.images) ? row.images : [],
    isAvailable: row.is_available ?? (row.status ? row.status === "AVAILABLE" : true),
    features: Array.isArray(row.features) ? row.features : (Array.isArray(row.amenities) ? row.amenities : []),
    description: row.description ?? "",
  })) as Car[];
}

export function useCars(category?: "economy" | "luxury" | "4x4") {
  return useQuery({
    queryKey: [api.cars.list.path, "supabase", category],
    queryFn: async () => {
      const list = await getSupabaseCars();
      return category ? list.filter(car => String(car.category).toLowerCase() === category) : list;
    },
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCar) => {
      const res = await fetch(api.cars.create.path, { method: api.cars.create.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create car");
      return api.cars.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cars.list.path] }),
  });
}

export function useUpdateCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCar> }) => {
      const res = await fetch(`/api/cars/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update car");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cars.list.path] }),
  });
}

export function useDeleteCar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.cars.delete.path, { id }), { method: api.cars.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete car");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cars.list.path] }),
  });
}
