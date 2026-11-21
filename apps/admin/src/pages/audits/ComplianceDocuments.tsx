import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2, Trash2, Upload } from "lucide-react";
import PageShell from "@/components/PageShell";
import SectionTabs from "@/components/SectionTabs";
import PagerBar from "@/components/PagerBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { KpiCard, fmtRate } from "@/components/dashboard/chartUtils";
import { apiErrorMessage, fmtDate } from "@/components/manager/ManagerPage";
import { auditTabs } from "@/components/audits/auditBits";
import { DOC_TYPES, auditsApi, type ComplianceDocument, type DocType } from "@/services/auditsApi";
import { downloadFile } from "@/services/filesApi";
import { statsApi } from "@/services/statsApi";

const ALL = "all";
const LIMIT = 20;
const DAY = 86400000;

const ExpiryBadge = ({ validUntil }: { validUntil?: string | null }) => {
  const { t } = useTranslation();
  if (!validUntil) return <Badge variant="outline">{t("audits.docs.noExpiry")}</Badge>;
  const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / DAY);
  if (days < 0)
    return <Badge className="bg-red-100 text-red-800 border-red-300">{t("audits.docs.expired")}</Badge>;
  if (days <= 30)
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        {t("audits.docs.expiresIn", { count: days })}
      </Badge>
    );
  return <Badge className="bg-green-100 text-green-800 border-green-200">{t("audits.docs.valid")}</Badge>;
};

const ComplianceDocuments = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<ComplianceDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expiring, setExpiring] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [upload, setUpload] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    const h = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(h);
  }, [searchInput]);

  useEffect(() => {
    statsApi
      .kpis()
      .then((r) => setRate(r.data.auditComplianceRate))
      .catch(() => setRate(null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditsApi.listDocs({
        type: type === ALL ? undefined : type,
        search,
        expiring: expiring || undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast({ title: t("audits.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [type, search, expiring, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (d: ComplianceDocument) => {
    setBusy(d.id);
    try {
      await downloadFile(d.fileId, d.file?.originalName ?? d.title);
    } catch {
      toast({ title: t("audits.docs.downloadError"), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (d: ComplianceDocument) => {
    if (!window.confirm(t("audits.docs.confirmDelete"))) return;
    try {
      await auditsApi.removeDoc(d.id);
      load();
    } catch {
      toast({ title: t("audits.saveError"), variant: "destructive" });
    }
  };

  return (
    <PageShell
      title={t("audits.docs.title")}
      subtitle={t("audits.docs.subtitle")}
      actions={
        <Button onClick={() => setUpload(true)} className="bg-prosafe-600 hover:bg-prosafe-700">
          <Upload className="me-2 h-4 w-4" />
          {t("audits.docs.upload")}
        </Button>
      }
    >
      <SectionTabs tabs={auditTabs(t)} />
      <div className="mb-4 max-w-xs">
        <KpiCard
          label={t("overview.kpi.auditCompliance")}
          value={fmtRate(rate)}
          tone={rate == null ? "default" : rate >= 70 ? "success" : "danger"}
        />
      </div>
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 items-center gap-3 pt-6 sm:grid-cols-3">
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("common.search")} />
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("audits.docs.allTypes")}</SelectItem>
              {DOC_TYPES.map((d) => (
                <SelectItem key={d} value={d}>
                  {t(`audits.docs.types.${d}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={expiring ? "default" : "outline"} onClick={() => { setExpiring((v) => !v); setPage(1); }}>
            {t("audits.docs.onlyExpiring")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("audits.docs.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("audits.fields.title")}</TableHead>
                  <TableHead>{t("audits.fields.type")}</TableHead>
                  <TableHead>{t("audits.docs.validUntil")}</TableHead>
                  <TableHead>{t("audits.docs.validity")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.title}</div>
                      <div className="text-xs text-gray-500">{d.file?.originalName}</div>
                    </TableCell>
                    <TableCell>{t(`audits.docs.types.${d.type}`)}</TableCell>
                    <TableCell>{fmtDate(d.validUntil)}</TableCell>
                    <TableCell>
                      <ExpiryBadge validUntil={d.validUntil} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button size="icon" variant="ghost" disabled={busy === d.id} onClick={() => download(d)}>
                        {busy === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(d)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PagerBar page={page} limit={LIMIT} total={total} onPage={setPage} />
        </CardContent>
      </Card>

      <UploadDialog open={upload} onClose={() => setUpload(false)} onSaved={load} />
    </PageShell>
  );
};

const UploadDialog = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocType>("other");
  const [validUntil, setValidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setType("other");
      setValidUntil("");
      setFile(null);
    }
  }, [open]);

  const save = async () => {
    if (!file || !title.trim()) return;
    setSaving(true);
    try {
      await auditsApi.uploadDoc({ title: title.trim(), type, validUntil: validUntil || undefined, file });
      toast({ title: t("audits.docs.uploaded") });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: t("common.error"), description: apiErrorMessage(e, t("audits.docs.uploadError")), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("audits.docs.upload")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>{t("audits.fields.title")} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("audits.fields.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as DocType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(`audits.docs.types.${d}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("audits.docs.validUntil")}</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("audits.docs.file")} *</Label>
            <Input
              type="file"
              accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-gray-500">{t("audits.docs.fileHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || !file || !title.trim()} className="bg-prosafe-600 hover:bg-prosafe-700">
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceDocuments;
