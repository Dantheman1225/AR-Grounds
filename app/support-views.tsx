"use client";

import { useMemo, useState, type FormEvent } from "react";
import { BarChart3, Package, Trash2 } from "lucide-react";
import type { AppState, InventoryItem, InventoryKind, InventoryStatus } from "../lib/types";

type Mutator = (change: (current: AppState) => AppState) => void;

const INVENTORY_STATUS: Record<InventoryStatus, { label: string; tone: string }> = {
  ready: { label: "Ready", tone: "green" },
  "service-due": { label: "Service due", tone: "amber" },
  "out-of-service": { label: "Out of service", tone: "red" },
  restock: { label: "Restock", tone: "amber" },
};

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function InventoryView({ state, onMutate, onOpenPlan, onNotice }: {
  state: AppState;
  onMutate: Mutator;
  onOpenPlan: () => void;
  onNotice: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<InventoryKind>("equipment");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("units");

  const counts = useMemo(() => ({
    ready: state.inventory.filter((item) => item.status === "ready").length,
    attention: state.inventory.filter((item) => item.status === "service-due" || item.status === "restock").length,
    out: state.inventory.filter((item) => item.status === "out-of-service").length,
  }), [state.inventory]);

  function addItem(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const item: InventoryItem = {
      id: makeId("inventory"),
      name: name.trim(),
      kind,
      quantity: Math.max(0, Number(quantity) || 0),
      unit: unit.trim() || "units",
      status: kind === "material" ? "restock" : "ready",
      siteId: null,
      assigneeId: null,
      serviceDueDate: null,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    onMutate((current) => ({ ...current, inventory: [...current.inventory, item] }));
    setName("");
    setQuantity("1");
    onNotice(`${item.name} added to inventory.`);
  }

  function patchItem(id: string, patch: Partial<InventoryItem>) {
    onMutate((current) => ({
      ...current,
      inventory: current.inventory.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item),
    }));
  }

  function deleteItem(item: InventoryItem) {
    if (!window.confirm(`Delete ${item.name} from inventory?`)) return;
    onMutate((current) => ({ ...current, inventory: current.inventory.filter((candidate) => candidate.id !== item.id) }));
    onNotice(`${item.name} removed from inventory.`);
  }

  return (
    <main className="gc-page gc-support-view gc-inventory-view">
      <section className="gc-page-hero compact-dark">
        <div><p className="gc-eyebrow">Equipment and materials</p><h2>Inventory that follows the work plan.</h2><p>Quantities, readiness, assignments, service dates, and restock notes now save with the rest of Grounds Command.</p></div>
        <button className="gc-button light" type="button" onClick={onOpenPlan}>Review Camp Robinson plan</button>
      </section>

      <section className="gc-report-kpis gc-inventory-kpis">
        <article><span>Inventory records</span><strong>{state.inventory.length}</strong><small>Equipment, material, and PPE</small></article>
        <article><span>Ready</span><strong>{counts.ready}</strong><small>Available for assignment</small></article>
        <article><span>Needs attention</span><strong>{counts.attention}</strong><small>Service or restock</small></article>
        <article><span>Out of service</span><strong>{counts.out}</strong><small>Blocked from field use</small></article>
      </section>

      <form className="gc-card gc-inventory-add" onSubmit={addItem}>
        <div><p className="gc-eyebrow">New record</p><h2>Add equipment or supplies</h2></div>
        <label><span>Name</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Equipment or supply" /></label>
        <label><span>Type</span><select value={kind} onChange={(event) => setKind(event.target.value as InventoryKind)}><option value="equipment">Equipment</option><option value="material">Material</option><option value="ppe">PPE</option></select></label>
        <label><span>Quantity</span><input type="number" min="0" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label><span>Unit</span><input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="units" /></label>
        <button className="gc-button primary" type="submit" disabled={!name.trim()}>Add item</button>
      </form>

      <section className="gc-card gc-inventory-list">
        <header className="gc-section-header"><div><p className="gc-eyebrow">Saved inventory</p><h2>{state.inventory.length} record{state.inventory.length === 1 ? "" : "s"}</h2></div></header>
        {state.inventory.length === 0 ? <div className="gc-empty large"><strong>No inventory records yet.</strong><p>Add the first equipment, supply, or PPE record above.</p></div> : state.inventory.map((item) => (
          <article key={item.id}>
            <span className={`gc-support-icon ${INVENTORY_STATUS[item.status].tone}`}><Package size={18} /></span>
            <div className="gc-inventory-fields">
              <label className="name"><span>Name</span><input value={item.name} onChange={(event) => patchItem(item.id, { name: event.target.value })} /></label>
              <label><span>Type</span><select value={item.kind} onChange={(event) => patchItem(item.id, { kind: event.target.value as InventoryKind })}><option value="equipment">Equipment</option><option value="material">Material</option><option value="ppe">PPE</option></select></label>
              <label><span>Quantity</span><input type="number" min="0" step="0.1" value={item.quantity} onChange={(event) => patchItem(item.id, { quantity: Number(event.target.value) || 0 })} /></label>
              <label><span>Unit</span><input value={item.unit} onChange={(event) => patchItem(item.id, { unit: event.target.value })} /></label>
              <label><span>Status</span><select value={item.status} onChange={(event) => patchItem(item.id, { status: event.target.value as InventoryStatus })}>{Object.entries(INVENTORY_STATUS).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label>
              <label><span>Assigned site</span><select value={item.siteId ?? ""} onChange={(event) => patchItem(item.id, { siteId: event.target.value || null })}><option value="">Shared / unassigned</option>{state.sites.map((site) => <option value={site.id} key={site.id}>{site.code} · {site.city}</option>)}</select></label>
              <label><span>Assigned crew</span><select value={item.assigneeId ?? ""} onChange={(event) => patchItem(item.id, { assigneeId: event.target.value || null })}><option value="">Unassigned</option>{state.crew.filter((member) => member.active).map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
              <label><span>Service due</span><input type="date" value={item.serviceDueDate ?? ""} onChange={(event) => patchItem(item.id, { serviceDueDate: event.target.value || null })} /></label>
              <label className="notes"><span>Notes</span><input value={item.notes} onChange={(event) => patchItem(item.id, { notes: event.target.value })} placeholder="Repair, restock, checkout, or condition" /></label>
            </div>
            <button type="button" className="gc-icon-danger" onClick={() => deleteItem(item)} aria-label={`Delete ${item.name}`}><Trash2 size={17} /></button>
          </article>
        ))}
      </section>
    </main>
  );
}

type ReportType = "cycle" | "labor" | "quality" | "chemical";
type ReportData = { title: string; description: string; columns: string[]; rows: Array<Array<string | number>> };

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function hours(startAt: string, endAt: string | null) {
  const start = new Date(startAt).getTime();
  const end = endAt ? new Date(endAt).getTime() : Date.now();
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, (end - start) / 3_600_000) : 0;
}

function reportData(type: ReportType, state: AppState): ReportData {
  if (type === "labor") {
    return {
      title: "Labor and cost report",
      description: "Recorded time by worker, visit, site, time type, and saved hourly rate.",
      columns: ["Date", "Site", "Worker", "Time type", "Hours", "Direct cost"],
      rows: state.timeEntries.map((entry) => {
        const visit = state.visits.find((item) => item.id === entry.visitId);
        const site = state.sites.find((item) => item.id === entry.siteId);
        const member = state.crew.find((item) => item.id === entry.crewMemberId);
        const value = hours(entry.startAt, entry.endAt);
        return [formatDate(visit?.scheduledDate), site?.code ?? "—", member?.name ?? "Unknown", entry.type, value.toFixed(2), `$${(value * (member?.hourlyRate ?? 0)).toFixed(2)}`];
      }),
    };
  }
  if (type === "quality") {
    return {
      title: "Quality control report",
      description: "Visit completion, supervisor QC, ticket status, acceptance, and proof counts.",
      columns: ["Date", "Site", "Visit", "Visit status", "QC", "Ticket", "Acceptance", "Proof"],
      rows: state.visits.map((visit) => {
        const site = state.sites.find((item) => item.id === visit.siteId);
        const ticket = visit.serviceTicketId ? state.serviceTickets.find((item) => item.id === visit.serviceTicketId) : null;
        return [formatDate(visit.scheduledDate), site?.code ?? "—", visit.kind, visit.status, visit.qcStatus, ticket?.status ?? "—", ticket?.acceptanceStatus ?? "—", state.proofs.filter((proof) => proof.visitId === visit.id).length];
      }),
    };
  }
  if (type === "chemical") {
    return {
      title: "Chemical application log",
      description: "Saved pesticide product, applicator, treatment, weather, 1532, and outcome records.",
      columns: ["Applied", "Site", "Product", "Applicator", "Target", "Rate", "Wind", "1532", "Outcome"],
      rows: state.applications.map((application) => {
        const site = state.sites.find((item) => item.id === application.siteId);
        const product = state.products.find((item) => item.id === application.productId);
        return [formatDate(application.appliedAt), site?.code ?? "—", product?.brandName ?? "Unknown", application.applicator, application.targetWeeds, application.rate, application.wind, application.record1532Status, application.effectiveness];
      }),
    };
  }
  return {
    title: "Cycle completion report",
    description: "Day and worker-zone completion, hours, carryover, assignment, and budget.",
    columns: ["Site", "Cycle", "Day", "Date", "Zone", "Assignee", "Status", "Hours", "Carryover", "Budget"],
    rows: state.plans.flatMap((plan) => {
      const site = state.sites.find((item) => item.id === plan.siteId);
      return plan.workerZones.map((zone) => {
        const day = plan.daySections.find((section) => section.id === zone.sectionId);
        return [site?.code ?? "—", plan.cycleNumber, day?.name ?? "Unscheduled", formatDate(day?.scheduledDate), zone.code, zone.assigneeName, zone.status, zone.estimatedHours.toFixed(1), zone.carryoverHours.toFixed(1), `$${zone.budget.toFixed(2)}`];
      });
    }),
  };
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function ReportsView({ state, onNotice }: { state: AppState; onNotice: (message: string) => void }) {
  const [active, setActive] = useState<ReportType>("cycle");
  const data = useMemo(() => reportData(active, state), [active, state]);
  const openWork = state.features.filter((feature) => feature.status !== "standard").length + state.tasks.filter((task) => task.status !== "standard").length;
  const readyQc = state.visits.filter((visit) => visit.status === "ready-qc" || visit.status === "completed-exceptions").length;

  function exportCsv() {
    const csv = [data.columns, ...data.rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onNotice(`${data.title} exported as CSV.`);
  }

  const reports: Array<{ key: ReportType; title: string; copy: string }> = [
    { key: "cycle", title: "Cycle completion report", copy: "Day and worker-zone completion with carryover." },
    { key: "labor", title: "Labor and cost report", copy: "Recorded hours, rates, and direct labor cost." },
    { key: "quality", title: "Quality control report", copy: "Visit QC, tickets, acceptance, and proof." },
    { key: "chemical", title: "Chemical application log", copy: "Product, applicator, weather, treatment, and outcome." },
  ];

  return (
    <main className="gc-page gc-support-view gc-reports-view">
      <section className="gc-page-hero compact-dark">
        <div><p className="gc-eyebrow">Contract reporting</p><h2>Proof, performance, and cost in one place.</h2><p>Each report is generated from the saved visit, planning, proof, crew, treatment, and payment records—not from a placeholder page.</p></div>
        <button className="gc-button light" type="button" onClick={exportCsv}>Export current CSV</button>
      </section>
      <section className="gc-report-kpis">
        <article><span>Closed visits</span><strong>{state.visits.filter((visit) => visit.status === "closed").length}</strong><small>{state.visits.length} total visits</small></article>
        <article><span>Proof records</span><strong>{state.proofs.length}</strong><small>Photos and completion notes</small></article>
        <article><span>Open work</span><strong>{openWork}</strong><small>Across all locations</small></article>
        <article><span>Ready for QC</span><strong>{readyQc}</strong><small>Supervisor review queue</small></article>
      </section>
      <div className="gc-report-workspace">
        <section className="gc-card gc-report-list">
          <header className="gc-section-header"><div><p className="gc-eyebrow">Report center</p><h2>Choose a live report</h2></div></header>
          {reports.map((report) => <button type="button" className={active === report.key ? "active" : ""} key={report.key} onClick={() => setActive(report.key)}><BarChart3 size={18} /><span><strong>{report.title}</strong><small>{report.copy}</small></span><i>→</i></button>)}
        </section>
        <section className="gc-card gc-report-preview">
          <header><div><p className="gc-eyebrow">Generated now</p><h2>{data.title}</h2><p>{data.description}</p></div><button className="gc-button secondary" type="button" onClick={exportCsv}>Export CSV</button></header>
          {data.rows.length === 0 ? <div className="gc-empty large"><strong>No saved records for this report yet.</strong><p>The report will fill automatically as the matching workflow is used.</p></div> : <div className="gc-report-table"><table><thead><tr>{data.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
        </section>
      </div>
    </main>
  );
}
