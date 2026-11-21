import api from "./api";

export interface DirectoryUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  roles?: string[];
  department?: string | null;
  zone?: string | null;
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

/** User picker directory: manager-readable GET /users. */
export const usersApi = {
  async list(params: UsersListParams = {}): Promise<DirectoryUser[]> {
    const res = await api.get<Paginated<DirectoryUser>>("/users", {
      params: { limit: 100, ...params },
    });
    return res.data.data.filter(
      (u) => !(u.roles || []).includes("pending") && u.isActive !== false
    );
  },
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = (payload: ChangePasswordPayload) =>
  api.patch<{ message?: string }>("/users/change-password", payload);
