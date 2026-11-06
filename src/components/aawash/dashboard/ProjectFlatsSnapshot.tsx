import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronRight, Home, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProjectFlats, type ProjectFlatCard } from "@/lib/project-flats";

type ProjectLike = {
  id: string;
  name: string;
  slug: string;
  location?: string | null;
  total_flats?: number | null;
  available_flats?: number | null;
  reserved_flats?: number | null;
  sold_flats?: number | null;
  extra?: unknown;
};

type FloorSummary = {
  id: string;
  number: number;
  name: string | null;
  flats: { unit_code: string; status: string }[];
};

export function ProjectFlatsSnapshot({ projects }: { projects: ProjectLike[] }) {
  if (!projects.length) {
    return (
      <div className="rounded-[22px] bg-surface-warm p-4 text-sm text-muted-foreground">
        Flats will appear here when projects are published.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.slice(0, 4).map((project) => (
        <ProjectFlatsRow key={project.id} project={project} />
      ))}
    </div>
  );
}

function ProjectFlatsRow({ project }: { project: ProjectLike }) {
  const flats = getProjectFlats(project.extra);
  const available = Number(project.available_flats ?? 0);
  const total = Number(project.total_flats ?? 0);
  const reserved = Number(project.reserved_flats ?? 0);
  const sold = Number(project.sold_flats ?? 0);

  return (
    <div className="min-w-0 rounded-[22px] border border-border/70 bg-surface-warm p-3">
      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        className="flex min-h-14 items-center gap-3 rounded-2xl px-1 transition-transform active:scale-[0.98]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Building2 size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">{project.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {available} of {total} available{project.location ? ` · ${project.location}` : ""}
          </div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold">
        <Status label="Available" value={available} tone="text-success" />
        <Status label="Reserved" value={reserved} tone="text-warning" />
        <Status label="Sold" value={sold} tone="text-destructive" />
      </div>

      <FloorRail projectId={project.id} />

      <SectionLabel>Flat types</SectionLabel>
      <Rail label={`${project.name} flat types`}>
        {flats.map((flat) => (
          <FlatPlan key={`${project.id}-${flat.title}`} flat={flat} />
        ))}
      </Rail>
    </div>
  );
}

function FloorRail({ projectId }: { projectId: string }) {
  const floors = useQuery({
    queryKey: ["dashboard-floor-rail", projectId],
    staleTime: 60_000,
    queryFn: async (): Promise<FloorSummary[]> => {
      const { data, error } = await supabase
        .from("floors")
        .select("id, number, name, flats(unit_code, status)")
        .eq("project_id", projectId)
        .order("number");
      if (error) throw error;
      return (data ?? []) as FloorSummary[];
    },
  });

  if (floors.isLoading) {
    return (
      <>
        <SectionLabel>Floors</SectionLabel>
        <div className="flex gap-2.5 overflow-hidden">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 w-[62%] shrink-0 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </>
    );
  }
  if (!floors.data?.length) return null;

  return (
    <>
      <SectionLabel>
        Floors <span className="font-medium normal-case tracking-normal">· swipe</span>
      </SectionLabel>
      <Rail label="Floors">
        {floors.data.map((floor) => {
          const flats = [...floor.flats].sort((a, b) => a.unit_code.localeCompare(b.unit_code, undefined, { numeric: true }));
          const open = flats.filter((f) => f.status === "available").length;
          return (
            <div key={floor.id} className="w-[62%] max-w-[15rem] shrink-0 snap-start rounded-2xl border border-border/60 bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-foreground">
                  <Layers size={14} className="shrink-0 text-primary" />
                  <span className="truncate">{floor.name || `Floor ${floor.number}`}</span>
                </div>
                <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
                  {open}/{flats.length}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {flats.map((f) => (
                  <span
                    key={f.unit_code}
                    className={`grid h-10 place-items-center rounded-xl text-xs font-bold ${flatTone(f.status)}`}
                    title={`${f.unit_code} · ${f.status}`}
                  >
                    {f.unit_code}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </Rail>
    </>
  );
}

function flatTone(status: string) {
  if (status === "available") return "bg-success/15 text-success";
  if (status === "reserved" || status === "blocked") return "bg-warning/15 text-warning";
  if (status === "sold") return "bg-destructive/12 text-destructive";
  return "bg-muted text-muted-foreground";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </div>
  );
}

function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      role="list"
      aria-label={label}
      className="-mx-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}

function Status({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex min-h-14 flex-col justify-center rounded-xl bg-surface px-2 py-2">
      <div className={tone}>{label}</div>
      <div className="mt-0.5 text-base font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function FlatPlan({ flat }: { flat: ProjectFlatCard }) {
  return (
    <div role="listitem" className="w-[62%] max-w-[15rem] shrink-0 snap-start overflow-hidden rounded-2xl border border-border/60 bg-surface">
      <div className="relative aspect-[16/10] bg-primary-soft">
        {flat.image ? (
          <img src={flat.image} alt={`${flat.title} plan`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-primary">
            <Home size={18} />
          </div>
        )}
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-bold text-foreground">
          {flat.title}
        </span>
      </div>
      <div className="p-3">
        <div className="text-xs font-bold text-foreground">{flat.area}</div>
        <div className="mt-1 space-y-1">
          {flat.amenities.slice(0, 2).map((amenity) => (
            <div key={amenity} className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Check size={11} className="shrink-0 text-primary" />
              <span className="truncate">{amenity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
