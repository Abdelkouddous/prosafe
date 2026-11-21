import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import PageShell from "@/components/PageShell";
import UserPicker from "@/components/UserPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import {
  messagingApi,
  type ChatMessage,
  type Conversation,
} from "@/services/messagingApi";

const POLL_MS = 15000;

const nameOf = (p?: { firstName?: string; lastName?: string } | null) =>
  p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "";

const Messaging = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const me = Number(user?.id);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [firstBody, setFirstBody] = useState("");
  const [recipientId, setRecipientId] = useState<number | undefined>();
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selectedId;

  const loadConversations = useCallback(async () => {
    try {
      const res = await messagingApi.conversations();
      setConversations(res.data.data);
    } catch {
      /* silent: polled */
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(
    async (id: number) => {
      try {
        await messagingApi.markRead(id);
        setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
        window.dispatchEvent(new Event("prosafe:messages-read"));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const loadMessages = useCallback(
    async (id: number, opts: { read?: boolean } = {}) => {
      try {
        const res = await messagingApi.messages(id);
        if (selectedRef.current !== id) return;
        setMessages(res.data.data);
        if (opts.read) markRead(id);
      } catch {
        toast({ title: t("messaging.loadError"), variant: "destructive" });
      }
    },
    [markRead, t, toast]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Polling fallback when the socket is unavailable
  useEffect(() => {
    const id = setInterval(() => {
      loadConversations();
      if (selectedRef.current) loadMessages(selectedRef.current);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations, loadMessages]);

  useEffect(() => {
    if (selectedId == null) return;
    setMessages([]);
    loadMessages(selectedId, { read: true });
  }, [selectedId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useSocketEvent<{ conversationId: number; message: ChatMessage }>("message:new", (p) => {
    if (p.conversationId === selectedRef.current) {
      setMessages((ms) => (ms.some((m) => m.id === p.message.id) ? ms : [...ms, p.message]));
      if (p.message.senderId !== me) markRead(p.conversationId);
    }
    loadConversations();
  });

  const send = async () => {
    const body = draft.trim();
    if (!body || selectedId == null) return;
    setSending(true);
    try {
      const msg = await messagingApi.send(selectedId, body);
      setDraft("");
      setMessages((ms) => (ms.some((m) => m.id === msg.data.id) ? ms : [...ms, msg.data]));
      loadConversations();
    } catch {
      toast({ title: t("messaging.sendError"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const createConversation = async () => {
    if (!subject.trim() || !firstBody.trim() || !recipientId) return;
    setCreating(true);
    try {
      const res = await messagingApi.create({
        subject: subject.trim(),
        body: firstBody.trim(),
        recipientId,
      });
      setDialogOpen(false);
      setSubject("");
      setFirstBody("");
      setRecipientId(undefined);
      await loadConversations();
      setSelectedId(res.data.id);
    } catch {
      toast({ title: t("messaging.createError"), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const selected = conversations.find((c) => c.id === selectedId);
  const others = (c: Conversation) =>
    c.participants.filter((p) => p.id !== me).map(nameOf).filter(Boolean).join(", ");
  const time = (d: string) =>
    new Date(d).toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" });

  return (
    <PageShell
      title={t("messaging.title")}
      subtitle={t("messaging.subtitle")}
      actions={
        <Button onClick={() => setDialogOpen(true)} className="bg-prosafe-600 hover:bg-prosafe-700">
          <MessageSquarePlus className="me-2 h-4 w-4" />
          {t("messaging.new")}
        </Button>
      }
    >
      <Card className="grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-3">
        <div className="overflow-y-auto border-e">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">{t("messaging.empty")}</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full border-b px-4 py-3 text-start hover:bg-gray-50 ${
                  c.id === selectedId ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${c.unreadCount ? "font-bold" : "font-medium"}`}>
                    {c.subject}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="min-w-[20px] rounded-full bg-red-500 px-1.5 text-center text-[11px] text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-gray-500">{others(c)}</div>
                {c.lastMessage && (
                  <div className="mt-0.5 flex justify-between gap-2 text-xs text-gray-400">
                    <span className="truncate">{c.lastMessage.body}</span>
                    <span className="shrink-0">{time(c.lastMessage.createdAt)}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-0 flex-col md:col-span-2">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              {t("messaging.select")}
            </div>
          ) : (
            <>
              <div className="border-b px-4 py-3">
                <div className="font-semibold">{selected.subject}</div>
                <div className="text-xs text-gray-500">{others(selected)}</div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
                {messages.map((m) => {
                  const mine = m.senderId === me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          mine ? "bg-prosafe-600 text-white" : "border bg-white"
                        }`}
                      >
                        {!mine && (
                          <div className="mb-0.5 text-xs font-semibold text-gray-600">
                            {nameOf(m.sender) || t("messaging.system")}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>
                          {time(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 border-t p-3">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={t("messaging.placeholder")}
                  maxLength={5000}
                />
                <Button onClick={send} disabled={!draft.trim() || sending} aria-label={t("messaging.send")}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("messaging.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("messaging.recipient")}</Label>
              <UserPicker value={recipientId} onChange={setRecipientId} excludeId={me} />
            </div>
            <div>
              <Label>{t("messaging.subject")}</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label>{t("messaging.message")}</Label>
              <Textarea value={firstBody} onChange={(e) => setFirstBody(e.target.value)} maxLength={5000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={createConversation}
              disabled={!subject.trim() || !firstBody.trim() || !recipientId || creating}
              className="bg-prosafe-600 hover:bg-prosafe-700"
            >
              {creating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("messaging.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Messaging;
