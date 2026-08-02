import { useQuery } from "@tanstack/react-query";
import { fetchAdminItems, type AdminItem } from "@/lib/api";

export function useAdminItems() {
  return useQuery<AdminItem[]>({
    queryKey: ["admin-items"],
    queryFn: fetchAdminItems,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    retry: 2,
  });
}

export type { AdminItem };
