"use client";

import AuthGuard from "@/components/common/AuthGuard";
import AddressPicker from "@/components/common/AddressPicker";
import BudgetSelector, { BudgetType } from "@/components/post-job/BudgetSelector";
import JobServicePicker, {
  JobServiceSelection,
} from "@/components/post-job/JobServicePicker";
import PropertyTypeSelector, {
  PropertyType,
} from "@/components/post-job/PropertyTypeSelector";
import TimingSelector, { Timing } from "@/components/post-job/TimingSelector";
import { Button } from "@/components/ui/button";
import { FormGroup, Input, Textarea } from "@/components/ui/input";
import { Stepper } from "@/components/ui/Stepper";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  ImageIcon,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Admin "assisted job" builder.
 *
 * An admin fills in everything a client dictated to them (contact, service,
 * details, photos/videos) and generates a single-use link. The client opens it,
 * signs in / sets a password, reviews, and approves in one tap — which creates
 * the real Job.
 *
 * This is the ADMIN-facing page (data capture + link generation). It posts to:
 *
 *   POST /assisted-jobs   (admin-only)
 *   body: {
 *     client: { name, phone, email? },
 *     category, subcategory?, services: JobServiceSelection[],
 *     propertyType, description?, areaSize?,
 *     timing, budgetType, budgetMin?, budgetMax?,
 *     location, coordinates?: { lat, lng },
 *     images: string[], videos: string[],
 *   }
 *   → 201 { id, token, clientPath, expiresAt }
 *
 * The client opens `clientPath` (see src/app/assisted-job/[token]).
 */

const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB per file (matches post-job)
const MAX_MEDIA_COUNT = 20;

type MediaItem = { file: File; preview: string; isVideo: boolean };

// The api client's transformIds normally renames `_id`→`id`; read either to be
// safe against any response shape.
type ClientHit = {
  id?: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
};
type ProHit = { id?: string; _id?: string; name: string; email?: string };
const userId = (u: { id?: string; _id?: string }) => u.id ?? u._id ?? "";

const STEP_KEYS = ["client", "service", "details", "media", "review"] as const;
type StepKey = (typeof STEP_KEYS)[number];

