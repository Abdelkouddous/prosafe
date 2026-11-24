import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2, Map as MapIcon, List, RotateCcw } from "lucide-react";
import PageShell from "@/components/PageShell";
import SafetyReportPdfModal from "@/components/SafetyReportPdfModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  getIncidentCoords,
  incidentApi,
  type Incident,
  type IncidentFilters,
} from "@/services/incidentApi";
import { severityClasses, statusClasses } from "@/components/incidents/incidentUi";
import IncidentDetailSheet from "@/components/incidents/IncidentDetailSheet";
import IncidentMap, { type MapPoint } from "@/components/incidents/IncidentMap";

const ALL = "all";
const PAGE_SIZE = 10;

interface FilterState {
  status: string;
  type: string;
  severity: string;
  from: string;
  to: string;
  zone: string;
  department: string;
  search: string;
}

const emptyFilters: FilterState = {
  status: ALL,
  type: ALL,
  severity: ALL,
  from: "",
  to: "",
  zone: "",
  department: "",
  search: "",
};

const IncidentsManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [debounced, setDebounced] = useState<FilterState>(emptyFilters);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapItems, setMapItems] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // Debounce text inputs; selects/dates are applied through the same path.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(filters);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [filters]);

  const apiFilters = useMemo<IncidentFilters>(
    () => ({
      status: debounced.status === ALL ? undefined : debounced.status,
      type: debounced.type === ALL ? undefined : debounced.type,
      severity: debounced.severity === ALL ? undefined : debounced.severity,
      from: debounced.from || undefined,
      to: debounced.to || undefined,
      zone: debounced.zone.trim() || undefined,
      department: debounced.department.trim() || undefined,
      search: debounced.search.trim() || undefined,
    }),
    [debounced]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await incidentApi.list({ ...apiFilters, page, limit: PAGE_SIZE });
      setItems(res.data.data);
      setTotal(res.data.total);
      if (showMap) {
        const m = await incidentApi.list({ ...apiFilters, page: 1, limit: 100 });
        setMapItems(m.data.data);
      }
    } catch {
      toast({ title: t("incidents.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [apiFilters, page, showMap, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const setF = (k: keyof FilterState, v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const points = useMemo<MapPoint[]>(
    () =>
      mapItems.flatMap((i) => {
        const c = getIncidentCoords(i);
        return c
          ? [
              {
                id: i.id,
                position: c,
                label: i.incidentId,
                sublabel: `${t(`incidents.types.${i.type}`)} - ${t(`incidents.severities.${i.severity}`)}`,
              },
            ]
          : [];
      }),
    [mapItems, t]
  );

  const filterSelect = (
    key: "status" | "type" | "severity",
    values: string[],
    ns: string,
    label: string
  ) => (
    <Select value={filters[key]} onValueChange={(v) => setF(key, v)}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}</SelectItem>
        {values.map((v) => (
          <SelectItem key={v} value={v}>
            {t(`incidents.${ns}.${v}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <PageShell
      title={t("incidents.managementTitle")}
      subtitle={t("incidents.managementSubtitle")}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPdfOpen(true)}
            data-testid="incidents-pdf-btn"
            className="whitespace-nowrap shrink-0"
          >
            <FileText className="h-4 w-4 me-2 text-prosafe-600" />
            PDF ISO 45001
          </Button>
          <Button
            variant={showMap ? "default" : "outline"}
            onClick={() => setShowMap((s) => !s)}
            className="whitespace-nowrap shrink-0"
          >
            {showMap ? (
              <List className="h-4 w-4 me-2" />
            ) : (
              <MapIcon className="h-4 w-4 me-2" />
            )}
            {t("incidents.map")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                placeholder={t("incidents.search")}
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
              />
              {filterSelect("status", INCIDENT_STATUSES, "statuses", t("incidents.allStatuses"))}
              {filterSelect("type", INCIDENT_TYPES, "types", t("incidents.allTypes"))}
              {filterSelect("severity", INCIDENT_SEVERITIES, "severities", t("incidents.allSeverities"))}
              <Input
                type="date"
                aria-label={t("incidents.from")}
                title={t("incidents.from")}
                value={filters.from}
                onChange={(e) => setF("from", e.target.value)}
              />
              <Input
                type="date"
                aria-label={t("incidents.to")}
                title={t("incidents.to")}
                value={filters.to}
                onChange={(e) => setF("to", e.target.value)}
              />
              <Input
                placeholder={t("incidents.zone")}
                value={filters.zone}
                onChange={(e) => setF("zone", e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder={t("incidents.department")}
                  value={filters.department}
                  onChange={(e) => setF("department", e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  title={t("incidents.resetFilters")}
                  onClick={() => setFilters(emptyFilters)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {showMap && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("incidents.mapTitle", { count: points.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentMap
                points={points}
                height={380}
                onSelect={setSelectedId}
                selectLabel={t("incidents.openDetail")}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("incidents.id")}</TableHead>
                  <TableHead>{t("incidents.type")}</TableHead>
                  <TableHead>{t("incidents.severity")}</TableHead>
                  <TableHead>{t("incidents.status")}</TableHead>
                  <TableHead>{t("incidents.reporter")}</TableHead>
                  <TableHead>{t("incidents.zone")}</TableHead>
                  <TableHead>{t("incidents.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {t("incidents.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((i) => (
                    <TableRow
                      key={i.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(i.id)}
                    >
                      <TableCell className="font-medium">{i.incidentId}</TableCell>
                      <TableCell>{t(`incidents.types.${i.type}`)}</TableCell>
                      <TableCell>
                        <Badge className={severityClasses[i.severity]}>
                          {t(`incidents.severities.${i.severity}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClasses[i.status]}>
                          {t(`incidents.statuses.${i.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {i.reporter ? `${i.reporter.firstName} ${i.reporter.lastName}` : "-"}
                      </TableCell>
                      <TableCell>{i.zone || "-"}</TableCell>
                      <TableCell>
                        {new Date(i.timestamp).toLocaleString(i18n.language)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{t("incidents.totalCount", { count: total })}</span>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-2">
                      {page} / {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>

      <IncidentDetailSheet
        incidentId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
      <SafetyReportPdfModal
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        initialIncidents={items}
      />
    </PageShell>
  );
};

export default IncidentsManagement;
