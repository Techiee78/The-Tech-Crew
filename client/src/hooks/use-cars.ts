import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Car, InsertCar } from "@shared/schema";

async function getCars(): Promise<Car[]> {
  const res = await fetch(api.cars.list.path, { credentials: "include" });
  if (!res.ok) throw new Error(`Cars API failed (${res.status})`);
  return await res.json();
}

export function useCars(category?: "economy" | "luxury" | "4x4") {
  return useQuery({
    queryKey: [api.cars.list.path, category],
    queryFn: async () => {
      const list = await getCars();
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
