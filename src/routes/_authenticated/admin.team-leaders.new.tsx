import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { RoleGuard } from "@/components/aawash/AuthGuard";
import { AdminShell } from "@/components/aawash/admin/AdminShell";
import { createTeamLeaderFull } from "@/lib/team-leaders.functions";

export const Route = createFileRoute("/_authenticated/admin/team-leaders/new")({
  component: Page,
  head: () => ({
    meta: [
      { title: "New Team Leader — Aawash Admin" },
      { name: "description", content: "Create a new Aawash team leader account — each leader automatically gets their own numbered team." },
      { property: "og:title", content: "New Team Leader — Aawash Admin" },
      { property: "og:description", content: "Private admin page for creating Aawash team leader accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Page() {
  return (
    <RoleGuard allow={["super_admin"]}>
      <Content />
    </RoleGuard>
  );
}

function Content() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createTeamLeaderFull);

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ loginId: string; teamLetter: string } | null>(null);

  const canSubmit =
    !submitting &&
    fullName.trim().length >= 2 &&
    /^\d{10}$/.test(mobile) &&
    password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await createFn({
        data: {
          fullName: fullName.trim(),
          mobile: mobile.trim(),
          password,
          teamId: "new",
          teamName: teamName.trim() || undefined,
          email: email.trim(),
          address: address.trim(),
          avatarUrl: avatarUrl.trim(),
          joiningDate,
          remarks: remarks.trim(),
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "team-leaders"] }),
        qc.invalidateQueries({ queryKey: ["admin", "team-limits"] }),
        qc.invalidateQueries({ queryKey: ["admin", "members"] }),
        qc.invalidateQueries({ queryKey: ["admin", "overview"] }),
      ]);
      toast.success(`Team Leader created for Team ${res.teamLetter}`);
      setSuccess({ loginId: res.loginId, teamLetter: res.teamLetter });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create Team Leader";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <AdminShell profile={profile}>
        <div className="glass-card mx-auto mt-10 max-w-lg rounded-4xl p-8 text-center shadow-[var(--shadow-float)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-leaf/15 text-leaf">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-foreground">Team Leader created</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Team <span className="font-bold text-foreground">{success.teamLetter}</span> was created
            automatically and is now active. Share these credentials securely.
          </p>
          <div className="mt-5 rounded-2xl border border-border bg-surface p-4 text-left">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Login ID
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-foreground">{success.loginId}</div>
            <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-foreground">{password}</div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Link
              to="/admin/team-leaders"
              className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-semibold text-foreground"
            >
              Back to list
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setFullName("");
                setMobile("");
                setPassword("");
                setTeamName("");
                setEmail("");
                setAddress("");
                setAvatarUrl("");
                setJoiningDate("");
                setRemarks("");
              }}
              className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              Add another
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell profile={profile}>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/admin/team-leaders" })}
          className="glass-card grid h-10 w-10 place-items-center rounded-2xl text-foreground shadow-[var(--shadow-soft)]"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="glass-card inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
            <Sparkles size={12} className="text-gold" />
            Unlimited Team Leaders
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground">Add a Team Leader</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every leader automatically gets a brand-new numbered team — no picking required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <section className="glass-card rounded-4xl p-6 shadow-[var(--shadow-soft)] lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Identity
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name*" value={fullName} onChange={setFullName} placeholder="Riya Sharma" />
            <Field
              label="Mobile (10 digits)*"
              value={mobile}
              onChange={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              hint="Becomes the Login ID"
              mono
            />
            <Field
              label="Password*"
              value={password}
              onChange={setPassword}
              placeholder="Minimum 8 characters"
              type="password"
            />
            <Field label="Email (optional)" value={email} onChange={setEmail} placeholder="riya@example.com" />
            <Field
              label="Joining date"
              value={joiningDate}
              onChange={setJoiningDate}
              type="date"
            />
            <Field
              label="Avatar URL"
              value={avatarUrl}
              onChange={setAvatarUrl}
              placeholder="https://…"
            />
          </div>
          <div className="mt-4 grid gap-4">
            <Field
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="City, state, or full address"
              multiline
            />
            <Field
              label="Remarks (internal)"
              value={remarks}
              onChange={setRemarks}
              placeholder="Onboarding notes for admin reference"
              multiline
            />
          </div>
        </section>

        <aside className="glass-card flex flex-col gap-5 rounded-4xl p-6 shadow-[var(--shadow-soft)]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Team
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              A new team (Team 4, Team 5 …) is created automatically for this leader — one leader,
              one team. Members you add later join this team.
            </p>
          </div>
          <Field
            label="Team display name (optional)"
            value={teamName}
            onChange={setTeamName}
            placeholder="Leave empty to use the team number"
          />

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {submitting ? "Creating…" : "Create Team Leader"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Login ID auto-generated from mobile number. Credentials will be shown once on success.
          </p>
        </aside>
      </form>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  mono,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-1 block w-full resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`mt-1 block w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary ${mono ? "font-mono" : ""}`}
        />
      )}
      {hint && <span className="mt-1 block text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
