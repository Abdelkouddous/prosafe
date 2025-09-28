import api from "./api";

// ============ INTERFACES ============
export interface Training {
  id: number;
  title: string;
  description: string;
  status: {
    pending: "Pending";
    inProgress: "In Progress";
    completed: "Completed";
    expiring: "Expiring";
    expired: "Expired";
  };
  priority: "Low" | "Medium" | "High";
  created_at: string;
  isCompleted: boolean;
  dueDate: string | null;
  updatedAt: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// craete the training DTO
export interface TrainingDto {
  title: string;
  description: string;
  priority?: number;
  dueDate?: string;
  assignedToUserId: number;
}

export interface UpdateTrainingDto {
  title?: string;
  description?: string;
  status?: "Pending" | "In Progress" | "Completed" | "Overdue";
  priority?: number;
  dueDate?: string;
}

export interface AssignTrainingDto {
  assignedToUserId: number;
}

export interface TrainingStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  expiringThisWeek: number;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

// ============ API FUNCTIONS ============
export const trainingApi = {
  // Get all trainings with optional filtering
  getTrainings: (userId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());
    if (status) params.append("status", status);

    return api.get<{ message: string; tasks: Training[]; count: number }>(
      `/tasks?${params.toString()}`
    );
  },

  // Get specific training by ID
  getTraining: (id: number) => {
    return api.get<{ message: string; task: Training }>(`/tasks/${id}`);
  },

  // Create new training (admin only)
  createTraining: (data: TrainingDto) => {
    return api.post<{ message: string; task: Training }>("/tasks", data);
  },

  // Update training
  updateTraining: (id: number, data: UpdateTrainingDto) => {
    return api.patch<{ message: string; task: Training }>(`/tasks/${id}`, data);
  },

  // Mark training as complete
  completeTraining: (id: number) => {
    return api.patch<{ message: string; task: Training }>(
      `/tasks/${id}/complete`
    );
  },

  // Assign training to user (admin only)
  assignTraining: (id: number, data: AssignTrainingDto) => {
    return api.patch<{ message: string; task: Training }>(
      `/tasks/${id}/assign`,
      data
    );
  },

  // Delete training (admin only)
  deleteTraining: (id: number) => {
    return api.delete<{ message: string }>(`/tasks/${id}`);
  },

  // Get user's assigned trainings
  getUserTrainings: (userId: number) => {
    return api.get<{ message: string; tasks: Training[]; count: number }>(
      `/tasks/user/${userId}`
    );
  },

  // Get admin's created trainings
  getAdminTrainings: () => {
    return api.get<{ message: string; tasks: Training[]; count: number }>(
      "/tasks/admin/created"
    );
  },

  // Get training statistics
  getTrainingStats: () => {
    return api.get<{ message: string; stats: TrainingStats }>("/tasks/stats");
  },

  // Get all users for assignment
  getUsers: () => {
    return api.get<User[]>("/admin/users");
  },

  // Get trainings expiring within a week (for notifications)
  getExpiringTrainings: () => {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    return trainingApi.getTrainings().then((response) => {
      const expiringTrainings = response.data.tasks.filter((training) => {
        if (!training.dueDate) return false;
        const dueDate = new Date(training.dueDate);
        const today = new Date();
        return (
          dueDate >= today && dueDate <= oneWeekFromNow && !training.isCompleted
        );
      });

      return {
        data: {
          message: "Expiring trainings retrieved successfully",
          tasks: expiringTrainings,
          count: expiringTrainings.length,
        },
      };
    });
  },
};
