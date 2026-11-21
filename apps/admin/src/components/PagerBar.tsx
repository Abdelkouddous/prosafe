import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PagerBar = ({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (p: number) => void;
}) => {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
      <span>{t("common.totalCount", { count: total })}</span>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <span>
          {page} / {pages}
        </span>
        <Button size="icon" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
};

export default PagerBar;
