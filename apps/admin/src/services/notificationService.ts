import { adminApi, AdminTask } from './adminApi';
import { differenceInDays, format } from 'date-fns';

export interface NotificationSettings {
  trainingReminderDays: number;
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;
}

export interface TrainingNotification {
  id: string;
  trainingId: number;
  trainingTitle: string;
  assignedUserName: string;
  assignedUserEmail: string;
  dueDate: Date;
  daysUntilDue: number;
  type: 'reminder' | 'overdue';
  message: string;
}

class NotificationService {
  private settings: NotificationSettings = {
    trainingReminderDays: 7,
    enableEmailNotifications: true,
    enableInAppNotifications: true,
  };

  // Get notification settings
  getSettings(): NotificationSettings {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    return this.settings;
  }

  // Update notification settings
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }

  // Get all pending training notifications
  async getTrainingNotifications(): Promise<TrainingNotification[]> {
    try {
      const response = await adminApi.getTasks();
      const trainings = response.data; // Extract data from AxiosResponse
      const notifications: TrainingNotification[] = [];
      const today = new Date();

      trainings.forEach(training => {
        if (training.completed || !training.due_date || !training.assigned_to) {
          return;
        }

        const dueDate = new Date(training.due_date);
        const daysUntilDue = differenceInDays(dueDate, today);

        // Check if training is due within reminder period
        if (daysUntilDue <= this.settings.trainingReminderDays && daysUntilDue >= 0) {
          notifications.push({
            id: `training-${training.id}-reminder`,
            trainingId: training.id,
            trainingTitle: training.title,
            assignedUserName: `${training.assigned_to.firstName} ${training.assigned_to.lastName}`,
            assignedUserEmail: training.assigned_to.email,
            dueDate,
            daysUntilDue,
            type: 'reminder',
            message: this.generateReminderMessage(training.title, daysUntilDue),
          });
        }

        // Check if training is overdue
        if (daysUntilDue < 0) {
          notifications.push({
            id: `training-${training.id}-overdue`,
            trainingId: training.id,
            trainingTitle: training.title,
            assignedUserName: `${training.assigned_to.firstName} ${training.assigned_to.lastName}`,
            assignedUserEmail: training.assigned_to.email,
            dueDate,
            daysUntilDue,
            type: 'overdue',
            message: this.generateOverdueMessage(training.title, Math.abs(daysUntilDue)),
          });
        }
      });

      return notifications;
    } catch (error) {
      console.error('Failed to get training notifications:', error);
      return [];
    }
  }

  // Generate reminder message
  private generateReminderMessage(trainingTitle: string, daysUntilDue: number): string {
    if (daysUntilDue === 0) {
      return `Training "${trainingTitle}" is due today!`;
    } else if (daysUntilDue === 1) {
      return `Training "${trainingTitle}" is due tomorrow.`;
    } else {
      return `Training "${trainingTitle}" is due in ${daysUntilDue} days.`;
    }
  }

  // Generate overdue message
  private generateOverdueMessage(trainingTitle: string, daysOverdue: number): string {
    if (daysOverdue === 1) {
      return `Training "${trainingTitle}" was due yesterday and is now overdue.`;
    } else {
      return `Training "${trainingTitle}" is ${daysOverdue} days overdue.`;
    }
  }

  // Send email notification (mock implementation)
  async sendEmailNotification(notification: TrainingNotification): Promise<boolean> {
    try {
      // In a real implementation, this would call your email service
      console.log('Sending email notification:', {
        to: notification.assignedUserEmail,
        subject: `Training Reminder: ${notification.trainingTitle}`,
        message: notification.message,
        dueDate: format(notification.dueDate, 'MMMM dd, yyyy'),
      });

      // Mock API call to backend email service
      // const response = await fetch('/api/notifications/email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: notification.assignedUserEmail,
      //     subject: `Training Reminder: ${notification.trainingTitle}`,
      //     template: 'training-reminder',
      //     data: {
      //       trainingTitle: notification.trainingTitle,
      //       dueDate: format(notification.dueDate, 'MMMM dd, yyyy'),
      //       daysUntilDue: notification.daysUntilDue,
      //       message: notification.message,
      //     }
      //   })
      // });

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  // Process all pending notifications
  async processNotifications(): Promise<void> {
    if (!this.settings.enableEmailNotifications && !this.settings.enableInAppNotifications) {
      return;
    }

    const notifications = await this.getTrainingNotifications();

    for (const notification of notifications) {
      if (this.settings.enableEmailNotifications) {
        await this.sendEmailNotification(notification);
      }

      if (this.settings.enableInAppNotifications) {
        this.showInAppNotification(notification);
      }
    }
  }

  // Show in-app notification
  private showInAppNotification(notification: TrainingNotification): void {
    // This would integrate with your toast/notification system
    console.log('In-app notification:', notification.message);
    
    // Example with toast (if you have a global toast system)
    // toast.info(notification.message, {
    //   duration: 5000,
    //   action: {
    //     label: 'View Training',
    //     onClick: () => {
    //       // Navigate to training details
    //       window.location.href = `/admin/trainings/${notification.trainingId}`;
    //     }
    //   }
    // });
  }

  // Start automatic notification checking
  startNotificationScheduler(intervalMinutes: number = 60): void {
    // Check notifications immediately
    this.processNotifications();

    // Set up recurring checks
    setInterval(() => {
      this.processNotifications();
    }, intervalMinutes * 60 * 1000);
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    totalPending: number;
    dueSoon: number;
    overdue: number;
  }> {
    const notifications = await this.getTrainingNotifications();
    
    return {
      totalPending: notifications.length,
      dueSoon: notifications.filter(n => n.type === 'reminder').length,
      overdue: notifications.filter(n => n.type === 'overdue').length,
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;