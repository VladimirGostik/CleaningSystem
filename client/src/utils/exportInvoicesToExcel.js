// src/utils/exportInvoicesToExcel.js
import * as XLSX from 'xlsx';

// Preklad statusov do slovenčiny
const STATUS_LABELS = {
  created: 'Vytvorená',
  sent: 'Odoslaná',
  expired: 'Po splatnosti',
  paid: 'Zaplatená',
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('sk-SK');
};

const toNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Jeden riadok = jedna položka faktúry; údaje faktúry sa opakujú pri každej položke.
// Faktúra bez položiek dostane jeden riadok s prázdnymi stĺpcami položky.
const buildRow = (invoice, service) => ({
  'Číslo faktúry': invoice.invoice_number,
  'Názov faktúry': invoice.invoice_name,
  'Stav': STATUS_LABELS[invoice.status] || invoice.status,
  'Dátum vystavenia': formatDate(invoice.issue_date),
  'Dátum splatnosti': formatDate(invoice.due_date),
  'Dátum úhrady': formatDate(invoice.payment_date),
  'Dátum dodania': formatDate(invoice.delivery_date),
  'Fakturačný mesiac': invoice.billing_month,

  'Dodávateľ': invoice.company_name,
  'Dodávateľ - adresa': invoice.company_address,
  'Dodávateľ - PSČ': invoice.postal_code,
  'Dodávateľ - mesto': invoice.city,
  'Dodávateľ - IČO': invoice.company_ico,
  'Dodávateľ - DIČ': invoice.company_dic,
  'Dodávateľ - IČ DPH': invoice.company_ic_dph,
  'Dodávateľ - IBAN': invoice.company_iban,
  'Dodávateľ - banka': invoice.bank_connection,

  'Odberateľ (bytový podnik)': invoice.residential_company_name,
  'Odberateľ - adresa': invoice.residential_company_address,
  'Odberateľ - PSČ': invoice.residential_postal_code,
  'Odberateľ - mesto': invoice.residential_city,
  'Odberateľ - IČO': invoice.residential_company_ico,
  'Odberateľ - DIČ': invoice.residential_company_dic,
  'Odberateľ - IČ DPH': invoice.residential_company_ic_dph,
  'Odberateľ - IBAN': invoice.residential_company_iban,
  'Odberateľ - banka': invoice.residential_bank_connection,

  'Hlavička 1': invoice.header1,
  'Hlavička 2': invoice.header2,
  'Hlavička 3': invoice.header3,
  'Hlavička 4': invoice.header4,
  'Popis nad položkami': invoice.description_above_services,
  'Popis položiek': invoice.description_services,

  'Položka': service ? service.name : '',
  'Množstvo': service ? toNumber(service.quantity) : '',
  'Jednotková cena': service ? toNumber(service.price) : '',
  'Cena spolu (položka)': service ? toNumber(service.price) * toNumber(service.quantity) : '',
  'Cena spolu (faktúra)': toNumber(invoice.total_price),
});

export const exportInvoicesToExcel = (invoices, fileName = 'faktury_export.xlsx') => {
  const rows = invoices.flatMap((invoice) => {
    const services = invoice.services || [];
    if (services.length === 0) {
      return [buildRow(invoice, null)];
    }
    return services.map((service) => buildRow(invoice, service));
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Šírky stĺpcov podľa obsahu, aby bol export hneď čitateľný
  const headers = Object.keys(rows[0] || {});
  worksheet['!cols'] = headers.map((header) => {
    const maxLength = rows.reduce(
      (max, row) => Math.max(max, String(row[header] ?? '').length),
      header.length
    );
    return { wch: Math.min(maxLength + 2, 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Faktúry');
  XLSX.writeFile(workbook, fileName);
};
