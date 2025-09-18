import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Clock, Eye, Trash2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { alertApi, Alert, AlertsResponse } from '@/services/alertApi';
import { useAuth } from '@/contexts/AuthContext';

const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertApi.getAlerts(page, 10, severityFilter, statusFilter);
      setAlerts(response.data.alerts);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alerts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severityFilter, statusFilter]);

  const handleStatusUpdate = async (alertId: number, newStatus: string) => {
    try {
      await alertApi.updateAlert(alertId, { status: newStatus });
      toast({
        title: 'Success',
        description: 'Alert status updated successfully'
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert status',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      await alertApi.deleteAlert(alertId);
      toast({
        title: 'Success',
        description: 'Alert deleted successfully'
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'investigating': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'dismissed': return <Eye className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prosafe-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Alert Management</h1>
        <div className="flex gap-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: getSeverityColor(alert.severity).replace('bg-', '#') }}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(alert.status)}
                      <span className="text-sm text-gray-600 capitalize">{alert.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(alert.created_at)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{alert.description}</p>
              
              {alert.source_ip && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Source IP:</strong> {alert.source_ip}
                </p>
              )}
              
              {alert.affected_user && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Affected User:</strong> {alert.affected_user.firstName} {alert.affected_user.lastName} ({alert.affected_user.email})
                </p>
              )}
              
              {alert.resolved_by && (
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Resolved by:</strong> {alert.resolved_by.firstName} {alert.resolved_by.lastName} on {formatDate(alert.resolved_at!)}
                </p>
              )}
              
              {user?.roles?.includes('admin') && (
                <div className="flex gap-2">
                  {alert.status !== 'resolved' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(alert.id, 'investigating')}
                        disabled={alert.status === 'investigating'}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(alert.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(alert.id, 'dismissed')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="flex items-center px-4">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AlertManagement;