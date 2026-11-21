import api from "./api";

// ============ INTERFACES ============
export interface Training {
  id: number;
  title: string;
  description: string;
  status: "Pending" | "In Progress" | "Completed" | "Expiring" | "Expired";
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

export interface TrainingStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  expiringThisWeek: number;
}

export interface UpdateTrainingDto {
  status?: "Pending" | "In Progress" | "Completed" | "Overdue";
}

// ============ API FUNCTIONS ============
export const trainingApi = {
  // Get user's assigned trainings
  getUserTrainings: async () => {
    try {
      const response = await api.get("/tasks/user/me");
      return response.data;
    } catch (error) {
      console.error("Error fetching user trainings:", error);
      throw error;
    }
  },

  // Get all trainings (for admin users)
  getAllTrainings: async () => {
    try {
      const response = await api.get("/tasks");
      return response.data;
    } catch (error) {
      console.error("Error fetching all trainings:", error);
      throw error;
    }
  },

  // Get specific training by ID
  getTraining: async (id: number) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching training:", error);
      throw error;
    }
  },

  // Update training status (mark as complete, in progress, etc.)
  updateTraining: async (id: number, data: UpdateTrainingDto) => {
    try {
      const response = await api.patch(`/tasks/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating training:", error);
      throw error;
    }
  },

  // Mark training as complete
  completeTraining: async (id: number) => {
    try {
      const response = await api.patch(`/tasks/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error("Error completing training:", error);
      throw error;
    }
  },

  // Get training statistics
  getTrainingStats: async () => {
    try {
      const response = await api.get("/tasks/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching training stats:", error);
      throw error;
    }
  },
};

// Legacy function for backward compatibility
export const fetchTrainings = async () => {
  return trainingApi.getAllTrainings();
};

export const fetchMyTrainings = async () => {
  return trainingApi.getUserTrainings();
};
