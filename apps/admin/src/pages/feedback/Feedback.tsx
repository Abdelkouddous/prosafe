import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Star } from "lucide-react";
import PageShell from "@/components/PageShell";
import PagerBar from "@/components/PagerBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { KpiCard } from "@/components/dashboard/chartUtils";
import { fmtDateTime } from "@/components/manager/ManagerPage";
import { FEEDBACK_CATEGORIES, feedbackApi, type Feedback as FeedbackRow } from "@/services/feedbackApi";

const ALL = "all";
const LIMIT = 20;

export const Stars = ({ value }: { value: number }) => (
  <span className="inline-flex" aria-label={`${value}/5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`h-4 w-4 ${n <= value ? "fill-orange-400 text-orange-400" : "text-gray-300"}`}
      />
    ))}
  </span>
);

const Feedback = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [avg, setAvg] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(ALL);
  const [rating, setRating] = useState(ALL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feedbackApi.list({
        category: category === ALL ? undefined : category,
        rating: rating === ALL ? undefined : Number(rating),
        page,
        limit: LIMIT,
      });
      setRows(res.data.data);
      setTotal(res.data.total);
      setAvg(res.data.averageRating);
    } catch {
      toast({ title: t("feedback.loadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [category, rating, page, t, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageShell title={t("feedback.title")} subtitle={t("feedback.subtitle")}>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("feedback.average")}
          value={avg != null ? `${avg} / 5` : "—"}
          tone={avg == null ? "default" : avg >= 4 ? "success" : avg >= 3 ? "warning" : "danger"}
          icon={<Star className="h-4 w-4 text-orange-400" />}
        />
        <KpiCard label={t("feedback.count")} value={total} />
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("feedback.allCategories")}</SelectItem>
                {FEEDBACK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`feedback.categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rating} onValueChange={(v) => { setRating(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("feedback.allRatings")}</SelectItem>
                {[5, 4, 3, 2, 1].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} ★
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-prosafe-600" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-gray-500">{t("feedback.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("feedback.rating")}</TableHead>
                  <TableHead>{t("feedback.category")}</TableHead>
                  <TableHead>{t("feedback.comment")}</TableHead>
                  <TableHead>{t("feedback.user")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Stars value={f.rating} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`feedback.categories.${f.category}`)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-pre-line">{f.comment || "—"}</TableCell>
                    <TableCell>
                      {f.user ? `${f.user.firstName} ${f.user.lastName}` : "—"}
                      {(f.platform || f.appVersion) && (
                        <div className="text-xs text-gray-500">
                          {[f.platform, f.appVersion].filter(Boolean).join(" ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{fmtDateTime(f.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PagerBar page={page} limit={LIMIT} total={total} onPage={setPage} />
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default Feedback;
