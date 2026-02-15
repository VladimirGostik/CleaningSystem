-- Migrácia: Pridanie stĺpcov pridaných v nových verziách (invoices, expenses)
-- Spustite na PostgreSQL DB ak po nasadení nejdú načítať faktúry.
-- Môžete spustiť viackrát (IF NOT EXISTS).
--
-- Spustenie: psql $DATABASE_URL -f scripts/add-missing-columns.sql
-- Alebo v pgAdmin / DBeaver: otvoriť súbor a spustiť.

-- Faktúry: odkaz na mesačnú šablónu
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS id_monthly_invoice INTEGER REFERENCES monthly_invoices(id) ON DELETE SET NULL;

-- Výdavky: odkaz na faktúru a identifikátor transakcie z banky (NtryRef)
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS id_invoice INTEGER REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS ntry_ref VARCHAR(64) UNIQUE;

-- Voliteľne: vytvorenie indexu pre rýchlejšie vyhľadávanie podľa ntry_ref
-- CREATE UNIQUE INDEX IF NOT EXISTS expenses_ntry_ref_key ON expenses(ntry_ref) WHERE ntry_ref IS NOT NULL;
