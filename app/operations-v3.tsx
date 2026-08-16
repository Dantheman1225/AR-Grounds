"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  AppState,
  CapturedLocation,
  CrewMember,
  CrewRole,
  PaymentRecord,
  PaymentStatus,
  ProofKind,
  ProofRecord,
  QcStatus,
  ReadinessStatus,
  ServiceTicket,
  TicketStatus,
  TimeEntry,
  TimeEntryType,
  Visit,
  VisitAssignment,
  VisitKind,
  VisitStatus,
  WorkStatus,
} from "../lib/types";

export type OperationsMode = "visits" | "schedule" | "crew" | "finance";
type Mutator = (change: (current: AppState) => AppState) => void;

const VISIT_META: Record<VisitStatus, { label: string; color: string }> = {
  planned: { label: "Planned", color: "#617168" },
  "checked-in": { label: "Checked in", color: "#397fb6" },
  "in-progress": { label: "Working", color: "#d8892f" },
  "completed-exceptions": { label: "Completed with exceptions", color: "#b15545" },
  "ready-qc": { label: "Ready for QC", color: "#6a59a4" },
  closed: { label: "Closed", color: "#2f8551" },
  cancelled: { label: "Cancelled", color: "#8a8f8b" },
};

const QC_META: Record<QcStatus, string> = {
  "not-started": "Not started",
  pending: "Pending inspection",
  passed: "Passed",
  rejected: "Rejected / rework",
};

const PAYMENT_META: Record<PaymentStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#79837d" },
  "submitted-to-amb": { label: "Submitted to AMB", color: "#397fb6" },
  "awaiting-government": { label: "Awaiting government", color: "#b1792d" },
  "government-paid": { label: "Government paid AMB", color: "#7d5ba5" },
  "paid-to-grounds": { label: "Paid to Grounds", color: "#2f8551" },
  disputed: { label: "Disputed", color: "#ad3e47" },
};

const READINESS_OPTIONS: ReadinessStatus[] = ["missing", "in-progress", "ready", "not-applicable"];
const PROOF_OPTIONS: Array<{ value: ProofKind; label: string }> = [
  { value: "arrival", label: "Arrival" },
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "overview", label: "Overview" },
  { value: "exception", label: "Exception" },
  { value: "damage", label: "Damage / condition" },
];

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function chicagoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "Not recorded";
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function durationHours(entry: TimeEntry) {
  const start = new Date(entry.startAt).getTime();
  const end = entry.endAt ? new Date(entry.endAt).getTime() : Date.now();
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, (end - start) / 3_600_000) : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

async function captureLocation(): Promise<CapturedLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        capturedAt: new Date().toISOString(),
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60_000 },
    );
  });
}

function visitHours(state: AppState, visitId: string, type?: TimeEntryType) {
  return state.timeEntries
    .filter((entry) => entry.visitId === visitId && (!type || entry.type === type))
    .reduce((sum, entry) => sum + durationHours(entry), 0);
}

function visitLaborCost(state: AppState, visitId: string) {
  return state.timeEntries
    .filter((entry) => entry.visitId === visitId && entry.type === "production")
    .reduce((sum, entry) => {
      const rate = state.crew.find((member) => member.id === entry.crewMemberId)?.hourlyRate ?? 0;
      return sum + durationHours(entry) * rate;
    }, 0);
}

function VisitPill({ status }: { status: VisitStatus }) {
  return <span className="gc3-pill" style={{ "--gc3-tone": VISIT_META[status].color } as React.CSSProperties}>{VISIT_META[status].label}</span>;
}

function NewVisitModal({ state, defaultSiteId, onClose, onCreate }: {
  state: AppState;
  defaultSiteId: string;
  onClose: () => void;
  onCreate: (visit: Visit) => void;
}) {
  const [siteId, setSiteId] = useState(defaultSiteId);
  const site = state.sites.find((candidate) => candidate.id === siteId) ?? state.sites[0];
  const [date, setDate] = useState(site.nextVisit ?? chicagoDateKey());
  const [kind, setKind] = useState<VisitKind>("recurring");
  const [windowStart, setWindowStart] = useState("07:30");
  const [windowEnd, setWindowEnd] = useState("16:00");
  const [crewIds, setCrewIds] = useState(state.crew.filter((member) => member.active).map((member) => member.id));
  const [includeOpen, setIncludeOpen] = useState(true);
  const [notes, setNotes] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    const assignments: VisitAssignment[] = includeOpen ? [
      ...state.features.filter((feature) => feature.siteId === siteId && feature.status !== "standard").map((feature) => ({
        id: makeId("assignment"), sourceType: "feature" as const, sourceId: feature.id,
        title: `${feature.code} · ${feature.name}`, assigneeIds: crewIds, status: feature.status, notes: feature.notes,
      })),
      ...state.tasks.filter((task) => task.siteId === siteId && task.status !== "standard").map((task) => ({
        id: makeId("assignment"), sourceType: "task" as const, sourceId: task.id,
        title: task.title, assigneeIds: crewIds, status: task.status, notes: task.notes,
      })),
    ] : [];
    if (!assignments.length) assignments.push({
      id: makeId("assignment"), sourceType: "custom", sourceId: null,
      title: "Complete scheduled grounds service and PWS closeout", assigneeIds: crewIds,
      status: kind === "recovery" ? "recovery" : "unassessed", notes: "",
    });
    onCreate({
      id: makeId("visit"), siteId, scheduledDate: date, windowStart, windowEnd,
      lunchStart: "11:30", lunchEnd: "12:00", kind, status: "planned", crewIds, assignments,
      checkInAt: null, startWorkAt: null, completedAt: null, checkOutAt: null,
      checkInLocation: null, checkOutLocation: null, exceptionNotes: "", qcStatus: "not-started",
      qcNotes: "", qcAt: null, serviceTicketId: null, notes, createdAt: now, updatedAt: now,
    });
  }

  function toggleCrew(id: string) {
    setCrewIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="gc-modal-backdrop" onPointerDown={onClose}>
      <form className="gc-modal gc3-modal" onSubmit={submit} onPointerDown={(event) => event.stopPropagation()}>
        <header><div><p className="gc-eyebrow">Daily operations</p><h2>Schedule a site visit</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
        <div className="gc-form-grid two">
          <label><span>Location</span><select value={siteId} onChange={(event) => { const value = event.target.value; setSiteId(value); const next = state.sites.find((item) => item.id === value)?.nextVisit; if (next) setDate(next); }}>{state.sites.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.city}</option>)}</select></label>
          <label><span>Scheduled date</span><input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label><span>Visit type</span><select value={kind} onChange={(event) => setKind(event.target.value as VisitKind)}><option value="recovery">Recovery</option><option value="recurring">Recurring service</option><option value="corrective">Corrective action</option><option value="inspection">Inspection / QC</option></select></label>
          <label><span>Work window</span><div className="gc3-inline-inputs"><input type="time" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} /><input type="time" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} /></div></label>
        </div>
        <fieldset className="gc3-crew-picker"><legend>Assigned crew</legend>{state.crew.filter((member) => member.active).map((member) => <button type="button" key={member.id} className={crewIds.includes(member.id) ? "active" : ""} onClick={() => toggleCrew(member.id)}><span>{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>{member.name}<small>{member.role.replace("-", " ")}</small></button>)}</fieldset>
        <label className="gc3-check"><input type="checkbox" checked={includeOpen} onChange={(event) => setIncludeOpen(event.target.checked)} /><span><strong>Pull in current open mapped work</strong><small>Creates visit assignments from this site&apos;s open features and quick tasks.</small></span></label>
        <label className="gc-full-field"><span>Visit notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Access plan, equipment, special instructions..." /></label>
        <footer><button type="button" className="gc-button secondary" onClick={onClose}>Cancel</button><button type="submit" className="gc-button primary" disabled={!date || !crewIds.length}>Schedule visit</button></footer>
      </form>
    </div>
  );
}

