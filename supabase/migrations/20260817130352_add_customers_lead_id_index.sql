-- customers.lead_id is a foreign key with no covering index, so every
-- "customers for this lead" lookup and every ON DELETE SET NULL cascade from
-- leads had to sequentially scan customers.
CREATE INDEX IF NOT EXISTS customers_lead_idx ON public.customers USING btree (lead_id);
