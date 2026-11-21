import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi, type DirectoryUser } from "@/services/usersApi";

interface Props {
  value?: number | null;
  onChange: (id: number | undefined) => void;
  placeholder?: string;
  /** Adds an explicit "none/all" entry. */
  allLabel?: string;
  excludeId?: number;
  className?: string;
}

const NONE = "__none__";

const UserPicker = ({ value, onChange, placeholder, allLabel, excludeId, className }: Props) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<DirectoryUser[]>([]);

  useEffect(() => {
    let alive = true;
    usersApi
      .list()
      .then((u) => alive && setUsers(u))
      .catch(() => alive && setUsers([]));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Select
      value={value != null ? String(value) : allLabel ? NONE : undefined}
      onValueChange={(v) => onChange(v === NONE ? undefined : Number(v))}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder ?? t("users.select", { defaultValue: "Select user" })} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={NONE}>{allLabel}</SelectItem>}
        {users
          .filter((u) => u.id !== excludeId)
          .map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.firstName} {u.lastName}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

export default UserPicker;
