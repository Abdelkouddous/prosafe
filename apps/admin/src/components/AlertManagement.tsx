import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, Clock, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ALERT_TYPES, alertApi, type Alert } from "@/services/alertApi";
import { useAuth } from "@/contexts/AuthContext";

const ALL = "all";
const STATUSES = ["unresolved", "investigating", "resolved", "dismissed"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;

const severityClass: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-green-600 text-white",
};
const borderClass: Record<string, string> = {
  critical: "border-s-red-600",
  high: "border-s-orange-500",
  medium: "border-s-yellow-500",
  low: "border-s-green-600",
};

const statusIcon = (status: string) => {
  switch (status) {
    case "resolved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "investigating":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "dismissed":
      return <Eye className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
};

const AlertManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { isManager } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [severity, setSeverity] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alertApi.getAlerts(
        page,
        10,
        severity === ALL ? "" : severity,
        status === ALL ? "" : status
      );
      setAlerts(res.data.alerts);
      setTotalPages(Math.max(1, res.data.totalPages));
    } catch {
      toast({ title: t("alerts.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, severity, status, t, toast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // The backend has no `type` filter: applied to the current page.
  const visible = useMemo(
    () => (type === ALL ? alerts : alerts.filter((a) => a.type === type)),
    [alerts, type]
  );

  const updateStatus = async (id: number, next: string) => {
    try {
      await alertApi.updateAlert(id, { status: next });
      toast({ title: t("alerts.updated") });
      fetchAlerts();
    } catch {
      toast({ title: t("alerts.updateError"), variant: "destructive" });
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm(t("alerts.confirmDelete"))) return;
    try {
      await alertApi.deleteAlert(id);
      fetchAlerts();
    } catch {
      toast({ title: t("alerts.updateError"), variant: "destructive" });
    }
  };

  const fmt = (d?: string) => {
    const date = d ? new Date(d) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleString(i18n.language) : "-";
  };

  const filter = (
    value: string,
    set: (v: string) => void,
    allLabel: string,
    options: readonly string[],
    label: (o: string) => string
  ) => (
    <Select
      value={value}
      onValueChange={(v) => {
        set(v);
        setPage(1);
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {label(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {filter(severity, setSeverity, t("incidents.allSeverities"), SEVERITIES, (o) => t(`incidents.severities.${o}`))}
        {filter(status, setStatus, t("incidents.allStatuses"), STATUSES, (o) => t(`alerts.statuses.${o}`))}
        {filter(type, setType, t("incidents.allTypes"), ALERT_TYPES, (o) => t(`alerts.types.${o}`))}
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-prosafe-600" />
        </div>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">{t("alerts.empty")}</p>
      ) : (
        <div className="space-y-4">
          {visible.map((alert) => (
            <Card key={alert.id} className={`border-s-4 ${borderClass[alert.severity] ?? ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={severityClass[alert.severity]}>
                        {t(`incidents.severities.${alert.severity}`)}
                      </Badge>
                      <Badge variant="outline">
                        {t(`alerts.types.${alert.type}`, { defaultValue: alert.type })}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        {statusIcon(alert.status)}
                        {t(`alerts.statuses.${alert.status}`, { defaultValue: alert.status })}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{fmt(alert.created_at)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-gray-700">{alert.description}</p>
                {alert.affected_user && (
                  <p className="mb-2 text-sm text-gray-600">
                    <strong>{t("alerts.affectedUser")}:</strong> {alert.affected_user.firstName}{" "}
                    {alert.affected_user.lastName}
                  </p>
                )}
                {alert.resolved_by && (
                  <p className="mb-3 text-sm text-green-700">
                    {t("alerts.resolvedBy", {
                      name: `${alert.resolved_by.firstName} ${alert.resolved_by.lastName}`,
                      date: fmt(alert.resolved_at),
                    })}
                  </p>
                )}
                {isManager && (
                  <div className="flex flex-wrap gap-2">
                    {alert.status !== "resolved" && alert.status !== "dismissed" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={alert.status === "investigating"}
                          onClick={() => updateStatus(alert.id, "investigating")}
                        >
                          <Clock className="me-1 h-4 w-4" />
                          {t("alerts.investigate")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 text-green-700"
                          onClick={() => updateStatus(alert.id, "resolved")}
                        >
                          <CheckCircle className="me-1 h-4 w-4" />
                          {t("alerts.resolve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(alert.id, "dismissed")}
                        >
                          <Eye className="me-1 h-4 w-4" />
                          {t("alerts.dismiss")}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => remove(alert.id)}>
                      <Trash2 className="me-1 h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          {t("alerts.previous")}
        </Button>
        <span className="px-4 text-sm">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          {t("alerts.next")}
        </Button>
      </div>
    </div>
  );
};

export default AlertManagement;