function CrewModal({ member, onClose, onSave }: { member: CrewMember | null; onClose: () => void; onSave: (member: CrewMember) => void }) {
  const now = new Date().toISOString();
  const [form, setForm] = useState<CrewMember>(() => member ?? {
    id: makeId("crew"), name: "", role: "worker", phone: "", hourlyRate: 15, active: true,
    eVerify: "in-progress", badge: "in-progress", siteAccess: "in-progress", training: "in-progress",
    authorizedDriver: false, notes: "", createdAt: now, updatedAt: now,
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim(), updatedAt: new Date().toISOString() });
  }
  return (
    <div className="gc-modal-backdrop" onPointerDown={onClose}>
      <form className="gc-modal gc3-modal" onSubmit={submit} onPointerDown={(event) => event.stopPropagation()}>
        <header><div><p className="gc-eyebrow">Crew record</p><h2>{member ? "Edit crew member" : "Add crew member"}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
        <div className="gc-form-grid two">
          <label><span>Name *</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label><span>Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as CrewRole })}><option value="owner">Owner</option><option value="crew-lead">Crew lead</option><option value="worker">Worker</option><option value="specialty">Specialty operator</option></select></label>
          <label><span>Phone</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label><span>Hourly rate</span><input type="number" min="0" step="0.01" value={form.hourlyRate ?? ""} onChange={(event) => setForm({ ...form, hourlyRate: event.target.value === "" ? null : Number(event.target.value) })} /></label>
          {(["eVerify", "badge", "siteAccess", "training"] as const).map((field) => <label key={field}><span>{field === "eVerify" ? "E-Verify" : field === "siteAccess" ? "Site access" : field.charAt(0).toUpperCase() + field.slice(1)}</span><select value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value as ReadinessStatus })}>{READINESS_OPTIONS.map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></label>)}
        </div>
        <div className="gc3-check-row"><label className="gc3-check compact"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span><strong>Active crew member</strong></span></label><label className="gc3-check compact"><input type="checkbox" checked={form.authorizedDriver} onChange={(event) => setForm({ ...form, authorizedDriver: event.target.checked })} /><span><strong>Authorized driver</strong></span></label></div>
        <label className="gc-full-field"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <footer><button type="button" className="gc-button secondary" onClick={onClose}>Cancel</button><button type="submit" className="gc-button primary">Save crew member</button></footer>
      </form>
    </div>
  );
}

export function OperationsSnapshot({ state, onOpen, onOpenVisit }: { state: AppState; onOpen: () => void; onOpenVisit: (id: string) => void }) {
  const today = chicagoDateKey();
  const visits = state.visits.filter((visit) => visit.scheduledDate === today && visit.status !== "cancelled").sort((a, b) => a.windowStart.localeCompare(b.windowStart));
  const readyQc = state.visits.filter((visit) => visit.status === "ready-qc" || visit.status === "completed-exceptions").length;
  const active = visits.filter((visit) => visit.status === "checked-in" || visit.status === "in-progress").length;
  return (
    <section className="gc3-snapshot gc-card">
      <header className="gc-section-header"><div><p className="gc-eyebrow">Today&apos;s field operation</p><h2>{visits.length ? `${visits.length} scheduled visit${visits.length === 1 ? "" : "s"}` : "No visit scheduled today"}</h2></div><button type="button" className="gc-button secondary" onClick={onOpen}>Open daily operations</button></header>
      <div className="gc3-snapshot-grid">
        <div className="gc3-snapshot-kpis"><article><strong>{visits.length}</strong><span>Scheduled</span></article><article><strong>{active}</strong><span>Onsite / working</span></article><article><strong>{readyQc}</strong><span>Waiting for QC</span></article></div>
        <div className="gc3-today-list">{visits.length ? visits.slice(0, 4).map((visit) => { const site = state.sites.find((item) => item.id === visit.siteId); return <button type="button" key={visit.id} onClick={() => onOpenVisit(visit.id)}><span className="gc-site-code small">{site?.code}</span><div><strong>{site?.city}</strong><small>{visit.windowStart}–{visit.windowEnd} · {visit.crewIds.length} crew · {visit.assignments.length} assignments</small></div><VisitPill status={visit.status} /><i>→</i></button>; }) : <div className="gc-empty compact"><strong>Plan the day before the crew rolls out.</strong><p>Create a visit, assign map work, and use it through closeout.</p></div>}</div>
      </div>
    </section>
  );
}

export function ServiceTicketPrint({ state, visitId, active }: { state: AppState; visitId: string | null; active: boolean }) {
  const visit = state.visits.find((item) => item.id === visitId);
  const site = visit ? state.sites.find((item) => item.id === visit.siteId) : null;
  const ticket = visit?.serviceTicketId ? state.serviceTickets.find((item) => item.id === visit.serviceTicketId) : null;
  if (!visit || !site || !ticket) return null;
  const crew = visit.crewIds.map((id) => state.crew.find((member) => member.id === id)?.name).filter(Boolean).join(", ");
  const proofs = state.proofs.filter((proof) => proof.visitId === visit.id);
  return (
    <section className={cx("gc-ticket-sheet", !active && "gc-print-hidden")}>
      <header><div><p>Grounds Maintenance LLC</p><h1>Grounds Service Ticket</h1><span>{ticket.ticketNumber}</span></div><img src="/brand/grounds-mark.jpg" alt="" /></header>
      <div className="gc-ticket-ident"><div><span>Location</span><strong>{site.code} · {site.name}</strong><small>{site.address}</small></div><div><span>Service date</span><strong>{formatDate(visit.scheduledDate)}</strong><small>{visit.windowStart}–{visit.windowEnd}</small></div><div><span>Visit type</span><strong>{visit.kind.charAt(0).toUpperCase() + visit.kind.slice(1)}</strong><small>{VISIT_META[visit.status].label}</small></div></div>
      <section><h2>Services performed</h2><p>{ticket.servicesSummary || visit.assignments.map((item) => item.title).join("; ")}</p><div className="gc-ticket-stats"><span><b>{visit.assignments.length}</b> assignments</span><span><b>{visitHours(state, visit.id, "production").toFixed(2)}</b> production hours</span><span><b>{proofs.length}</b> supporting photos</span></div></section>
      <section><h2>Exceptions / conditions</h2><p>{ticket.exceptions || visit.exceptionNotes || "No exceptions recorded."}</p></section>
      <section><h2>Crew and closeout</h2><p><strong>Crew:</strong> {crew || "Not recorded"}</p><p><strong>QC:</strong> {QC_META[visit.qcStatus]}{visit.qcNotes ? ` — ${visit.qcNotes}` : ""}</p><p><strong>Supporting records:</strong> photos, time entries, mapped assignments, and QC remain stored in Grounds Command.</p></section>
      <div className="gc-ticket-signatures"><div><span>Contractor representative</span><strong>{ticket.contractorSignedBy || ""}</strong><small>{formatDate(ticket.contractorSignedAt, true)}</small></div><div><span>Government / COR / DR representative</span><strong>{ticket.governmentSignedBy || ""}</strong><small>{formatDate(ticket.governmentSignedAt, true)}</small></div></div>
      <aside><strong>Signature acknowledgment</strong><p>The government signature documents that Grounds Maintenance was onsite. It does not, by itself, constitute acceptance of the services or a PWS pass. Acceptance remains a separate inspection decision.</p></aside>
      <footer><span>Generated by Grounds Command</span><span>{ticket.status.toUpperCase()} · {ticket.acceptanceStatus.replace("-", " ").toUpperCase()}</span></footer>
    </section>
  );
}

