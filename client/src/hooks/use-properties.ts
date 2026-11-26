import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Property, InsertProperty } from "@shared/schema";

type PropertyFilter = { type?: "buy" | "rent" | "both"; minPrice?: string; maxPrice?: string };

async function getProperties(): Promise<Property[]> {
  const res = await fetch(api.properties.list.path, { credentials: "include" });
  if (!res.ok) throw new Error(`Properties API failed (${res.status})`);
  return await res.json();
}

export function useProperties(filters?: PropertyFilter) {
  return useQuery({
    queryKey: [api.properties.list.path, filters],
    queryFn: async () => {
      let list = await getProperties();
      if (filters?.type && filters.type !== "both") list = list.filter(p => String(p.type).toLowerCase() === filters.type);
      if (filters?.minPrice) list = list.filter(p => p.price != null && p.price >= Number(filters.minPrice));
      if (filters?.maxPrice) list = list.filter(p => p.price != null && p.price <= Number(filters.maxPrice));
      return list;
    },
  });
}

export function useProperty(id: string | number) {
  return useQuery({
    queryKey: [api.properties.get.path, id],
    queryFn: async () => (await getProperties()).find(p => String(p.id) === String(id)) ?? null,
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
