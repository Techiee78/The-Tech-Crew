import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Property, InsertProperty } from "@shared/schema";

type PropertyFilter = { type?: "buy" | "rent" | "both"; minPrice?: string; maxPrice?: string };
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function getSupabaseProperties(): Promise<Property[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Supabase public API config missing");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase properties fetch failed (${res.status})`);
  const rows = await res.json();
  return rows.map((row: any) => ({
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? "",
    type: String(row.type ?? "").toLowerCase(),
    location: row.location ?? "",
    price: row.price == null ? null : Number(row.price),
    imageUrl: row.image_url ?? row.images?.[0] ?? "",
    images: Array.isArray(row.images) ? row.images : [],
    specs: {
      bedrooms: row.features?.bedrooms ?? row.bedrooms ?? null,
      bathrooms: row.features?.bathrooms ?? row.bathrooms ?? null,
      area: row.features?.sqft ?? row.features?.area ?? row.area ?? null,
    },
    features: Array.isArray(row.amenities) ? row.amenities : [],
    isFeatured: Boolean(row.is_featured ?? row.isFeatured ?? false),
  })) as Property[];
}

export function useProperties(filters?: PropertyFilter) {
  return useQuery({
    queryKey: [api.properties.list.path, "supabase", filters],
    queryFn: async () => {
      let list = await getSupabaseProperties();
      if (filters?.type && filters.type !== "both") list = list.filter(p => String(p.type).toLowerCase() === filters.type);
      if (filters?.minPrice) list = list.filter(p => p.price != null && p.price >= Number(filters.minPrice));
      if (filters?.maxPrice) list = list.filter(p => p.price != null && p.price <= Number(filters.maxPrice));
      return list;
    },
  });
}

export function useProperty(id: string | number) {
  return useQuery({
    queryKey: [api.properties.get.path, "supabase", id],
    queryFn: async () => (await getSupabaseProperties()).find(p => String(p.id) === String(id)) ?? null,
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProperty) => {
      const res = await fetch(api.properties.create.path, { method: api.properties.create.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create property");
      return api.properties.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProperty> }) => {
      const res = await fetch(buildUrl(api.properties.update.path, { id }), { method: api.properties.update.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update property");
      return api.properties.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.properties.delete.path, { id }), { method: api.properties.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete property");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.properties.list.path] }),
  });
}
