// services/importRegistry.js
//
// Práca s registrom naimportovaných bankových transakcií
// (tabuľka imported_transactions). Používa ju import výdavkov aj import platieb.

const { ImportedTransaction } = require('../models');
const { fingerprintOf } = require('../utils/transactionFingerprint');

/**
 * Ku každému surovému záznamu z XML doplní odtlačok a informáciu, či ide
 * o duplicitu - buď voči databáze, alebo voči skoršiemu riadku v tom istom súbore.
 *
 * @param {Array<object>} records - záznamy tak, ako ich posiela frontend
 * @param {'vydavok'|'platba'} source
 * @returns {Promise<Array<object>>} pole v rovnakom poradí ako `records`
 */
async function annotateDuplicates(records, source) {
  const described = (records || []).map((raw, index) => ({
    index,
    raw,
    ...fingerprintOf(raw, source),
  }));

  const fingerprints = described.map((d) => d.fingerprint);
  const existingRows = fingerprints.length
    ? await ImportedTransaction.findAll({ where: { fingerprint: fingerprints } })
    : [];

  const existingByFingerprint = new Map(existingRows.map((row) => [row.fingerprint, row]));
  const seenInFile = new Set();

  return described.map((item) => {
    const existing = existingByFingerprint.get(item.fingerprint) || null;
    const duplicateInFile = seenInFile.has(item.fingerprint);
    seenInFile.add(item.fingerprint);

    return {
      ...item,
      duplicate: Boolean(existing) || duplicateInFile,
      duplicateInFile,
      // Prečo je to duplicita - podľa toho vieme na frontende napísať zrozumiteľný dôvod
      matchedBy: item.ntry_ref ? 'ntry_ref' : 'odtlacok',
      existing: existing
        ? {
            id: existing.id,
            source: existing.source,
            imported_at: existing.createdAt,
            booking_date: existing.booking_date,
            amount: existing.amount,
            counterparty_name: existing.counterparty_name,
            description: existing.description,
            id_expense: existing.id_expense,
            id_invoice: existing.id_invoice,
          }
        : null,
    };
  });
}

/**
 * Zapíše transakciu do registra. Vracia vytvorený záznam, alebo null ak zápis
 * zlyhal (register nesmie zhodiť samotný import).
 *
 * Pri `force` (používateľ vedome potvrdil duplicitu) sa k odtlačku pridá
 * poradová prípona, aby neporušil unique constraint.
 */
async function registerImport(described, { id_expense = null, id_invoice = null, force = false } = {}) {
  let fingerprint = described.fingerprint;

  try {
    if (force) {
      let suffix = 1;
      // Hľadáme prvý voľný variant: fp, fp#2, fp#3, ...
      while (await ImportedTransaction.findOne({ where: { fingerprint } })) {
        suffix += 1;
        fingerprint = `${described.fingerprint}#${suffix}`;
      }
    }

    return await ImportedTransaction.create({
      fingerprint,
      ntry_ref: described.ntry_ref || null,
      source: described.source,
      booking_date: described.booking_date || null,
      amount: described.amount != null ? described.amount : null,
      counterparty_iban: described.counterparty_iban || null,
      counterparty_name: described.counterparty_name || null,
      description: described.description || null,
      reference: described.reference || null,
      id_expense,
      id_invoice,
    });
  } catch (error) {
    console.error('Nepodarilo sa zapísať transakciu do registra importov:', error.message);
    return null;
  }
}

module.exports = { annotateDuplicates, registerImport };