function AssistedJobContent() {
  const router = useRouter();
  const toast = useToast();
  const { locale } = useLanguage();
  const lang = (["en", "ka", "ru"].includes(locale) ? locale : "en") as
    | "en"
    | "ka"
    | "ru";

  const [stepIdx, setStepIdx] = useState(0);
  const step: StepKey = STEP_KEYS[stepIdx];

  // ── Client ──
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // ── Service ──
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServices, setSelectedServices] = useState<JobServiceSelection[]>(
    [],
  );

  // ── Details ──
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [description, setDescription] = useState("");
  const [areaSize, setAreaSize] = useState("");
  const [timing, setTiming] = useState<Timing>("flexible");
  const [budgetType, setBudgetType] = useState<BudgetType>("negotiable");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // ── Media ──
  const [media, setMedia] = useState<MediaItem[]>([]);

  // ── Result ──
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [sending, setSending] = useState<"sms" | "email" | null>(null);

  // "create" = the wizard, "history" = the list of previously sent links.
  const [view, setView] = useState<"create" | "history">("create");

  // Existing-client autocomplete: as the admin types a name or phone, suggest
  // matching client accounts so they can reuse one (avoids duplicates + typos).
  const [clientHits, setClientHits] = useState<ClientHit[]>([]);
  // True once a search for the current name/phone has completed — lets us show
  // a "no existing client" hint (vs. nothing) so the admin knows the lookup ran.
  const [clientSearched, setClientSearched] = useState(false);
  const suppressClientSearch = useRef(false);
  const clientSearchSeq = useRef(0);

  // Optional: invite specific pros directly (on top of the open marketplace).
  const [proQuery, setProQuery] = useState("");
  const [proHits, setProHits] = useState<ProHit[]>([]);
  const [invitedPros, setInvitedPros] = useState<{ id: string; name: string }[]>(
    [],
  );
  const proSearchSeq = useRef(0);

  const steps = useMemo(
    () => [
      { key: "client", label: "Client" },
      { key: "service", label: "Service" },
      { key: "details", label: "Details" },
      { key: "media", label: "Photos & videos" },
      { key: "review", label: "Review & link" },
    ],
    [],
  );

  // Debounced lookup of existing clients by the name/phone the admin is typing.
  useEffect(() => {
    // Skip the run triggered by programmatically filling the fields on select.
    if (suppressClientSearch.current) {
      suppressClientSearch.current = false;
      return;
    }
    const digits = clientPhone.replace(/\D/g, "");
    const term =
      digits.length >= 3
        ? digits
        : clientName.trim().length >= 2
          ? clientName.trim()
          : "";
    if (!term) {
      setClientHits([]);
      setClientSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      // Ignore out-of-order responses: only the latest fired request applies.
      const seq = ++clientSearchSeq.current;
      api
        .get("/admin/users", {
          params: { search: term, role: "client", limit: 6 },
        })
        .then((r) => {
          if (seq === clientSearchSeq.current) {
            setClientHits((r.data?.users as ClientHit[]) || []);
            setClientSearched(true);
          }
        })
        .catch(() => {
          // On error, don't claim "no existing client" — just show nothing.
          if (seq === clientSearchSeq.current) {
            setClientHits([]);
            setClientSearched(false);
          }
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [clientName, clientPhone]);

  const selectClient = (hit: ClientHit) => {
    suppressClientSearch.current = true;
    setClientName(hit.name || "");
    setClientPhone(hit.phone || "");
    setClientEmail(hit.email || "");
    setClientHits([]);
    setClientSearched(false);
  };

  // Debounced pro search for the optional "invite pros" section.
  useEffect(() => {
    const term = proQuery.trim();
    if (term.length < 2) {
      setProHits([]);
      return;
    }
    const timer = setTimeout(() => {
      const seq = ++proSearchSeq.current;
      api
        .get("/admin/users", { params: { search: term, role: "pro", limit: 6 } })
        .then((r) => {
          if (seq === proSearchSeq.current)
            setProHits((r.data?.users as ProHit[]) || []);
        })
        .catch(() => {
          if (seq === proSearchSeq.current) setProHits([]);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [proQuery]);

  const addPro = (hit: ProHit) => {
    const id = userId(hit);
    if (!id) return;
    setInvitedPros((prev) =>
      prev.some((p) => p.id === id)
        ? prev
        : [...prev, { id, name: hit.name || "Pro" }],
    );
    setProQuery("");
    setProHits([]);
  };
  const removePro = (id: string) =>
    setInvitedPros((prev) => prev.filter((p) => p.id !== id));

  // ── Per-step validation (gentle gate on "Continue") ──
  const stepValid = useCallback(
    (s: StepKey): boolean => {
      switch (s) {
        case "client":
          return clientName.trim().length > 1 && clientPhone.trim().length >= 9;
        case "service":
          return selectedCategory !== "" && selectedServices.length > 0;
        case "details":
          return location.trim().length > 0;
        case "media":
          return true; // media is optional
        case "review":
          return true;
        default:
          return true;
      }
    },
    [clientName, clientPhone, selectedCategory, selectedServices, location],
  );

  const goNext = () => {
    if (!stepValid(step)) {
      toast.warning("Please complete this step before continuing.");
      return;
    }
    setStepIdx((i) => Math.min(i + 1, STEP_KEYS.length - 1));
  };
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  // ── Media handlers ──
  const onPickMedia = (files: FileList | null) => {
    if (!files) return;
    const next: MediaItem[] = [];
    for (const file of Array.from(files)) {
      if (media.length + next.length >= MAX_MEDIA_COUNT) {
        toast.warning(`You can attach up to ${MAX_MEDIA_COUNT} files.`);
        break;
      }
      if (file.size > MAX_MEDIA_BYTES) {
        toast.warning(`"${file.name}" is larger than 10 MB and was skipped.`);
        continue;
      }
      next.push({
        file,
        preview: URL.createObjectURL(file),
        isVideo: file.type.startsWith("video/"),
      });
    }
    if (next.length) setMedia((m) => [...m, ...next]);
  };

  const removeMedia = (idx: number) => {
    setMedia((m) => {
      const copy = [...m];
      const [removed] = copy.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  // ── Upload media then create the assisted-job draft ──
  const uploadOne = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd);
      return (res.data?.url as string) || (res.data?.filename as string) || null;
    } catch {
      return null;
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      // Upload media in parallel; a single failure doesn't abort the rest.
      // Keep each url paired with its isVideo flag BEFORE dropping failures —
      // filtering first would de-align the index and swap photos/videos.
      const uploaded = await Promise.all(
        media.map(async (m) => ({ url: await uploadOne(m.file), isVideo: m.isVideo })),
      );
      const failedCount = uploaded.filter((u) => !u.url).length;
      const images = uploaded
        .filter((u) => u.url && !u.isVideo)
        .map((u) => u.url as string);
      const videos = uploaded
        .filter((u) => u.url && u.isVideo)
        .map((u) => u.url as string);
      if (failedCount > 0) {
        toast.warning(
          `${failedCount} file(s) couldn't be uploaded and were skipped.`,
        );
      }

      const payload = {
        client: {
          name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim() || undefined,
        },
        category: selectedCategory,
        services: selectedServices,
        propertyType,
        description: description.trim() || undefined,
        areaSize: areaSize.trim() || undefined,
        timing,
        budgetType,
        budgetMin: budgetMin.trim() || undefined,
        budgetMax: budgetMax.trim() || undefined,
        location: location.trim(),
        coordinates: coordinates || undefined,
        images,
        videos,
        invitedPros: invitedPros.length
          ? invitedPros.map((p) => p.id)
          : undefined,
      };

      const res = await api.post("/assisted-jobs", payload);
      const clientPath: string =
        res.data?.clientPath ||
        (res.data?.token ? `/assisted-job/${res.data.token}` : "");
      const clientUrl = clientPath
        ? `${window.location.origin}${clientPath}`
        : "";
      if (!clientUrl) throw new Error("No link returned");
      setGeneratedLink(clientUrl);
      setGeneratedId(res.data?.id ?? null);
      toast.success("Link generated. Share it with the client.");
    } catch {
      toast.error(
        "Couldn't generate the link. The backend endpoint may not be ready yet.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy — select and copy the link manually.");
    }
  };

  const sendGeneratedLink = async (channel: "sms" | "email") => {
    if (!generatedId || sending) return;
    setSending(channel);
    try {
      await api.post(`/assisted-jobs/${generatedId}/send`, { channel });
      toast.success(
        channel === "sms"
          ? "Link sent by SMS to the client."
          : "Link sent by email to the client.",
      );
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Couldn't send the link.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSending(null);
    }
  };

  const serviceNames = selectedServices
    .map((s) => (lang === "ka" ? s.nameKa : lang === "ru" ? s.nameRu : s.name))
    .filter(Boolean);

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen (after link generation)
  // ─────────────────────────────────────────────────────────────────────────
  if (generatedLink) {
    return (
      <div className="min-h-screen bg-[var(--hm-bg-page)]">
        <div className="mx-auto max-w-2xl px-5 py-16">
          <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hm-success-500)]/15">
              <CheckCircle2 className="h-8 w-8 text-[var(--hm-success-600)]" />
            </div>
            <h1 className="text-[22px] font-semibold text-[var(--hm-fg-primary)]">
              Link ready to send
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--hm-fg-secondary)]">
              Send this link to {clientName || "the client"}. They open it, sign in
              (or set a password), review the details, and approve — that creates
              the job.
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] px-3 py-2.5 text-left">
              <Link2 className="h-4 w-4 shrink-0 text-[var(--hm-fg-muted)]" />
              <span className="flex-1 truncate text-[13px] text-[var(--hm-fg-secondary)]">
                {generatedLink}
              </span>
              <Button size="sm" variant="outline" leftIcon={<Copy className="h-4 w-4" />} onClick={copyLink}>
                Copy
              </Button>
            </div>

            {/* Send the link directly to the client */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[13px] text-[var(--hm-fg-muted)]">
                or send it:
              </span>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<MessageSquare className="h-4 w-4" />}
                onClick={() => sendGeneratedLink("sms")}
                loading={sending === "sms"}
                disabled={!!sending}
              >
                SMS
              </Button>
              {clientEmail.trim() && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Mail className="h-4 w-4" />}
                  onClick={() => sendGeneratedLink("email")}
                  loading={sending === "email"}
                  disabled={!!sending}
                >
                  Email
                </Button>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset for a brand-new draft.
                  setGeneratedLink(null);
                  setGeneratedId(null);
                  setStepIdx(0);
                  setClientName("");
                  setClientPhone("");
                  setClientEmail("");
                  setSelectedCategory("");
                  setSelectedServices([]);
                  setInvitedPros([]);
                  setProQuery("");
                  setProHits([]);
                  setDescription("");
                  setAreaSize("");
                  setLocation("");
                  setCoordinates(null);
                  setPropertyType("apartment");
                  setTiming("flexible");
                  setBudgetType("negotiable");
                  setBudgetMin("");
                  setBudgetMax("");
                  media.forEach((m) => URL.revokeObjectURL(m.preview));
                  setMedia([]);
                }}
              >
                Create another
              </Button>
              <Button onClick={() => router.push("/admin")}>Back to admin</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Wizard
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--hm-bg-page)]">
      <div className="mx-auto max-w-3xl px-5 py-8">
        {/* Header */}
        <button
          onClick={() => router.push("/admin")}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]"
        >
          <ArrowLeft className="h-4 w-4" /> Admin
        </button>
        <h1 className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--hm-fg-primary)]">
          <Sparkles className="h-6 w-6 text-[var(--hm-brand-500)]" />
          Create a job for a client
        </h1>
        <p className="mt-1 text-[14px] text-[var(--hm-fg-secondary)]">
          Fill in what the client told you, then generate a link they approve in one
          tap.
        </p>

        {/* View toggle */}
        <div className="mt-6 flex gap-2 border-b border-[var(--hm-border-subtle)] pb-3">
          {(["create", "history"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                view === v
                  ? "bg-[var(--hm-brand-500)] text-white"
                  : "text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
              }`}
            >
              {v === "create" ? "New request" : "Sent links"}
            </button>
          ))}
        </div>

        {view === "history" ? (
          <div className="mt-6">
            <DraftsList />
          </div>
        ) : (
          <>
        {/* Progress */}
        <div className="my-6">
          <Stepper
            steps={steps}
            currentIndex={stepIdx}
            onStepClick={(i) => {
              // Allow jumping back freely; only forward if prior steps are valid.
              if (i <= stepIdx) setStepIdx(i);
              else if (STEP_KEYS.slice(stepIdx, i).every((s) => stepValid(s)))
                setStepIdx(i);
            }}
          />
        </div>

        {/* Step body */}
        <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-5 sm:p-6">
          {step === "client" && (
            <div className="space-y-5">
              <StepTitle
                title="Who is the client?"
                subtitle="The person who contacted you. The link will be tied to their phone number."
              />
              <FormGroup label="Full name" required>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Nino Beridze"
                  leftIcon={<User className="h-4 w-4" />}
                />
              </FormGroup>
              <FormGroup
                label="Phone number"
                required
                hint="Used to match or create the client's account."
              >
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+995 5XX XX XX XX"
                  inputMode="tel"
                  leftIcon={<Phone className="h-4 w-4" />}
                />
              </FormGroup>
              <FormGroup label="Email" optional>
                <Input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="name@example.com"
                  inputMode="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                />
              </FormGroup>

              {clientHits.length > 0 && (
                <div className="rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] p-2">
                  <p className="px-2 py-1 text-[12px] font-medium text-[var(--hm-fg-muted)]">
                    Existing clients — tap to use
                  </p>
                  {clientHits.map((hit) => (
                    <button
                      key={userId(hit)}
                      type="button"
                      onClick={() => selectClient(hit)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-[var(--hm-bg-elevated)]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hm-brand-500)]/15 text-[12px] font-semibold text-[var(--hm-brand-500)]">
                        {(hit.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] text-[var(--hm-fg-primary)]">
                          {hit.name || "—"}
                        </span>
                        <span className="block truncate text-[12px] text-[var(--hm-fg-muted)]">
                          {hit.phone}
                          {hit.email ? ` · ${hit.email}` : ""}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {clientHits.length === 0 && clientSearched && (
                <p className="rounded-xl border border-dashed border-[var(--hm-border-subtle)] px-3 py-2.5 text-[13px] text-[var(--hm-fg-muted)]">
                  No existing client found — a new account will be created for
                  this phone number.
                </p>
              )}
            </div>
          )}

          {step === "service" && (
            <div className="space-y-5">
              <StepTitle
                title="What service do they need?"
                subtitle="Pick the category, then the specific services."
              />
              <JobServicePicker
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
              />

              {/* Optional: invite specific pros directly */}
              <div className="rounded-2xl border border-dashed border-[var(--hm-border-subtle)] p-4">
                <p className="text-[14px] font-medium text-[var(--hm-fg-primary)]">
                  Invite specific pros{" "}
                  <span className="text-[var(--hm-fg-muted)]">(optional)</span>
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--hm-fg-muted)]">
                  They&apos;ll be notified in addition to the open marketplace.
                </p>

                {invitedPros.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {invitedPros.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hm-brand-500)]/12 px-2.5 py-1 text-[13px] text-[var(--hm-fg-primary)]"
                      >
                        {p.name}
                        <button
                          type="button"
                          onClick={() => removePro(p.id)}
                          aria-label="Remove pro"
                        >
                          <X className="h-3.5 w-3.5 text-[var(--hm-fg-muted)] hover:text-[var(--hm-fg-primary)]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <Input
                    value={proQuery}
                    onChange={(e) => setProQuery(e.target.value)}
                    placeholder="Search pros by name…"
                    leftIcon={<User className="h-4 w-4" />}
                  />
                  {proHits.length > 0 && (
                    <div className="mt-1.5 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] p-2">
                      {proHits.map((hit) => {
                        const id = userId(hit);
                        const already = invitedPros.some((p) => p.id === id);
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={already}
                            onClick={() => addPro(hit)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-[var(--hm-bg-elevated)] disabled:opacity-40"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--hm-brand-500)]/15 text-[12px] font-semibold text-[var(--hm-brand-500)]">
                              {(hit.name || "?").charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--hm-fg-primary)]">
                              {hit.name || "—"}
                            </span>
                            {already && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--hm-success-600)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-6">
              <StepTitle
                title="Job details"
                subtitle="Where, when, and roughly how much."
              />
              <FormGroup label="Property type">
                <PropertyTypeSelector
                  value={propertyType}
                  onChange={setPropertyType}
                  locale={lang}
                />
              </FormGroup>
              <AddressPicker
                value={location}
                onChange={(value, coords) => {
                  setLocation(value);
                  setCoordinates(coords || null);
                }}
                locale={lang}
                label="Location"
                required
              />
              <FormGroup label="Approximate area" optional hint="Square meters, if relevant.">
                <Input
                  value={areaSize}
                  onChange={(e) => setAreaSize(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 75"
                  inputMode="numeric"
                  rightIcon={<span className="text-[13px]">m²</span>}
                />
              </FormGroup>
              <FormGroup label="Description" optional hint="Anything the client mentioned.">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, access instructions, preferences…"
                  minRows={3}
                  autoResize
                />
              </FormGroup>
              <FormGroup label="When do they need it?">
                <TimingSelector value={timing} onChange={setTiming} locale={lang} />
              </FormGroup>
              <BudgetSelector
                budgetType={budgetType}
                onBudgetTypeChange={setBudgetType}
                budgetMin={budgetMin}
                onBudgetMinChange={setBudgetMin}
                budgetMax={budgetMax}
                onBudgetMaxChange={setBudgetMax}
                locale={lang}
              />
            </div>
          )}

          {step === "media" && (
            <div className="space-y-5">
              <StepTitle
                title="Photos & videos"
                subtitle="Optional, but they help pros understand the job. Up to 20 files, 10 MB each."
              />
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] px-4 py-10 text-center hover:border-[var(--hm-brand-500)]">
                <Camera className="h-8 w-8 text-[var(--hm-fg-muted)]" />
                <span className="text-[14px] font-medium text-[var(--hm-fg-primary)]">
                  Add photos or videos
                </span>
                <span className="text-[12px] text-[var(--hm-fg-muted)]">
                  Tap to choose from this device
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onPickMedia(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>

              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {media.map((m, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)]"
                    >
                      {m.isVideo ? (
                        <video src={m.preview} className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.preview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-5">
              <StepTitle
                title="Review before generating"
                subtitle="Check everything, then generate the link to send to the client."
              />
              <ReviewRow label="Client" value={`${clientName} · ${clientPhone}${clientEmail ? ` · ${clientEmail}` : ""}`} />
              <ReviewRow label="Services" value={serviceNames.join(", ") || "—"} />
              <ReviewRow label="Location" value={location || "—"} />
              {areaSize && <ReviewRow label="Area" value={`${areaSize} m²`} />}
              <ReviewRow
                label="Budget"
                value={
                  budgetType === "negotiable"
                    ? "Negotiable"
                    : `${budgetMin || "?"}${budgetMax ? ` – ${budgetMax}` : ""} ₾`
                }
              />
              {description && <ReviewRow label="Description" value={description} />}
              {invitedPros.length > 0 && (
                <ReviewRow
                  label="Invited pros"
                  value={invitedPros.map((p) => p.name).join(", ")}
                />
              )}
              <ReviewRow
                label="Media"
                value={media.length ? `${media.length} file(s)` : "None"}
              />

              <div className="flex items-start gap-2 rounded-xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-tertiary)] p-3">
                <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hm-fg-muted)]" />
                <p className="text-[13px] text-[var(--hm-fg-secondary)]">
                  The client will be able to edit some fields and must confirm before
                  the job is created.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={goBack}
            disabled={stepIdx === 0}
          >
            Back
          </Button>

          {step !== "review" ? (
            <Button
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={goNext}
              disabled={!stepValid(step)}
            >
              Continue
            </Button>
          ) : (
            <Button
              leftIcon={<Link2 className="h-4 w-4" />}
              onClick={handleGenerate}
              loading={generating}
            >
              Generate link
            </Button>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

interface Draft {
  id: string;
  status: "pending" | "approved" | "expired" | "cancelled";
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  category: string;
  clientPath: string;
  createdAt?: string;
  expiresAt?: string;
  approvedAt?: string;
  createdJobId?: string;
}

const STATUS_STYLE: Record<
  Draft["status"],
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-[var(--hm-warning-500)]/15 text-[var(--hm-warning-600)]",
    Icon: Clock,
  },
  approved: {
    label: "Approved",
    className:
      "bg-[var(--hm-success-500)]/15 text-[var(--hm-success-600)]",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    className: "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]",
    Icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[var(--hm-bg-tertiary)] text-[var(--hm-fg-muted)]",
    Icon: Ban,
  },
};

function DraftsList() {
  const toast = useToast();
  const [rows, setRows] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/assisted-jobs")
      .then((r) => setRows((r.data as Draft[]) || []))
      .catch(() => toast.error("Couldn't load the list."))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const copyLink = async (path: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const cancelDraft = async (id: string) => {
    try {
      await api.post(`/assisted-jobs/${id}/cancel`);
      toast.success("Request cancelled.");
      load();
    } catch {
      toast.error("Couldn't cancel this request.");
    }
  };

  const sendDraftLink = async (id: string, channel: "sms" | "email") => {
    if (sendingId) return;
    setSendingId(id + channel);
    try {
      await api.post(`/assisted-jobs/${id}/send`, { channel });
      toast.success(channel === "sms" ? "Link sent by SMS." : "Link sent by email.");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Couldn't send the link.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--hm-brand-500)]" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-10 text-center text-[14px] text-[var(--hm-fg-secondary)]">
        No links generated yet. Create one from the “New request” tab.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((d) => {
        const s = STATUS_STYLE[d.status] ?? STATUS_STYLE.pending;
        return (
          <div
            key={d.id}
            className="rounded-2xl border border-[var(--hm-border-subtle)] bg-[var(--hm-bg-elevated)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[var(--hm-fg-primary)]">
                  {d.clientName}
                </p>
                <p className="text-[13px] text-[var(--hm-fg-muted)]">
                  {d.clientPhone} · {d.category}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.className}`}
              >
                <s.Icon className="h-3 w-3" />
                {s.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {d.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() => copyLink(d.clientPath)}
                  >
                    Copy link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                    onClick={() => sendDraftLink(d.id, "sms")}
                    loading={sendingId === d.id + "sms"}
                    disabled={!!sendingId}
                  >
                    SMS
                  </Button>
                  {d.clientEmail && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Mail className="h-3.5 w-3.5" />}
                      onClick={() => sendDraftLink(d.id, "email")}
                      loading={sendingId === d.id + "email"}
                      disabled={!!sendingId}
                    >
                      Email
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Ban className="h-3.5 w-3.5" />}
                    onClick={() => cancelDraft(d.id)}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {d.status === "approved" && d.createdJobId && (
                <a
                  href={`/ge/jobs/${d.createdJobId}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hm-border-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--hm-fg-secondary)] hover:bg-[var(--hm-bg-tertiary)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View job
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold text-[var(--hm-fg-primary)]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-[13px] text-[var(--hm-fg-secondary)]">{subtitle}</p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[var(--hm-border-subtle)] pb-3 last:border-0">
      <span className="w-28 shrink-0 text-[13px] font-medium text-[var(--hm-fg-muted)]">
        {label}
      </span>
      <span className="flex-1 text-[14px] text-[var(--hm-fg-primary)]">{value}</span>
    </div>
  );
}

export default function AssistedJobPage() {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <AssistedJobContent />
    </AuthGuard>
  );
}
