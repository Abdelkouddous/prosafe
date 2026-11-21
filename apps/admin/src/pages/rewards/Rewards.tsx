import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Trophy } from "lucide-react";
import PageShell from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  rewardsApi,
  type LeaderboardEntry,
  type RewardPeriod,
} from "@/services/rewardsApi";

const badgeClasses: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  silver: "bg-gray-100 text-gray-700 border-gray-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  platinum: "bg-green-100 text-green-800 border-green-200",
};

const Rewards = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [period, setPeriod] = useState<RewardPeriod>("month");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    rewardsApi
      .leaderboard(period, 20)
      .then((r) => alive && setRows(r.data))
      .catch(() => alive && toast({ title: t("rewards.loadError"), variant: "destructive" }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [period, t, toast]);

  return (
    <PageShell title={t("rewards.title")} subtitle={t("rewards.subtitle")}>
      <Tabs value={period} onValueChange={(v) => setPeriod(v as RewardPeriod)} className="mb-4">
        <TabsList>
          <TabsTrigger value="month">{t("rewards.periods.month")}</TabsTrigger>
          <TabsTrigger value="year">{t("rewards.periods.year")}</TabsTrigger>
          <TabsTrigger value="all">{t("rewards.periods.all")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">{t("rewards.empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("rewards.rank")}</TableHead>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("rewards.badge")}</TableHead>
                  <TableHead className="text-end">{t("rewards.points")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-semibold">
                      {r.rank <= 3 ? (
                        <Trophy
                          className={`h-5 w-5 ${
                            r.rank === 1 ? "text-yellow-500" : r.rank === 2 ? "text-gray-400" : "text-orange-500"
                          }`}
                        />
                      ) : (
                        r.rank
                      )}
                    </TableCell>
                    <TableCell>
                      {r.firstName} {r.lastName}
                    </TableCell>
                    <TableCell>
                      {r.badge ? (
                        <Badge className={badgeClasses[r.badge] ?? ""}>
                          {t(`rewards.badges.${r.badge}`, { defaultValue: r.badge })}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-end font-semibold text-green-700">{r.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
};

export default Rewards;
