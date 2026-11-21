import api from "./api";

/** Downloads a stored file with the bearer token and triggers a browser save. */
export async function downloadFile(fileId: number, name: string) {
  const res = await api.get<Blob>(`/files/${fileId}`, {
    responseType: "blob",
    timeout: 120000,
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
