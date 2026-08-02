// utils/transactionFingerprint.js
//
// Jednotné počítanie "odtlačku" bankovej transakcie, aby sa dal ten istý
// záznam z XML výpisu spoľahlivo rozpoznať aj pri opakovanom importe.
//
// Pravidlo:
//   1. Ak transakcia má NtryRef (identifikátor záznamu z banky), použije sa ten
//      - je jedinečný a je to najspoľahlivejší kľúč.
//   2. Ak NtryRef chýba, vypočíta sa hash z dátumu, sumy, IBAN-u protistrany,
//      mena a popisu. Dve rôzne platby s úplne rovnakými údajmi v ten istý deň
//      sa preto vyhodnotia ako duplicita - používateľ ich vie potvrdiť ručne
//      (force pri importe).

const crypto = require('crypto');

const normText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const normIban = (value) => String(value ?? '').replace(/\s+/g, '').toUpperCase();

const normAmount = (value) => {
  const num = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(num) ? num.toFixed(2) : '';
};

// Dátum orežeme na YYYY-MM-DD (z XML chodí buď holý dátum alebo ISO timestamp)
const normDate = (value) => {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim().slice(0, 10);
};

const SOURCE_EXPENSE = 'vydavok';
const SOURCE_PAYMENT = 'platba';

/**
 * Prevedie surový záznam z modálu na jednotný tvar, s ktorým ďalej pracuje
 * register naimportovaných transakcií.
 *
 * @param {object} raw - záznam tak, ako ho posiela frontend
 * @param {'vydavok'|'platba'} source
 */
function describeTransaction(raw = {}, source = SOURCE_EXPENSE) {
  const ntryRef = String(raw.ntry_ref ?? raw.ntryRef ?? '').trim() || null;

  if (source === SOURCE_PAYMENT) {
    return {
      source,
      ntry_ref: ntryRef,
      booking_date: normDate(raw.paymentDate ?? raw.booking_date) || null,
      amount: Number.isFinite(parseFloat(raw.amount)) ? parseFloat(raw.amount) : null,
      // Pri prijatej platbe je protistranou odosielateľ (DbtrAcct)
      counterparty_iban: normIban(raw.debtorAcct ?? raw.counterparty_iban) || null,
      counterparty_name: raw.senderName ?? raw.counterparty_name ?? null,
      description: raw.description ?? null,
      reference: raw.vs ?? null,
    };
  }

  return {
    source: SOURCE_EXPENSE,
    ntry_ref: ntryRef,
    booking_date: normDate(raw.start_date ?? raw.booking_date) || null,
    amount: Number.isFinite(parseFloat(raw.price)) ? parseFloat(raw.price) : null,
    counterparty_iban: normIban(raw.iban ?? raw.counterparty_iban) || null,
    counterparty_name: raw.name ?? raw.counterparty_name ?? null,
    description: raw.description ?? null,
    reference: null,
  };
}

/**
 * Vypočíta odtlačok transakcie. Vracia string, ktorý sa ukladá do
 * imported_transactions.fingerprint (unique).
 */
function buildFingerprint(described = {}) {
  if (described.ntry_ref) {
    return `ntry:${described.ntry_ref}`;
  }
  const parts = [
    described.source || SOURCE_EXPENSE,
    normDate(described.booking_date),
    normAmount(described.amount),
    normIban(described.counterparty_iban),
    normText(described.counterparty_name),
    normText(described.description),
  ];
  const hash = crypto.createHash('sha1').update(parts.join('|')).digest('hex');
  return `fp:${hash}`;
}

/**
 * Skratka: zo surového záznamu rovno vyrobí popis + odtlačok.
 */
function fingerprintOf(raw, source) {
  const described = describeTransaction(raw, source);
  return { ...described, fingerprint: buildFingerprint(described) };
}

module.exports = {
  SOURCE_EXPENSE,
  SOURCE_PAYMENT,
  describeTransaction,
  buildFingerprint,
  fingerprintOf,
};
