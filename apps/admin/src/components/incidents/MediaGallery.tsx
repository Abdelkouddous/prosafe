import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { incidentApi, type IncidentMedia } from "@/services/incidentApi";

const MediaItem = ({ media }: { media: IncidentMedia }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    incidentApi
      .fetchFileBlobUrl(media.id)
      .then((u) => {
        if (revoked) URL.revokeObjectURL(u);
        else {
          objectUrl = u;
          setUrl(u);
        }
      })
      .catch(() => setFailed(true));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.id]);

  if (failed)
    return (
      <div className="h-32 flex items-center justify-center bg-gray-100 rounded text-xs text-red-600">
        !
      </div>
    );
  if (!url)
    return (
      <div className="h-32 flex items-center justify-center bg-gray-100 rounded">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  return media.kind === "video" ? (
    <video src={url} controls className="w-full rounded max-h-64 bg-black" />
  ) : (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="" className="w-full rounded object-cover max-h-64" />
    </a>
  );
};

const MediaGallery = ({ media }: { media: IncidentMedia[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {media.map((m) => (
      <MediaItem key={m.id} media={m} />
    ))}
  </div>
);

export default MediaGallery;
