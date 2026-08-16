import { readOwnerState } from "../../../../db/state";
import { INITIAL_STATE } from "../../../../lib/initial-state";
import { INTEGRATION_STACK } from "../../../../lib/live-integrations";
import { migrateAppState } from "../../../../lib/migrate-state";

export async function GET() {
  const saved = await readOwnerState();
  const state = saved ? migrateAppState(saved) : INITIAL_STATE;
  const completedUnpaidValue = state.visits
    .filter((visit) => ["ready-qc", "closed", "completed-exceptions"].includes(visit.status))
    .reduce((sum, visit) => sum + (state.sites.find((site) => site.id === visit.siteId)?.monthlyServiceValue ?? 0), 0);
  const openPayments = state.payments.filter((payment) => payment.status !== "paid-to-grounds" && payment.status !== "disputed");
  const expectedPayment = openPayments.reduce((sum, payment) => sum + payment.amount, 0) || completedUnpaidValue;

  return Response.json({
    status: "ready",
    provider: INTEGRATION_STACK.finance.current,
    sourceLabel: "Saved Grounds Command payment records",
    completedUnpaidValue,
    expectedPayment,
    openPaymentRecords: openPayments.length,
    providerSetup: [
      { provider: "Plaid", status: "credential-required", purpose: "Bank transactions and balances" },
      { provider: "Stripe", status: "credential-required", purpose: "Payment collection and settlement status" },
      { provider: "QuickBooks", status: "credential-required", purpose: "Invoices, customers, and accounting sync" },
    ],
    updatedAt: new Date().toISOString(),
  });
}
