import api from "./api";

export interface DirectoryUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  roles?: string[];
  department?: string | null;
  isActive?: boolean;
}

export interface UsersListParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const status = (e: unknown) =>
  (e as { response?: { status?: number } })?.response?.status;

/**
 * User picker. Calls the manager-readable GET /users and falls back to the
 * admin-only GET /auth/users (filtered client-side) on 404/403.
 */
export const usersApi = {
  async list(params: UsersListParams = {}): Promise<DirectoryUser[]> {
    try {
      const res = await api.get<Paginated<DirectoryUser> | DirectoryUser[]>(
        "/users",
        { params: { limit: 100, ...params } }
      );
      const rows = Array.isArray(res.data) ? res.data : res.data.data;
      return rows.filter(
        (u) => !(u.roles || []).includes("pending") && u.isActive !== false
      );
    } catch (e) {
      if (status(e) !== 404 && status(e) !== 403) throw e;
      const res = await api.get<DirectoryUser[]>("/auth/users");
      const q = params.search?.trim().toLowerCase();
      return res.data.filter((u) => {
        if ((u.roles || []).includes("pending") || u.isActive === false) return false;
        if (params.role && !(u.roles || []).includes(params.role)) return false;
        if (!q) return true;
        return `${u.firstName} ${u.lastName} ${u.email ?? ""}`.toLowerCase().includes(q);
      });
    }
  },
};
