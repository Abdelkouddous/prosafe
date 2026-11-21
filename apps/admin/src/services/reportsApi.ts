import api from "./api";

export type ReportKind =
  | "incidents"
  | "equipment"
  | "trainings"
  | "risks"
  | "audits";
export type ReportFormat = "pdf" | "xlsx";

export interface ReportFilters {
  from?: string;
  to?: string;
  type?: string;
  department?: string;
}

const filenameFrom = (cd?: string, fallback = "report") => {
  if (!cd) return fallback;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return m ? decodeURIComponent(m[1]) : fallback;
};

/** Reads the message of a failed blob request (the body is a Blob). */
export async function blobErrorMessage(e: unknown): Promise<string | undefined> {
  const data = (e as { response?: { data?: unknown } })?.response?.data;
  try {
    if (data instanceof Blob) {
      const j = JSON.parse(await data.text());
      return Array.isArray(j.message) ? j.message.join(", ") : j.message;
    }
  } catch {
    /* not JSON */
  }
  return undefined;
}

export const reportsApi = {
  /** Downloads the report and triggers a browser save. */
  async download(kind: ReportKind, format: ReportFormat, f: ReportFilters = {}) {
    const params = Object.fromEntries(
      Object.entries({ format, ...f }).filter(([, v]) => v)
    );
    const res = await api.get<Blob>(`/reports/${kind}`, {
      params,
      responseType: "blob",
      timeout: 120000,
    });
    const name = filenameFrom(
      res.headers["content-disposition"],
      `${kind}.${format}`
    );
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