export default function OperationsV3({
  mode,
  state,
  ownerName,
  selectedVisitId,
  onSelectVisit,
  onMutate,
  onOpenMap,
  onOpenFinance,
  onPrintTicket,
}: {
  mode: OperationsMode;
  state: AppState;
  ownerName: string;
  selectedVisitId: string | null;
  onSelectVisit: (id: string | null) => void;
  onMutate: Mutator;
  onOpenMap: (siteId: string, featureId?: string | null) => void;
  onOpenFinance: () => void;
  onPrintTicket: (visitId: string) => void;
}) {
  const [visitModal, setVisitModal] = useState(false);
  const [crewModal, setCrewModal] = useState<CrewMember | "new" | null>(null);
  const [visitTab, setVisitTab] = useState<"assignments" | "time" | "proof" | "closeout">("assignments");
  const [proofKind, setProofKind] = useState<ProofKind>("after");
  const [proofAssignmentId, setProofAssignmentId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<"upcoming" | "all" | "qc">("upcoming");

  const sortedVisits = useMemo(() => [...state.visits].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.windowStart.localeCompare(b.windowStart)), [state.visits]);
  const filteredVisits = sortedVisits.filter((visit) => scheduleFilter === "all" ? true : scheduleFilter === "qc" ? visit.status === "ready-qc" || visit.status === "completed-exceptions" : visit.scheduledDate >= chicagoDateKey() && visit.status !== "cancelled");
  const scheduleGroups = Array.from(filteredVisits.reduce((groups, visit) => {
    const current = groups.get(visit.scheduledDate) ?? [];
    current.push(visit);
    groups.set(visit.scheduledDate, current);
    return groups;
  }, new Map<string, Visit[]>()).entries());
  const selectedVisit = state.visits.find((visit) => visit.id === selectedVisitId) ?? filteredVisits[0] ?? sortedVisits[0] ?? null;
  const selectedSite = selectedVisit ? state.sites.find((site) => site.id === selectedVisit.siteId) ?? null : null;
  const selectedEntries = selectedVisit ? state.timeEntries.filter((entry) => entry.visitId === selectedVisit.id).sort((a, b) => b.startAt.localeCompare(a.startAt)) : [];
  const selectedProofs = selectedVisit ? state.proofs.filter((proof) => proof.visitId === selectedVisit.id).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)) : [];
  const selectedTicket = selectedVisit?.serviceTicketId ? state.serviceTickets.find((ticket) => ticket.id === selectedVisit.serviceTicketId) ?? null : null;
  const selectedPayment = selectedTicket ? state.payments.find((payment) => payment.serviceTicketId === selectedTicket.id) ?? null : null;
  const openEntryType = selectedVisit ? state.timeEntries.find((entry) => entry.visitId === selectedVisit.id && !entry.endAt)?.type ?? null : null;

  function changeState(change: (current: AppState) => AppState) {
    onMutate(change);
  }

  function updateVisit(visitId: string, patch: Partial<Visit>) {
    const now = new Date().toISOString();
    changeState((current) => ({ ...current, visits: current.visits.map((visit) => visit.id === visitId ? { ...visit, ...patch, updatedAt: now } : visit) }));
  }

  function rescheduleVisit(visit: Visit, scheduledDate: string) {
    const now = new Date().toISOString();
    changeState((current) => ({
      ...current,
      visits: current.visits.map((item) => item.id === visit.id ? { ...item, scheduledDate, updatedAt: now } : item),
      sites: current.sites.map((site) => site.id === visit.siteId ? { ...site, nextVisit: scheduledDate } : site),
    }));
  }

  function toggleVisitCrew(visit: Visit, crewId: string) {
    const adding = !visit.crewIds.includes(crewId);
    const crewIds = adding ? [...visit.crewIds, crewId] : visit.crewIds.filter((id) => id !== crewId);
    const assignments = visit.assignments.map((assignment) => ({
      ...assignment,
      assigneeIds: adding
        ? [...new Set([...assignment.assigneeIds, crewId])]
        : assignment.assigneeIds.filter((id) => id !== crewId),
    }));
    updateVisit(visit.id, { crewIds, assignments });
  }

  function createVisit(visit: Visit) {
    changeState((current) => ({
      ...current,
      visits: [...current.visits, visit],
      sites: current.sites.map((site) => site.id === visit.siteId ? { ...site, nextVisit: visit.scheduledDate } : site),
    }));
    onSelectVisit(visit.id);
    setVisitModal(false);
  }

  function duplicateVisit(visit: Visit) {
    const date = new Date(`${visit.scheduledDate}T12:00:00`);
    date.setDate(date.getDate() + 14);
    const now = new Date().toISOString();
    const copy: Visit = {
      ...visit,
      id: makeId("visit"),
      scheduledDate: chicagoDateKey(date),
      status: "planned",
      assignments: visit.assignments.map((item) => ({ ...item, id: makeId("assignment"), status: item.sourceType === "feature" ? "unassessed" : item.status === "standard" ? "unassessed" : item.status })),
      checkInAt: null, startWorkAt: null, completedAt: null, checkOutAt: null,
      checkInLocation: null, checkOutLocation: null, exceptionNotes: "", qcStatus: "not-started", qcNotes: "", qcAt: null,
      serviceTicketId: null, createdAt: now, updatedAt: now,
    };
    createVisit(copy);
  }

  function refreshAssignments(visit: Visit) {
    changeState((current) => {
      const existing = new Set(visit.assignments.map((assignment) => `${assignment.sourceType}:${assignment.sourceId}`));
      const additions: VisitAssignment[] = [
        ...current.features.filter((feature) => feature.siteId === visit.siteId && feature.status !== "standard" && !existing.has(`feature:${feature.id}`)).map((feature) => ({ id: makeId("assignment"), sourceType: "feature" as const, sourceId: feature.id, title: `${feature.code} · ${feature.name}`, assigneeIds: visit.crewIds, status: feature.status, notes: feature.notes })),
        ...current.tasks.filter((task) => task.siteId === visit.siteId && task.status !== "standard" && !existing.has(`task:${task.id}`)).map((task) => ({ id: makeId("assignment"), sourceType: "task" as const, sourceId: task.id, title: task.title, assigneeIds: visit.crewIds, status: task.status, notes: task.notes })),
      ];
      return { ...current, visits: current.visits.map((item) => item.id === visit.id ? { ...item, assignments: [...item.assignments, ...additions], updatedAt: new Date().toISOString() } : item) };
    });
  }

  function updateAssignment(visitId: string, assignmentId: string, patch: Partial<VisitAssignment>) {
    changeState((current) => ({ ...current, visits: current.visits.map((visit) => visit.id === visitId ? { ...visit, assignments: visit.assignments.map((assignment) => assignment.id === assignmentId ? { ...assignment, ...patch } : assignment), updatedAt: new Date().toISOString() } : visit) }));
  }

  function addCustomAssignment(visit: Visit) {
    const title = window.prompt("What exact work should be added to this visit?");
    if (!title?.trim()) return;
    updateVisit(visit.id, { assignments: [...visit.assignments, { id: makeId("assignment"), sourceType: "custom", sourceId: null, title: title.trim(), assigneeIds: visit.crewIds, status: "unassessed", notes: "" }] });
  }

  function syncSourceStatus(current: AppState, visit: Visit) {
    const featureStatus = new Map(visit.assignments.filter((assignment) => assignment.sourceType === "feature" && assignment.sourceId).map((assignment) => [assignment.sourceId as string, assignment.status]));
    const taskStatus = new Map(visit.assignments.filter((assignment) => assignment.sourceType === "task" && assignment.sourceId).map((assignment) => [assignment.sourceId as string, assignment.status]));
    return {
      ...current,
      features: current.features.map((feature) => featureStatus.has(feature.id) ? { ...feature, status: featureStatus.get(feature.id) as WorkStatus, updatedAt: new Date().toISOString() } : feature),
      tasks: current.tasks.map((task) => taskStatus.has(task.id) ? { ...task, status: taskStatus.get(task.id) as WorkStatus, updatedAt: new Date().toISOString() } : task),
    };
  }

  function addOpenEntries(current: AppState, visit: Visit, type: TimeEntryType, at: string) {
    const closed = current.timeEntries.map((entry) => entry.visitId === visit.id && !entry.endAt ? { ...entry, endAt: at } : entry);
    const additions = visit.crewIds.map((crewMemberId) => ({ id: makeId("time"), visitId: visit.id, siteId: visit.siteId, crewMemberId, type, startAt: at, endAt: null, corrected: false, correctionReason: "", notes: "" } as TimeEntry));
    return [...closed, ...additions];
  }

  function startTravel(visit: Visit) {
    const at = new Date().toISOString();
    changeState((current) => ({ ...current, timeEntries: addOpenEntries(current, visit, "travel", at) }));
  }

  async function checkIn(visit: Visit) {
    setLocationMessage("Capturing arrival location…");
    const location = await captureLocation();
    const at = new Date().toISOString();
    changeState((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) => entry.visitId === visit.id && !entry.endAt ? { ...entry, endAt: at } : entry),
      visits: current.visits.map((item) => item.id === visit.id ? { ...item, checkInAt: at, checkInLocation: location, status: "checked-in", updatedAt: at } : item),
    }));
    setLocationMessage(location ? "Arrival time and location captured." : "Arrival time captured. Location permission was unavailable.");
  }

  function startWork(visit: Visit) {
    const at = new Date().toISOString();
    changeState((current) => ({
      ...current,
      timeEntries: addOpenEntries(current, visit, "production", at),
      visits: current.visits.map((item) => item.id === visit.id ? { ...item, startWorkAt: item.startWorkAt ?? at, status: "in-progress", updatedAt: at } : item),
    }));
  }

  function startBreak(visit: Visit) {
    const at = new Date().toISOString();
    changeState((current) => ({ ...current, timeEntries: addOpenEntries(current, visit, "break", at) }));
  }

  function completeWork(visit: Visit) {
    const at = new Date().toISOString();
    const hasExceptions = Boolean(visit.exceptionNotes.trim()) || visit.assignments.some((assignment) => assignment.status === "blocked" || assignment.status === "recovery");
    changeState((current) => {
      const synced = syncSourceStatus(current, visit);
      return {
        ...synced,
        timeEntries: synced.timeEntries.map((entry) => entry.visitId === visit.id && !entry.endAt ? { ...entry, endAt: at } : entry),
        visits: synced.visits.map((item) => item.id === visit.id ? { ...item, completedAt: at, status: hasExceptions ? "completed-exceptions" : "ready-qc", qcStatus: "pending", updatedAt: at } : item),
      };
    });
    setVisitTab("closeout");
  }

  async function checkOut(visit: Visit) {
    setLocationMessage("Capturing clock-out location…");
    const location = await captureLocation();
    const at = new Date().toISOString();
    changeState((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) => entry.visitId === visit.id && !entry.endAt ? { ...entry, endAt: at } : entry),
      visits: current.visits.map((item) => item.id === visit.id ? { ...item, checkOutAt: at, checkOutLocation: location, updatedAt: at } : item),
    }));
    setLocationMessage(location ? "Clock-out time and location captured." : "Clock-out time captured. Location permission was unavailable.");
  }

  function passQc(visit: Visit) {
    const open = visit.assignments.filter((assignment) => !["standard", "ready-qc"].includes(assignment.status));
    if (open.length && !window.confirm(`${open.length} assignment(s) are not complete or ready for QC. Pass this visit anyway?`)) return;
    const now = new Date().toISOString();
    const site = state.sites.find((item) => item.id === visit.siteId);
    const existingTicket = visit.serviceTicketId ? state.serviceTickets.find((ticket) => ticket.id === visit.serviceTicketId) : null;
    const ticketId = existingTicket?.id ?? makeId("ticket");
    const ticket: ServiceTicket = existingTicket ?? {
      id: ticketId,
      visitId: visit.id,
      ticketNumber: `GC-${site?.code ?? "SITE"}-${visit.scheduledDate.replaceAll("-", "")}-${state.serviceTickets.length + 1}`,
      status: "ready",
      servicesSummary: visit.assignments.filter((assignment) => assignment.status === "standard" || assignment.status === "ready-qc").map((assignment) => assignment.title).join("; ") || visit.assignments.map((assignment) => assignment.title).join("; "),
      exceptions: visit.exceptionNotes,
      contractorSignedBy: ownerName,
      contractorSignedAt: now,
      governmentSignedBy: "",
      governmentSignedAt: null,
      acceptanceStatus: "not-reviewed",
      submittedAt: null,
      notes: "Government signature confirms onsite presence only; acceptance is tracked separately.",
      createdAt: now,
      updatedAt: now,
    };
    changeState((current) => ({
      ...current,
      visits: current.visits.map((item) => item.id === visit.id ? { ...item, status: "closed", qcStatus: "passed", qcAt: now, serviceTicketId: ticketId, updatedAt: now } : item),
      serviceTickets: current.serviceTickets.some((item) => item.id === ticketId) ? current.serviceTickets : [...current.serviceTickets, ticket],
      features: current.features.map((feature) => visit.assignments.some((assignment) => assignment.sourceType === "feature" && assignment.sourceId === feature.id) ? { ...feature, status: "standard", updatedAt: now } : feature),
      tasks: current.tasks.map((task) => visit.assignments.some((assignment) => assignment.sourceType === "task" && assignment.sourceId === task.id) ? { ...task, status: "standard", updatedAt: now } : task),
      sites: current.sites.map((item) => item.id === visit.siteId ? { ...item, lastVisit: visit.scheduledDate } : item),
    }));
  }

  function rejectQc(visit: Visit) {
    const now = new Date().toISOString();
    updateVisit(visit.id, { status: "in-progress", qcStatus: "rejected", qcAt: now });
    setVisitTab("assignments");
  }

  function updateTimeEntry(id: string, patch: Partial<TimeEntry>) {
    changeState((current) => ({ ...current, timeEntries: current.timeEntries.map((entry) => entry.id === id ? { ...entry, ...patch, corrected: true } : entry) }));
  }

  async function uploadProof(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedVisit) return;
    setUploading(true);
    setLocationMessage("Uploading proof photo…");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/proof", { method: "POST", body: form });
      const body = await response.json() as { key?: string; filename?: string; contentType?: string; error?: string };
      if (!response.ok || !body.key) throw new Error(body.error || "Upload failed.");
      const location = await captureLocation();
      const proof: ProofRecord = {
        id: makeId("proof"), visitId: selectedVisit.id, siteId: selectedVisit.siteId,
        assignmentId: proofAssignmentId || null, kind: proofKind, objectKey: body.key,
        filename: body.filename || file.name, contentType: body.contentType || file.type,
        note: proofNote, location, capturedAt: new Date().toISOString(),
      };
      changeState((current) => ({ ...current, proofs: [...current.proofs, proof] }));
      setProofNote("");
      setLocationMessage(location ? "Photo, time, and location saved." : "Photo and time saved; location was unavailable.");
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : "Unable to upload photo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function deleteProof(proof: ProofRecord) {
    if (!window.confirm("Delete this proof photo?")) return;
    await fetch(`/api/proof?key=${encodeURIComponent(proof.objectKey)}`, { method: "DELETE" });
    changeState((current) => ({ ...current, proofs: current.proofs.filter((item) => item.id !== proof.id) }));
  }

  function saveCrew(member: CrewMember) {
    changeState((current) => ({ ...current, crew: current.crew.some((item) => item.id === member.id) ? current.crew.map((item) => item.id === member.id ? member : item) : [...current.crew, member] }));
    setCrewModal(null);
  }

  function updateTicket(ticketId: string, patch: Partial<ServiceTicket>) {
    changeState((current) => ({ ...current, serviceTickets: current.serviceTickets.map((ticket) => ticket.id === ticketId ? { ...ticket, ...patch, updatedAt: new Date().toISOString() } : ticket) }));
  }

  function createPayment(ticket: ServiceTicket) {
    const visit = state.visits.find((item) => item.id === ticket.visitId);
    if (!visit) return;
    const now = new Date().toISOString();
    const payment: PaymentRecord = { id: makeId("payment"), visitId: visit.id, serviceTicketId: ticket.id, invoiceNumber: "", amount: 0, status: "draft", invoicedAt: null, governmentPaidAt: null, paidToGroundsAt: null, notes: "", createdAt: now, updatedAt: now };
    changeState((current) => ({ ...current, payments: [...current.payments, payment] }));
  }

  function updatePayment(id: string, patch: Partial<PaymentRecord>) {
    changeState((current) => ({ ...current, payments: current.payments.map((payment) => payment.id === id ? { ...payment, ...patch, updatedAt: new Date().toISOString() } : payment) }));
  }

  const activeCrew = state.crew.filter((member) => member.active);
  const totalProduction = state.timeEntries.filter((entry) => entry.type === "production").reduce((sum, entry) => sum + durationHours(entry), 0);
  const payrollEstimate = state.timeEntries.filter((entry) => entry.type === "production").reduce((sum, entry) => sum + durationHours(entry) * (state.crew.find((member) => member.id === entry.crewMemberId)?.hourlyRate ?? 0), 0);
  const outstanding = state.payments.filter((payment) => payment.status !== "paid-to-grounds").reduce((sum, payment) => sum + payment.amount, 0);
  const paid = state.payments.filter((payment) => payment.status === "paid-to-grounds").reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <>
      {mode === "schedule" && <main className="gc-page gc3-schedule-view">
        <section className="gc-page-hero gc3-hero"><div><p className="gc-eyebrow">All ten locations · one durable calendar</p><h2>Schedule the work before the crew rolls out.</h2><p>Create, reschedule, repeat, and open visits from this calendar. Each visit keeps its crew, mapped assignments, time, proof, QC, ticket, and payment trail.</p></div><button type="button" className="gc-button light" onClick={() => setVisitModal(true)}>+ Schedule visit</button></section>
        <div className="gc3-kpis"><article><span>Upcoming visits</span><strong>{state.visits.filter((visit) => visit.scheduledDate >= chicagoDateKey() && visit.status !== "cancelled").length}</strong><small>Across all locations</small></article><article><span>Needs QC</span><strong>{state.visits.filter((visit) => visit.status === "ready-qc" || visit.status === "completed-exceptions").length}</strong><small>Open in daily operations</small></article><article><span>Active crew</span><strong>{state.crew.filter((member) => member.active).length}</strong><small>Available for assignment</small></article><article><span>Unscheduled sites</span><strong>{state.sites.filter((site) => !state.visits.some((visit) => visit.siteId === site.id && visit.scheduledDate >= chicagoDateKey() && visit.status !== "cancelled")).length}</strong><small>No future visit saved</small></article></div>
        <section className="gc-card gc3-schedule-board">
          <header><div><p className="gc-eyebrow">Saved visit calendar</p><h2>{filteredVisits.length} visit{filteredVisits.length === 1 ? "" : "s"}</h2></div><div className="gc3-segmented">{(["upcoming", "qc", "all"] as const).map((value) => <button type="button" key={value} className={scheduleFilter === value ? "active" : ""} onClick={() => setScheduleFilter(value)}>{value === "qc" ? "QC" : value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</div></header>
          {scheduleGroups.length ? <div className="gc3-schedule-days">{scheduleGroups.map(([date, visits]) => <section key={date}><header><time>{formatDate(date)}</time><span>{visits.length} visit{visits.length === 1 ? "" : "s"}</span></header><div>{visits.map((visit) => { const site = state.sites.find((item) => item.id === visit.siteId); return <article key={visit.id}><button type="button" className="gc3-schedule-main" onClick={() => onSelectVisit(visit.id)}><span className="gc-site-code small">{site?.code}</span><div><strong>{site?.city ?? "Unknown site"}</strong><small>{visit.windowStart}–{visit.windowEnd} · {visit.kind} · {visit.crewIds.length} crew</small></div><VisitPill status={visit.status} /></button><div className="gc3-schedule-actions"><label><span>Move</span><input aria-label={`Reschedule ${site?.code ?? "visit"}`} type="date" value={visit.scheduledDate} onChange={(event) => rescheduleVisit(visit, event.target.value)} /></label><button type="button" onClick={() => duplicateVisit(visit)}>Repeat +14 days</button><button type="button" onClick={() => onSelectVisit(visit.id)}>Open operation →</button></div></article>; })}</div></section>)}</div> : <div className="gc-empty large"><strong>No visits match this schedule view.</strong><p>Use Schedule visit to create the next location, work window, crew, and assignment package.</p><button className="gc-button primary" type="button" onClick={() => setVisitModal(true)}>Schedule first visit</button></div>}
        </section>
      </main>}

      {mode === "visits" && <main className="gc-page gc3-operations">
        <section className="gc-page-hero gc3-hero"><div><p className="gc-eyebrow">Schedule → field work → proof → QC → ticket</p><h2>Run every site visit from one record.</h2><p>Arrival check-in and work start stay separate. GPS is captured only when you press check-in, clock-out, or add proof.</p></div><button type="button" className="gc-button light" onClick={() => setVisitModal(true)}>+ Schedule visit</button></section>
        <div className="gc3-visit-layout">
          <aside className="gc-card gc3-visit-list"><header><div><p className="gc-eyebrow">All-location schedule</p><h2>{filteredVisits.length} visits</h2></div><div className="gc3-segmented">{(["upcoming", "qc", "all"] as const).map((value) => <button type="button" key={value} className={scheduleFilter === value ? "active" : ""} onClick={() => setScheduleFilter(value)}>{value === "qc" ? "QC" : value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</div></header>
            <div className="gc3-visit-scroll">{filteredVisits.length ? filteredVisits.map((visit) => { const site = state.sites.find((item) => item.id === visit.siteId); return <button type="button" key={visit.id} className={selectedVisit?.id === visit.id ? "active" : ""} onClick={() => { onSelectVisit(visit.id); setVisitTab("assignments"); }}><time><strong>{new Date(`${visit.scheduledDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong><small>{visit.windowStart}</small></time><div><span className="gc-site-code small">{site?.code}</span><strong>{site?.city}</strong><small>{visit.kind} · {visit.crewIds.length} crew · {visit.assignments.length} work</small></div><VisitPill status={visit.status} /></button>; }) : <div className="gc-empty large"><strong>No visits in this view.</strong><p>Schedule the next location, crew, and work package.</p><button className="gc-button primary" type="button" onClick={() => setVisitModal(true)}>Schedule first visit</button></div>}</div>
          </aside>
          <section className="gc-card gc3-visit-detail">{selectedVisit && selectedSite ? <>
            <header className="gc3-visit-header"><div><span className="gc-site-code large">{selectedSite.code}</span><div><p>{formatDate(selectedVisit.scheduledDate)} · {selectedVisit.windowStart}–{selectedVisit.windowEnd}</p><h2>{selectedSite.city}</h2><small>{selectedSite.name}</small></div></div><div><VisitPill status={selectedVisit.status} /><button type="button" onClick={() => duplicateVisit(selectedVisit)}>Repeat +14 days</button><button type="button" onClick={() => onOpenMap(selectedVisit.siteId)}>Map →</button></div></header>
            <div className="gc3-clock-strip"><div><span>Arrival</span><strong>{formatDate(selectedVisit.checkInAt, true)}</strong></div><div><span>Work started</span><strong>{formatDate(selectedVisit.startWorkAt, true)}</strong></div><div><span>Production</span><strong>{visitHours(state, selectedVisit.id, "production").toFixed(2)} hr</strong></div><div><span>QC</span><strong>{QC_META[selectedVisit.qcStatus]}</strong></div></div>
            <div className="gc3-action-bar">
              {selectedVisit.status === "planned" && <button type="button" onClick={() => startTravel(selectedVisit)} className={openEntryType === "travel" ? "active" : ""} disabled={!selectedVisit.crewIds.length || Boolean(openEntryType)}>Start travel</button>}
              {!selectedVisit.checkInAt && <button type="button" className="primary" onClick={() => void checkIn(selectedVisit)}>Check in</button>}
              {selectedVisit.checkInAt && !selectedVisit.completedAt && openEntryType !== "production" && <button type="button" className="primary" onClick={() => startWork(selectedVisit)}>{openEntryType === "break" ? "Resume work" : "Start work"}</button>}
              {openEntryType === "production" && <button type="button" onClick={() => startBreak(selectedVisit)}>Start break</button>}
              {selectedVisit.startWorkAt && !selectedVisit.completedAt && <button type="button" className="complete" onClick={() => completeWork(selectedVisit)}>Complete work</button>}
              {selectedVisit.completedAt && !selectedVisit.checkOutAt && <button type="button" onClick={() => void checkOut(selectedVisit)}>Clock out</button>}
              <span>{openEntryType ? `${openEntryType} timer running` : locationMessage}</span>
            </div>
            <details className="gc3-visit-settings">
              <summary><span>Visit setup</span><small>Date, work window, type, crew, and instructions</small><i>⌄</i></summary>
              <div className="gc3-settings-body">
                <div className="gc-form-grid four tight">
                  <label><span>Date</span><input type="date" value={selectedVisit.scheduledDate} onChange={(event) => rescheduleVisit(selectedVisit, event.target.value)} /></label>
                  <label><span>Start</span><input type="time" value={selectedVisit.windowStart} onChange={(event) => updateVisit(selectedVisit.id, { windowStart: event.target.value })} /></label>
                  <label><span>End</span><input type="time" value={selectedVisit.windowEnd} onChange={(event) => updateVisit(selectedVisit.id, { windowEnd: event.target.value })} /></label>
                  <label><span>Type</span><select value={selectedVisit.kind} onChange={(event) => updateVisit(selectedVisit.id, { kind: event.target.value as VisitKind })}><option value="recovery">Recovery</option><option value="recurring">Recurring</option><option value="corrective">Corrective</option><option value="inspection">Inspection</option></select></label>
                </div>
                <div className="gc3-settings-crew"><span>Visit crew</span><div>{state.crew.filter((member) => member.active).map((member) => <button type="button" key={member.id} className={selectedVisit.crewIds.includes(member.id) ? "active" : ""} onClick={() => toggleVisitCrew(selectedVisit, member.id)}>{member.name}</button>)}</div></div>
                <label className="gc-full-field"><span>Visit instructions</span><textarea rows={2} value={selectedVisit.notes} onChange={(event) => updateVisit(selectedVisit.id, { notes: event.target.value })} placeholder="Access, equipment, route, or supervisor instructions..." /></label>
                {selectedVisit.status !== "closed" && <button type="button" className="gc3-cancel-visit" onClick={() => updateVisit(selectedVisit.id, { status: selectedVisit.status === "cancelled" ? "planned" : "cancelled" })}>{selectedVisit.status === "cancelled" ? "Restore planned visit" : "Cancel visit"}</button>}
              </div>
            </details>
            <nav className="gc3-tabs">{(["assignments", "time", "proof", "closeout"] as const).map((tab) => <button type="button" key={tab} className={visitTab === tab ? "active" : ""} onClick={() => setVisitTab(tab)}>{tab === "proof" ? `Proof (${selectedProofs.length})` : tab === "time" ? `Time (${selectedEntries.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}</nav>
            <div className="gc3-tab-body">
              {visitTab === "assignments" && <div className="gc3-assignments"><header><div><h3>Exact visit work</h3><p>{selectedVisit.assignments.filter((item) => item.status === "standard").length}/{selectedVisit.assignments.length} completed</p></div><div><button type="button" onClick={() => refreshAssignments(selectedVisit)}>Pull open map work</button><button type="button" onClick={() => addCustomAssignment(selectedVisit)}>+ Custom work</button></div></header>
                {selectedVisit.assignments.map((assignment) => <article key={assignment.id}><div className="gc3-assignment-main"><span>{assignment.sourceType}</span><div><strong>{assignment.title}</strong><textarea rows={2} value={assignment.notes} onChange={(event) => updateAssignment(selectedVisit.id, assignment.id, { notes: event.target.value })} placeholder="Exact instructions or exception..." /></div><select value={assignment.status} onChange={(event) => updateAssignment(selectedVisit.id, assignment.id, { status: event.target.value as WorkStatus })}><option value="unassessed">Unassessed</option><option value="recovery">Recovery</option><option value="in-progress">In progress</option><option value="ready-qc">Ready for QC</option><option value="standard">Complete</option><option value="blocked">Blocked</option></select></div><div className="gc3-assignee-chips">{selectedVisit.crewIds.map((crewId) => { const member = state.crew.find((item) => item.id === crewId); const active = assignment.assigneeIds.includes(crewId); return <button type="button" key={crewId} className={active ? "active" : ""} onClick={() => updateAssignment(selectedVisit.id, assignment.id, { assigneeIds: active ? assignment.assigneeIds.filter((id) => id !== crewId) : [...assignment.assigneeIds, crewId] })}>{member?.name ?? "Crew"}</button>; })}{assignment.sourceType === "feature" && assignment.sourceId && <button type="button" onClick={() => onOpenMap(selectedVisit.siteId, assignment.sourceId)}>Locate on map</button>}</div></article>)}
              </div>}
              {visitTab === "time" && <div className="gc3-time"><header><div><h3>Timekeeping</h3><p>Travel {visitHours(state, selectedVisit.id, "travel").toFixed(2)} hr · Production {visitHours(state, selectedVisit.id, "production").toFixed(2)} hr · Break {visitHours(state, selectedVisit.id, "break").toFixed(2)} hr</p></div><strong>Labor estimate {money(visitLaborCost(state, selectedVisit.id))}</strong></header>
                <div className="gc3-time-table"><div><span>Worker / type</span><span>Start</span><span>End</span><span>Hours</span><span>Correction reason</span></div>{selectedEntries.map((entry) => { const member = state.crew.find((item) => item.id === entry.crewMemberId); return <label key={entry.id}><span><strong>{member?.name ?? "Unknown"}</strong><select value={entry.type} onChange={(event) => updateTimeEntry(entry.id, { type: event.target.value as TimeEntryType })}><option value="travel">Travel</option><option value="production">Production</option><option value="break">Break</option></select></span><input type="datetime-local" value={toLocalDateTime(entry.startAt)} onChange={(event) => updateTimeEntry(entry.id, { startAt: fromLocalDateTime(event.target.value) })} /><input type="datetime-local" value={toLocalDateTime(entry.endAt)} onChange={(event) => updateTimeEntry(entry.id, { endAt: event.target.value ? fromLocalDateTime(event.target.value) : null })} /><b>{durationHours(entry).toFixed(2)}</b><input value={entry.correctionReason} onChange={(event) => updateTimeEntry(entry.id, { correctionReason: event.target.value })} placeholder={entry.corrected ? "Required for correction" : "—"} /></label>; })}</div>
              </div>}
              {visitTab === "proof" && <div className="gc3-proof"><header><div><h3>Photos and proof</h3><p>Photos stay tied to the visit, assignment, time, and optional button-press location.</p></div></header><div className="gc3-proof-capture"><select value={proofKind} onChange={(event) => setProofKind(event.target.value as ProofKind)}>{PROOF_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={proofAssignmentId} onChange={(event) => setProofAssignmentId(event.target.value)}><option value="">Whole visit / overview</option>{selectedVisit.assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}</select><input value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="What does this photo prove?" /><label className={cx("gc-button primary", uploading && "disabled")}>{uploading ? "Uploading…" : "+ Take / add photo"}<input type="file" accept="image/*" capture="environment" onChange={(event) => void uploadProof(event)} disabled={uploading} /></label></div>
                {locationMessage && <p className="gc3-inline-note">{locationMessage}</p>}<div className="gc3-proof-grid">{selectedProofs.length ? selectedProofs.map((proof) => { const assignment = selectedVisit.assignments.find((item) => item.id === proof.assignmentId); return <article key={proof.id}><img src={`/api/proof?key=${encodeURIComponent(proof.objectKey)}`} alt={`${proof.kind} proof`} /><div><span>{proof.kind}</span><strong>{assignment?.title ?? "Whole visit"}</strong><small>{formatDate(proof.capturedAt, true)}{proof.location ? " · location captured" : ""}</small><p>{proof.note || proof.filename}</p><button type="button" onClick={() => void deleteProof(proof)}>Delete</button></div></article>; }) : <div className="gc-empty large"><strong>No proof photos yet.</strong><p>Add arrival, before, after, overview, exception, or damage photos.</p></div>}</div></div>}
              {visitTab === "closeout" && <div className="gc3-closeout"><div className="gc3-closeout-grid"><section><h3>Exceptions and QC</h3><label><span>Unfinished work, access issues, damage, weather, or safety conditions</span><textarea rows={4} value={selectedVisit.exceptionNotes} onChange={(event) => updateVisit(selectedVisit.id, { exceptionNotes: event.target.value })} /></label><label><span>QC notes</span><textarea rows={4} value={selectedVisit.qcNotes} onChange={(event) => updateVisit(selectedVisit.id, { qcNotes: event.target.value })} /></label><div className="gc3-qc-actions"><button type="button" className="danger" onClick={() => rejectQc(selectedVisit)}>Reject / assign rework</button><button type="button" className="primary" onClick={() => passQc(selectedVisit)}>Pass QC & generate ticket</button></div></section><section><h3>Closeout checks</h3><ul><li className={selectedVisit.completedAt ? "done" : ""}>Work marked complete</li><li className={selectedProofs.some((proof) => proof.kind === "after" || proof.kind === "overview") ? "done" : ""}>After or overview proof attached</li><li className={selectedEntries.length ? "done" : ""}>Time records captured</li><li className={selectedVisit.qcStatus === "passed" ? "done" : ""}>Supervisor QC passed</li><li className={selectedTicket ? "done" : ""}>Service ticket generated</li></ul></section></div>
                {selectedTicket && <section className="gc3-ticket-editor"><header><div><p className="gc-eyebrow">Service ticket</p><h3>{selectedTicket.ticketNumber}</h3></div><div><select value={selectedTicket.status} onChange={(event) => updateTicket(selectedTicket.id, { status: event.target.value as TicketStatus, submittedAt: event.target.value === "submitted" ? new Date().toISOString() : selectedTicket.submittedAt })}><option value="draft">Draft</option><option value="ready">Ready</option><option value="signed">Signed</option><option value="submitted">Submitted</option></select><button type="button" onClick={() => onPrintTicket(selectedVisit.id)}>Print / Save PDF</button></div></header><label><span>Services performed</span><textarea rows={4} value={selectedTicket.servicesSummary} onChange={(event) => updateTicket(selectedTicket.id, { servicesSummary: event.target.value })} /></label><label><span>Exceptions</span><textarea rows={3} value={selectedTicket.exceptions} onChange={(event) => updateTicket(selectedTicket.id, { exceptions: event.target.value })} /></label><div className="gc-form-grid two"><label><span>Contractor signature name</span><input value={selectedTicket.contractorSignedBy} onChange={(event) => updateTicket(selectedTicket.id, { contractorSignedBy: event.target.value, contractorSignedAt: new Date().toISOString() })} /></label><label><span>Government / COR / DR signature name</span><input value={selectedTicket.governmentSignedBy} onChange={(event) => updateTicket(selectedTicket.id, { governmentSignedBy: event.target.value, governmentSignedAt: event.target.value ? new Date().toISOString() : null, status: event.target.value ? "signed" : selectedTicket.status })} /></label><label><span>Separate acceptance result</span><select value={selectedTicket.acceptanceStatus} onChange={(event) => updateTicket(selectedTicket.id, { acceptanceStatus: event.target.value as ServiceTicket["acceptanceStatus"] })}><option value="not-reviewed">Not reviewed</option><option value="accepted">Accepted</option><option value="deficiency">Deficiency issued</option></select></label><label><span>Payment record</span>{selectedPayment ? <button type="button" onClick={onOpenFinance}>Created · {PAYMENT_META[selectedPayment.status].label} →</button> : <button type="button" onClick={() => createPayment(selectedTicket)}>Create invoice/payment record</button>}</label></div><aside>Government signature documents onsite presence only. It does not automatically mean the PWS work was accepted.</aside></section>}
              </div>}
            </div>
          </> : <div className="gc-empty large"><strong>No visit selected.</strong><p>Schedule a site visit to create the daily work record.</p><button className="gc-button primary" type="button" onClick={() => setVisitModal(true)}>Schedule visit</button></div>}</section>
        </div>
      </main>}

      {mode === "crew" && <main className="gc-page gc3-crew-view"><section className="gc-page-hero gc3-hero"><div><p className="gc-eyebrow">Roster · readiness · labor</p><h2>Know exactly who can work and what they cost.</h2><p>Store readiness status and dates—not SSNs or unnecessary background records.</p></div><button type="button" className="gc-button light" onClick={() => setCrewModal("new")}>+ Add crew member</button></section><div className="gc3-kpis"><article><span>Active crew</span><strong>{activeCrew.length}</strong><small>{state.crew.filter((member) => !member.active).length} inactive</small></article><article><span>Fully ready</span><strong>{activeCrew.filter((member) => [member.eVerify, member.badge, member.siteAccess, member.training].every((status) => status === "ready" || status === "not-applicable")).length}</strong><small>E-Verify, badge, access, training</small></article><article><span>Production recorded</span><strong>{totalProduction.toFixed(1)} hr</strong><small>Across all visits</small></article><article><span>Labor estimate</span><strong>{money(payrollEstimate)}</strong><small>Production time × saved rate</small></article></div><section className="gc3-crew-grid">{state.crew.map((member) => { const hours = state.timeEntries.filter((entry) => entry.crewMemberId === member.id && entry.type === "production").reduce((sum, entry) => sum + durationHours(entry), 0); const ready = [member.eVerify, member.badge, member.siteAccess, member.training].filter((status) => status === "ready" || status === "not-applicable").length; return <article className={cx("gc-card gc3-crew-card", !member.active && "inactive")} key={member.id}><header><span>{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><h3>{member.name}</h3><p>{member.role.replace("-", " ")}{member.authorizedDriver ? " · Driver" : ""}</p></div><button type="button" onClick={() => setCrewModal(member)}>Edit</button></header><div className="gc3-readiness-meter"><i><b style={{ width: `${ready * 25}%` }} /></i><span>{ready}/4 ready</span></div><dl><div><dt>E-Verify</dt><dd>{member.eVerify.replace("-", " ")}</dd></div><div><dt>Badge</dt><dd>{member.badge.replace("-", " ")}</dd></div><div><dt>Site access</dt><dd>{member.siteAccess.replace("-", " ")}</dd></div><div><dt>Training</dt><dd>{member.training.replace("-", " ")}</dd></div></dl><footer><span>{hours.toFixed(2)} production hr</span><strong>{money(hours * (member.hourlyRate ?? 0))}</strong></footer></article>; })}</section></main>}

      {mode === "finance" && <main className="gc-page gc3-finance"><section className="gc-page-hero gc3-hero finance"><div><p className="gc-eyebrow">Ticket → invoice → AMB → government payment</p><h2>Track the money after the work is done.</h2><p>Approved and undisputed work stays visible until AMB receives government payment and Grounds gets paid.</p></div></section><div className="gc3-kpis"><article><span>Outstanding</span><strong>{money(outstanding)}</strong><small>{state.payments.filter((payment) => payment.status !== "paid-to-grounds").length} records</small></article><article><span>Government paid AMB</span><strong>{money(state.payments.filter((payment) => payment.status === "government-paid").reduce((sum, payment) => sum + payment.amount, 0))}</strong><small>Ready for Grounds payment follow-up</small></article><article><span>Paid to Grounds</span><strong>{money(paid)}</strong><small>Closed payment records</small></article><article><span>Unbilled tickets</span><strong>{state.serviceTickets.filter((ticket) => !state.payments.some((payment) => payment.serviceTicketId === ticket.id)).length}</strong><small>Create the invoice trail</small></article></div><div className="gc3-finance-grid"><section className="gc-card"><header className="gc-section-header"><div><p className="gc-eyebrow">Payment pipeline</p><h2>Invoice and payment records</h2></div><span className="gc-count">{state.payments.length}</span></header>{state.payments.length ? <div className="gc3-payment-list">{state.payments.map((payment) => { const visit = state.visits.find((item) => item.id === payment.visitId); const site = visit ? state.sites.find((item) => item.id === visit.siteId) : null; return <article key={payment.id}><header><span className="gc-site-code small">{site?.code}</span><div><strong>{payment.invoiceNumber || "Invoice number needed"}</strong><small>{site?.city} · {visit ? formatDate(visit.scheduledDate) : "Visit missing"}</small></div><em style={{ "--gc3-tone": PAYMENT_META[payment.status].color } as React.CSSProperties}>{PAYMENT_META[payment.status].label}</em></header><div className="gc-form-grid two tight"><label><span>Invoice #</span><input value={payment.invoiceNumber} onChange={(event) => updatePayment(payment.id, { invoiceNumber: event.target.value })} /></label><label><span>Amount</span><input type="number" min="0" step="0.01" value={payment.amount || ""} onChange={(event) => updatePayment(payment.id, { amount: Number(event.target.value) || 0 })} /></label><label><span>Status</span><select value={payment.status} onChange={(event) => { const status = event.target.value as PaymentStatus; updatePayment(payment.id, { status, invoicedAt: status === "submitted-to-amb" && !payment.invoicedAt ? new Date().toISOString() : payment.invoicedAt, governmentPaidAt: status === "government-paid" && !payment.governmentPaidAt ? new Date().toISOString() : payment.governmentPaidAt, paidToGroundsAt: status === "paid-to-grounds" && !payment.paidToGroundsAt ? new Date().toISOString() : payment.paidToGroundsAt }); }}>{Object.entries(PAYMENT_META).map(([key, meta]) => <option value={key} key={key}>{meta.label}</option>)}</select></label><label><span>Amount due</span><strong className="gc3-money-field">{money(payment.amount)}</strong></label></div><textarea rows={2} value={payment.notes} onChange={(event) => updatePayment(payment.id, { notes: event.target.value })} placeholder="Payment follow-up, dispute, AMB update..." /><footer><span>Invoiced {formatDate(payment.invoicedAt)}</span><span>Government paid {formatDate(payment.governmentPaidAt)}</span><span>Grounds paid {formatDate(payment.paidToGroundsAt)}</span>{visit && <button type="button" onClick={() => onSelectVisit(visit.id)}>Open visit</button>}</footer></article>; })}</div> : <div className="gc-empty large"><strong>No payment records yet.</strong><p>Pass QC, generate a service ticket, then create its invoice/payment record.</p></div>}</section><aside className="gc-card gc3-unbilled"><header className="gc-section-header"><div><p className="gc-eyebrow">Ready to invoice</p><h2>Unbilled tickets</h2></div></header>{state.serviceTickets.filter((ticket) => !state.payments.some((payment) => payment.serviceTicketId === ticket.id)).map((ticket) => { const visit = state.visits.find((item) => item.id === ticket.visitId); const site = visit ? state.sites.find((item) => item.id === visit.siteId) : null; return <article key={ticket.id}><span className="gc-site-code small">{site?.code}</span><div><strong>{ticket.ticketNumber}</strong><small>{site?.city} · {visit ? formatDate(visit.scheduledDate) : ""}</small></div><button type="button" onClick={() => createPayment(ticket)}>Create record</button></article>; })}</aside></div></main>}

      {visitModal && <NewVisitModal state={state} defaultSiteId={selectedVisit?.siteId ?? state.sites[0].id} onClose={() => setVisitModal(false)} onCreate={createVisit} />}
      {crewModal && <CrewModal member={crewModal === "new" ? null : crewModal} onClose={() => setCrewModal(null)} onSave={saveCrew} />}
    </>
  );
}
