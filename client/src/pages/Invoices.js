// src/pages/Invoices.js
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ImportExpensesModal from '../modals/ImportExpensesModal'; // Nový import
import AdminLayout from '../layouts/AdminLayout';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InvoiceTableExtended from '../components/InvoiceTableExtended';
import AddInvoiceModal from '../modals/AddInvoiceModal'; // Import the modal component
import EditInvoiceModal from '../modals/EditInvoiceModal';
import AddMonthlyInvoicesModal from '../modals/AddMonthlyInvoicesModal';
import AddMonthlyInvoicesForCompanyModal from '../modals/AddMonthlyInvoicesForCompanyModal';
import InvoiceFilter from '../components/InvoiceFilter'; // Import the filter component
import MarkAsPaidModal from '../modals/MarkAsPaidModal'; // Import the MarkAsPaidModal
import BulkEditInvoiceDatesModal from '../modals/BulkEditInvoiceDatesModal'; // Import BulkEditInvoiceDatesModal
import BulkInvoiceDocument from '../components/BulkInvoiceDocument'; // Import BulkInvoiceDocument
import { pdf } from '@react-pdf/renderer'; // Import the pdf function
import * as XLSX from 'xlsx'; // Import xlsx for Excel export
import QRCode from 'qrcode'; // Import QRCode library
import { encode, PaymentOptions, CurrencyCode } from 'bysquare'; // Import BySquare library
import { getResidentialCompanyById } from '../services/companyService';
import { 
  getInvoices, 
  addInvoice, 
  generateMonthlyInvoices,
  generateMonthlyInvoicesForCompany,
  updateInvoice, 
  InvoicesMarkAsSent, 
  InvoicesMarkAsPaid, 
  deleteInvoice, 
  InvoicesBulkMarkAsSent, 
  InvoicesBulkMarkAsPaid, 
  InvoicesBulkDelete,
  InvoicesBulkUpdateDates,
  sendTransactionsToBackend
} from '../services/invoices';

const Invoices = () => {
  const location = useLocation();
  const [allInvoices, setAllInvoices] = useState([]); // All fetched invoices
  const [filteredInvoices, setFilteredInvoices] = useState([]); // Invoices after filtering
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false); // Add Invoice Modal
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false); // Edit Invoice Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); // Selected Invoice ID for editing
  const [showAddMonthlyInvoicesModal, setShowAddMonthlyInvoicesModal] = useState(false); // Add Monthly Invoices Modal
  const [showAddMonthlyInvoicesForCompanyModal, setShowAddMonthlyInvoicesForCompanyModal] = useState(false); // Add Monthly Invoices for Company Modal
  const [showBulkMarkAsPaidModal, setShowBulkMarkAsPaidModal] = useState(false); // State to control bulk MarkAsPaidModal
  const [showBulkEditDatesModal, setShowBulkEditDatesModal] = useState(false); // State to control bulk EditDatesModal
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); // Stav pre import

  // Bulk Actions State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]); // IDs of selected invoices
  const [showBulkActions, setShowBulkActions] = useState(false); // Toggle visibility of bulk actions

  // Pagination State
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('invoicesCurrentPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [invoicesPerPage, setInvoicesPerPage] = useState(() => {
    const saved = localStorage.getItem('invoicesPerPage');
    return saved ? parseInt(saved, 10) : 10;
  }); // Počet faktúr na stránku, nastaviteľný používateľom

  // Save pagination state to localStorage
  useEffect(() => {
    localStorage.setItem('invoicesCurrentPage', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem('invoicesPerPage', invoicesPerPage.toString());
  }, [invoicesPerPage]);

  // Fetch invoices from the backend API
  const fetchInvoices = useCallback(async () => {
    try {
      const response = await getInvoices();
      const invoicesData = response;

      // Handle cases where services might be undefined and compute total_price
      const invoicesWithTotal = invoicesData.map((invoice) => {
        const totalPrice = (invoice.services || []).reduce((acc, service) => {
          const price = parseFloat(service.price) || 0;
          const quantity = parseInt(service.quantity, 10) || 0;
          return acc + price * quantity;
        }, 0);

        return {
          ...invoice,
          total_price: totalPrice,
        };
      });

      setAllInvoices(invoicesWithTotal);
      setFilteredInvoices(invoicesWithTotal); // Initially, no filters applied
      setSelectedInvoiceIds([]); // Reset selection
      setShowBulkActions(false); // Hide bulk actions
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Chyba pri načítaní faktúr');
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Restore filters from location state when navigating back
  // Filters are automatically restored by InvoiceFilter component from localStorage
  // This effect ensures filters are reapplied when navigating back
  useEffect(() => {
    if (location.state) {
      // InvoiceFilter component will automatically load and apply filters from localStorage
      // No additional action needed here
    }
  }, [location.state]);

  // Handlers for actions
  const handleEdit = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowEditInvoiceModal(true);
  };

  const handleMarkAsSent = async (invoiceId) => {
    try {
      await InvoicesMarkAsSent(invoiceId);
      fetchInvoices();
      toast.success('Faktúra označená ako odoslaná');
    } catch (error) {
      console.error('Error marking invoice as sent:', error);
      toast.error('Chyba pri označovaní faktúry ako odoslanej');
    }
  };

  const handleMarkAsPaid = async (invoiceId, paymentDate) => {
    try {
      await InvoicesMarkAsPaid(invoiceId, paymentDate);
      fetchInvoices();
      toast.success('Faktúra označená ako zaplatená');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Chyba pri označovaní faktúry ako zaplatenej');
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Ste si istý, že chcete vymazať túto faktúru?')) {
      try {
        await deleteInvoice(invoiceId);
        fetchInvoices();
        toast.success('Faktúra úspešne vymazaná');
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Chyba pri vymazávaní faktúry');
      }
    }
  };

  const handleUpdateInvoice = async (invoiceId, data) => {
    try {
      await updateInvoice(invoiceId, data);
      setShowEditInvoiceModal(false);
      setSelectedInvoiceId(null);
      fetchInvoices();
      toast.success('Faktúra úspešne upravená');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Chyba pri úprave faktúry');
    }
  };

  // Handler for adding a new invoice
  const handleAddInvoice = async ({ invoiceData, servicesData }) => {
    try {
      await addInvoice(invoiceData, servicesData);
      setShowAddInvoiceModal(false);
      fetchInvoices();
      toast.success('Faktúra úspešne pridaná');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handler for adding monthly invoices
  const handleAddMonthlyInvoices = async (data) => {
    try {
      await generateMonthlyInvoices(data);
      setShowAddMonthlyInvoicesModal(false);
      fetchInvoices();
      toast.success('Mesačné faktúry úspešne vytvorené');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handler for adding monthly invoices for a specific company
  const handleAddMonthlyInvoicesForCompany = async (data) => {
    try {
      const result = await generateMonthlyInvoicesForCompany(data);
      setShowAddMonthlyInvoicesForCompanyModal(false);
      fetchInvoices();
      toast.success(result.message || 'Mesačné faktúry pre firmu úspešne vytvorené');
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    }
  };

  // Handler for filter changes
  const handleFilterChange = useCallback((filters) => {
    const {
      invoice_number,
      invoice_name,
      company_ids,
      residential_company_ids,
      status,
      total_price_from,
      total_price_to,
      issue_date_from,
      issue_date_to,
    } = filters;

    const filtered = allInvoices.filter((invoice) => {
      // Filter by invoice number
      if (
        invoice_number &&
        !invoice.invoice_number.toLowerCase().includes(invoice_number.toLowerCase())
      ) {
        return false;
      }

      // Filter by invoice name
      if (
        invoice_name &&
        !invoice.invoice_name.toLowerCase().includes(invoice_name.toLowerCase())
      ) {
        return false;
      }

      // Filter by company IDs
      if (
        company_ids.length > 0 &&
        (!invoice.id_company || !company_ids.includes(invoice.id_company))
      ) {
        return false;
      }

      // Filter by residential company IDs
      if (
        residential_company_ids.length > 0 &&
        (!invoice.id_residential_company || !residential_company_ids.includes(invoice.id_residential_company))
      ) {
        return false;
      }

      // Filter by status
      if (status && invoice.status !== status) {
        return false;
      }

      // Filter by total price range
      if (total_price_from) {
        if (invoice.total_price < parseFloat(total_price_from)) {
          return false;
        }
      }
      if (total_price_to) {
        if (invoice.total_price > parseFloat(total_price_to)) {
          return false;
        }
      }

      // Filter by issue date range
      const issueDate = new Date(invoice.issue_date);
      if (issue_date_from) {
        const fromDate = new Date(issue_date_from);
        if (issueDate < fromDate) {
          return false;
        }
      }
      if (issue_date_to) {
        const toDate = new Date(issue_date_to);
        if (issueDate > toDate) {
          return false;
        }
      }

      return true;
    });

    setFilteredInvoices(filtered);
    setSelectedInvoiceIds([]); // Reset selection after filter
    setShowBulkActions(false); // Hide bulk actions after filter
  }, [allInvoices]);

  // Handlers for Bulk Actions
  const handleSelectInvoice = (invoiceId, isSelected) => {
    if (isSelected) {
      setSelectedInvoiceIds(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleBulkMarkAsSent = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na označenie');
      return;
    }
  
    try {
      await InvoicesBulkMarkAsSent(selectedInvoiceIds);
      fetchInvoices();
      toast.success('Vybrané faktúry označené ako odoslané');
      setShowBulkActions(false); // Close bulk actions after successful operation
    } catch (error) {
      console.error('Error marking invoices as sent:', error);
      toast.error('Chyba pri označovaní faktúr ako odoslaných');
    }
  };

  const handleBulkMarkAsPaid = () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na označenie');
      return;
    }
    setShowBulkMarkAsPaidModal(true);
  };

  const handleBulkMarkAsPaidSubmit = async (paymentDate) => {
    try {
      await InvoicesBulkMarkAsPaid(selectedInvoiceIds, paymentDate);
      fetchInvoices();
      toast.success('Vybrané faktúry označené ako zaplatené');
      setShowBulkMarkAsPaidModal(false);
      setShowBulkActions(false); // Close bulk actions after successful operation
    } catch (error) {
      console.error('Error marking invoices as paid:', error);
      toast.error('Chyba pri označovaní faktúr ako zaplatených');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na vymazanie');
      return;
    }
  
    if (!window.confirm('Ste si istý, že chcete vymazať vybrané faktúry?')) {
      return;
    }
  
    try {
      await InvoicesBulkDelete(selectedInvoiceIds);
      fetchInvoices();
      toast.success('Vybrané faktúry úspešne vymazané');
      setShowBulkActions(false); // Close bulk actions after successful operation
    } catch (error) {
      console.error('Error deleting invoices:', error);
      toast.error('Chyba pri vymazávaní faktúr');
    }
  };

  const handleBulkEditDates = () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na úpravu');
      return;
    }
    setShowBulkEditDatesModal(true);
  };

  const handleBulkEditDatesSubmit = async (updateData) => {
    try {
      await InvoicesBulkUpdateDates(selectedInvoiceIds, updateData);
      fetchInvoices();
      toast.success('Dátumy faktúr úspešne aktualizované');
      setShowBulkEditDatesModal(false);
      setShowBulkActions(false); // Close bulk actions after successful operation
    } catch (error) {
      console.error('Error updating invoice dates:', error);
      toast.error('Chyba pri aktualizácii dátumov faktúr');
    }
  };

  // Funkcia na generovanie QR kódu pre faktúru pomocou Pay by Square
  const generateQRCodeForInvoice = async (invoice) => {
    if (!invoice.company_iban) return null;
    
    try {
      // Odstránime medzery z IBAN
      const cleanIban = invoice.company_iban.replace(/\s+/g, '');
      const services = invoice.services || [];
      const totalPrice = services.reduce((acc, service) => {
        const price = parseFloat(service.price) || 0;
        const quantity = parseInt(service.quantity, 10) || 0;
        return acc + (price * quantity);
      }, 0);
      const amount = parseFloat(totalPrice.toFixed(2));
      const variableSymbol = (invoice.invoice_number || '').replace(/\s+/g, '');
      const recipientName = (invoice.company_name || '').substring(0, 70); // Názov príjemcu = company_name
      const message = (invoice.invoice_name || '').substring(0, 140); // Informácia pre príjemcu = invoice_name
      
      // Pay by Square formát - slovenský štandard
      const qrString = encode({
        payments: [
          {
            type: PaymentOptions.PaymentOrder,
            amount: amount,
            variableSymbol: variableSymbol || undefined,
            currencyCode: CurrencyCode.EUR,
            bankAccounts: [
              { iban: cleanIban }
            ],
            note: message || undefined, // Informácia pre príjemcu = invoice_name
            payeeName: recipientName || undefined, // Názov príjemcu = company_name
          },
        ],
      });
      
      // Generujeme QR kód ako base64 obrázok z Pay by Square stringu
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 200
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating Pay by Square QR code:', error);
      return null;
    }
  };

  const handleBulkDownload = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na stiahnutie');
      return;
    }
  
    try {
      setIsGeneratingPDF(true);
      const selectedInvoices = allInvoices.filter(invoice => selectedInvoiceIds.includes(invoice.id));
      
      // Rozdelenie faktúr podľa id_company (hlavnej firmy)
      const invoicesByCompany = {};
      
      for (const invoice of selectedInvoices) {
        const companyId = invoice.id_company || 'bez_firmy';
        const companyName = invoice.company_name || `Firma_${companyId}`;
        
        if (!invoicesByCompany[companyId]) {
          invoicesByCompany[companyId] = {
            companyName: companyName,
            invoices: []
          };
        }
        
        invoicesByCompany[companyId].invoices.push(invoice);
      }

      // Získať mesiac a rok z faktúr
      const getMonthYear = (invoices) => {
        const monthYearCounts = {};
        for (const invoice of invoices) {
          let invoiceMonth = '';
          let invoiceYear = '';
          
          if (invoice.billing_month) {
            const billingMonth = parseInt(invoice.billing_month);
            if (!isNaN(billingMonth) && billingMonth >= 1 && billingMonth <= 12) {
              invoiceMonth = billingMonth.toString();
            }
          }
          
          if (invoice.issue_date) {
            const date = new Date(invoice.issue_date);
            if (!invoiceMonth) {
              invoiceMonth = (date.getMonth() + 1).toString();
            }
            invoiceYear = date.getFullYear().toString();
          }
          
          if (invoiceMonth && invoiceYear) {
            const key = `${invoiceMonth}/${invoiceYear}`;
            monthYearCounts[key] = (monthYearCounts[key] || 0) + 1;
          }
        }
        
        let maxCount = 0;
        let mostCommon = '';
        for (const [key, count] of Object.entries(monthYearCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = key;
          }
        }
        
        if (mostCommon) {
          return mostCommon.split('/');
        } else if (selectedInvoices[0]?.issue_date) {
          const date = new Date(selectedInvoices[0].issue_date);
          return [(date.getMonth() + 1).toString(), date.getFullYear().toString()];
        }
        return ['', ''];
      };

      // Ak je len jedna firma, stiahnuť jeden PDF
      if (Object.keys(invoicesByCompany).length === 1) {
        const companyId = Object.keys(invoicesByCompany)[0];
        const { companyName, invoices } = invoicesByCompany[companyId];
        const [month, year] = getMonthYear(invoices);
        
        // Generujeme QR kódy pre všetky faktúry
        const invoicesWithQR = await Promise.all(
          invoices.map(async (invoice) => {
            const qrCode = await generateQRCodeForInvoice(invoice);
            return { ...invoice, qrCode };
          })
        );
        
        // Sanitize company name for filename
        const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = month && year 
          ? `${sanitizedCompanyName}_${month}_${year}.pdf`
          : `${sanitizedCompanyName}.pdf`;
        
        const blob = await pdf(<BulkInvoiceDocument invoices={invoicesWithQR} />).toBlob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        toast.success('PDF úspešne stiahnutý');
      } else {
        // Viac firiem - stiahnuť viacero PDF súborov
        const companyNames = [];
        for (const companyId of Object.keys(invoicesByCompany)) {
          const { companyName, invoices } = invoicesByCompany[companyId];
          const [month, year] = getMonthYear(invoices);
          
          // Generujeme QR kódy pre všetky faktúry
          const invoicesWithQR = await Promise.all(
            invoices.map(async (invoice) => {
              const qrCode = await generateQRCodeForInvoice(invoice);
              return { ...invoice, qrCode };
            })
          );
          
          // Sanitize company name for filename
          const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = month && year 
            ? `${sanitizedCompanyName}_${month}_${year}.pdf`
            : `${sanitizedCompanyName}.pdf`;
          
          companyNames.push(companyName);
          
          const blob = await pdf(<BulkInvoiceDocument invoices={invoicesWithQR} />).toBlob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          
          // Malé oneskorenie medzi stiahnutiami
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        toast.success(`PDF úspešne stiahnuté (${companyNames.length} firiem: ${companyNames.join(', ')})`);
      }
      
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error generating bulk PDF:', error);
      toast.error('Chyba pri generovaní PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBulkExportExcel = async () => {
    if (selectedInvoiceIds.length === 0) {
      toast.warn('Žiadne faktúry na export');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const selectedInvoices = allInvoices.filter(invoice => selectedInvoiceIds.includes(invoice.id));
      
      // Rozdelenie faktúr podľa id_company (hlavnej firmy)
      const invoicesByCompany = {};
      
      for (const invoice of selectedInvoices) {
        const companyId = invoice.id_company || 'bez_firmy';
        const companyName = invoice.company_name || `Firma_${companyId}`;
        
        if (!invoicesByCompany[companyId]) {
          invoicesByCompany[companyId] = {
            companyName: companyName,
            invoices: []
          };
        }
        
        invoicesByCompany[companyId].invoices.push(invoice);
      }

      // Vytvorenie workbooku
      const workbook = XLSX.utils.book_new();

      // Pre každú firmu vytvoríme sheet
      for (const companyId of Object.keys(invoicesByCompany)) {
        const { companyName, invoices } = invoicesByCompany[companyId];
        
        // Zoradiť faktúry podľa residential_company_name a potom podľa čísla faktúry
        invoices.sort((a, b) => {
          // Najprv podľa residential_company_name
          const residentialA = a.residential_company_name || '';
          const residentialB = b.residential_company_name || '';
          if (residentialA !== residentialB) {
            return residentialA.localeCompare(residentialB);
          }
          // Potom podľa čísla faktúry
          const numA = parseInt(a.invoice_number?.replace(/\D/g, '') || '0');
          const numB = parseInt(b.invoice_number?.replace(/\D/g, '') || '0');
          return numA - numB;
        });

        // Získať mesiac a rok z faktúr
        // Skúsiť nájsť najčastejší mesiac/rok alebo použiť z prvej faktúry
        let month = '';
        let year = '';
        
        // Zozbierať všetky mesiace a roky z faktúr
        const monthYearCounts = {};
        for (const invoice of invoices) {
          let invoiceMonth = '';
          let invoiceYear = '';
          
          if (invoice.billing_month) {
            const billingMonth = parseInt(invoice.billing_month);
            if (!isNaN(billingMonth) && billingMonth >= 1 && billingMonth <= 12) {
              invoiceMonth = billingMonth.toString();
            }
          }
          
          if (invoice.issue_date) {
            const date = new Date(invoice.issue_date);
            if (!invoiceMonth) {
              invoiceMonth = (date.getMonth() + 1).toString();
            }
            invoiceYear = date.getFullYear().toString();
          }
          
          if (invoiceMonth && invoiceYear) {
            const key = `${invoiceMonth}/${invoiceYear}`;
            monthYearCounts[key] = (monthYearCounts[key] || 0) + 1;
          }
        }
        
        // Nájsť najčastejší mesiac/rok
        let maxCount = 0;
        let mostCommon = '';
        for (const [key, count] of Object.entries(monthYearCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = key;
          }
        }
        
        if (mostCommon) {
          [month, year] = mostCommon.split('/');
        } else {
          // Fallback na prvú faktúru
          const firstInvoice = invoices[0];
          if (firstInvoice.issue_date) {
            const date = new Date(firstInvoice.issue_date);
            month = (date.getMonth() + 1).toString();
            year = date.getFullYear().toString();
          }
        }

        // Vytvoriť hlavný názov: "Názov firmy mesiac/rok"
        const headerTitle = month && year ? `${companyName} ${month}/${year}` : companyName;

        // Pripraviť dáta pre Excel
        const excelData = [];
        
        // Hlavička
        excelData.push([headerTitle]);
        excelData.push([]); // Prázdny riadok
        
        // Hlavička tabuľky
        excelData.push(['Č. faktúry', '', 'Suma', 'Vyplatené']);
        
        // Zoskupiť faktúry podľa residential_company_name
        const invoicesByResidential = {};
        for (const invoice of invoices) {
          // Získať názov rezidenčnej firmy
          let residentialName = invoice.residential_company_name || '';
          
          if (!residentialName && invoice.id_residential_company) {
            try {
              const residentialCompany = await getResidentialCompanyById(invoice.id_residential_company);
              residentialName = residentialCompany.company_name || '';
            } catch (error) {
              console.error('Error fetching residential company:', error);
            }
          }
          
          // Ak stále nie je názov, použiť "Bez rezidenčnej firmy"
          if (!residentialName) {
            residentialName = 'Bez rezidenčnej firmy';
          }
          
          if (!invoicesByResidential[residentialName]) {
            invoicesByResidential[residentialName] = [];
          }
          
          invoicesByResidential[residentialName].push(invoice);
        }
        
        // Pridať faktúry zoskupené podľa residential company
        const residentialCompanyNames = Object.keys(invoicesByResidential).sort();
        let isFirstGroup = true;
        
        for (const residentialName of residentialCompanyNames) {
          const groupInvoices = invoicesByResidential[residentialName];
          
          // Pridať prázdny riadok pred každou skupinou (okrem prvej)
          if (!isFirstGroup) {
            excelData.push([]);
          }
          isFirstGroup = false;
          
          // Pridať názov residential company
          excelData.push([residentialName, '', '', '']);
          
          // Pridať faktúry pre túto residential company
          for (const invoice of groupInvoices) {
            // Vypočítať celkovú sumu
            const totalPrice = (invoice.services || []).reduce((acc, service) => {
              const price = parseFloat(service.price) || 0;
              const quantity = parseInt(service.quantity, 10) || 0;
              return acc + price * quantity;
            }, 0);

            // Získať číslo faktúry (iba čísla, bez roku)
            let invoiceNumber = invoice.invoice_number || '';
            // Ak je formát YYYYNNNN, vezmi len posledné 4 číslice
            if (invoiceNumber.length === 8 && /^\d{8}$/.test(invoiceNumber)) {
              invoiceNumber = invoiceNumber.substring(4);
            } else if (invoiceNumber.includes('/')) {
              // Starý formát: 00001/2026
              invoiceNumber = invoiceNumber.split('/')[0];
            }
            // Odstrániť úvodné nuly
            invoiceNumber = invoiceNumber.replace(/^0+/, '') || invoiceNumber;

            // Použiť invoice_name namiesto residential_company_name
            const invoiceName = invoice.invoice_name || '';

            excelData.push([
              invoiceNumber,
              invoiceName,
              totalPrice.toFixed(2),
              '' // Vyplatené - prázdne
            ]);
          }
        }
        
        // Vytvoriť worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        
        // Nastaviť šírku stĺpcov
        worksheet['!cols'] = [
          { wch: 12 }, // Č. faktúry
          { wch: 40 }, // Popis/Rezidenčná firma
          { wch: 12 }, // Suma
          { wch: 12 }, // Vyplatené
        ];
        
        // Formátovanie hlavičky (prvý riadok) - hlavná firma väčšia
        if (worksheet['A1']) {
          worksheet['A1'].s = {
            font: { bold: true, sz: 18 },
            alignment: { horizontal: 'left' }
          };
        }
        
        // Formátovanie hlavičky tabuľky (tretí riadok)
        const headerRow = 3;
        ['A', 'B', 'C', 'D'].forEach(col => {
          const cell = `${col}${headerRow}`;
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: true },
              alignment: { horizontal: 'center' }
            };
          }
        });
        
        // Formátovanie názvov residential companies (tučné a väčšie)
        let currentRow = headerRow + 1; // Začneme za hlavičkou tabuľky
        for (let i = 0; i < residentialCompanyNames.length; i++) {
          const residentialName = residentialCompanyNames[i];
          
          // Prázdny riadok (ak nie je prvá skupina)
          if (i > 0) {
            currentRow++;
          }
          
          // Riadok s názvom residential company
          currentRow++;
          const nameCell = `A${currentRow}`;
          if (worksheet[nameCell]) {
            worksheet[nameCell].s = {
              font: { bold: true, sz: 14 },
              alignment: { horizontal: 'left' }
            };
          }
          
          // Preskočiť faktúry tejto skupiny
          currentRow += invoicesByResidential[residentialName].length;
        }
        
        // Formátovanie stĺpca Suma (číselný formát)
        const dataStartRow = 4; // Začiatok dát (po hlavičkách)
        for (let row = dataStartRow; row <= excelData.length; row++) {
          const cell = `C${row}`;
          if (worksheet[cell]) {
            worksheet[cell].z = '#,##0.00';
          }
        }
        
        // Pridať sheet do workbooku (názov sheetu je obmedzený na 31 znakov)
        const sheetName = companyName.length > 31 ? companyName.substring(0, 31) : companyName;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      // Exportovať do Excelu
      // Vytvoriť názov súboru podľa firiem a mesiac/rok
      const companyNames = Object.values(invoicesByCompany).map(c => c.companyName);
      const allInvoicesForMonthYear = selectedInvoices;
      const [month, year] = (() => {
        const monthYearCounts = {};
        for (const invoice of allInvoicesForMonthYear) {
          let invoiceMonth = '';
          let invoiceYear = '';
          
          if (invoice.billing_month) {
            const billingMonth = parseInt(invoice.billing_month);
            if (!isNaN(billingMonth) && billingMonth >= 1 && billingMonth <= 12) {
              invoiceMonth = billingMonth.toString();
            }
          }
          
          if (invoice.issue_date) {
            const date = new Date(invoice.issue_date);
            if (!invoiceMonth) {
              invoiceMonth = (date.getMonth() + 1).toString();
            }
            invoiceYear = date.getFullYear().toString();
          }
          
          if (invoiceMonth && invoiceYear) {
            const key = `${invoiceMonth}/${invoiceYear}`;
            monthYearCounts[key] = (monthYearCounts[key] || 0) + 1;
          }
        }
        
        let maxCount = 0;
        let mostCommon = '';
        for (const [key, count] of Object.entries(monthYearCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommon = key;
          }
        }
        
        if (mostCommon) {
          return mostCommon.split('/');
        } else if (allInvoicesForMonthYear[0]?.issue_date) {
          const date = new Date(allInvoicesForMonthYear[0].issue_date);
          return [(date.getMonth() + 1).toString(), date.getFullYear().toString()];
        }
        return ['', ''];
      })();
      
      // Sanitize company names for filename
      const sanitizedCompanyNames = companyNames.map(name => name.replace(/[^a-zA-Z0-9]/g, '_')).join('_');
      let fileName;
      
      if (Object.keys(invoicesByCompany).length === 1) {
        // Jedna firma
        fileName = month && year 
          ? `${sanitizedCompanyNames}_${month}_${year}.xlsx`
          : `${sanitizedCompanyNames}.xlsx`;
      } else {
        // Viac firiem - dať názvy za sebou
        fileName = month && year 
          ? `${sanitizedCompanyNames}_${month}_${year}.xlsx`
          : `${sanitizedCompanyNames}.xlsx`;
      }
      
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Excel úspešne exportovaný (${Object.keys(invoicesByCompany).length} firiem)`);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Chyba pri exporte do Excelu');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Pagination Logic
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  const getCurrentPageInvoices = () => currentInvoices;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedInvoiceIds([]); // Reset selection when page changes
    setShowBulkActions(false); // Hide bulk actions
  };

  // Handler for selecting/deselecting all invoices on current page
  const handleSelectAllInvoices = (isSelected) => {
    if (isSelected) {
      const currentPageInvoices = getCurrentPageInvoices();
      const newSelectedIds = [
        ...new Set([...selectedInvoiceIds, ...currentPageInvoices.map(invoice => invoice.id)]),
      ];
      setSelectedInvoiceIds(newSelectedIds);
    } else {
      const currentPageInvoices = getCurrentPageInvoices();
      const newSelectedIds = selectedInvoiceIds.filter(id => !currentPageInvoices.some(invoice => invoice.id === id));
      setSelectedInvoiceIds(newSelectedIds);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <img
            src="/images/checklist.png"
            alt="checklist"
            className="w-6 h-6 rounded-full"
          />
          <h1 className="text-gray-600 text-2xl font-bold">Faktúry</h1>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
            onClick={() => setShowAddInvoiceModal(true)}
          >
            + Pridať faktúru
          </button>
          <button
            className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
            onClick={() => setShowAddMonthlyInvoicesModal(true)}
          >
            + Pridať mesačné faktúry
          </button>
          <button
            className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-700 transition duration-300"
            onClick={() => setShowAddMonthlyInvoicesForCompanyModal(true)}
          >
            + Mesačné faktúry pre firmu
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Import XML
          </button>
        </div>
      </div>

      {/* Invoice Filter */}
      <div className="mb-4">
        <InvoiceFilter invoices={allInvoices} onFilter={handleFilterChange} />
      </div>

      {/* Select for invoices per page */}
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="invoicesPerPage" className="font-semibold">
          Počet faktúr na stránku:
        </label>
        <select
          id="invoicesPerPage"
          value={invoicesPerPage}
          onChange={(e) => {
            setInvoicesPerPage(Number(e.target.value));
            setCurrentPage(1); // reset na prvú stránku
          }}
          className="border rounded px-2 py-1"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedInvoiceIds.length > 0 && (
        <div className="mb-4">
          <button
            className="bg-gray-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-gray-700 transition duration-300"
            onClick={() => setShowBulkActions(prev => !prev)}
          >
            Akcie ({selectedInvoiceIds.length})
          </button>
          {showBulkActions && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <button
                className="bg-blue-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-700 transition duration-300"
                onClick={handleBulkMarkAsSent}
              >
                Označiť ako odoslané
              </button>
              <button
                className="bg-green-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-green-700 transition duration-300"
                onClick={handleBulkMarkAsPaid}
              >
                Označiť ako zaplatené
              </button>
              <button
                className="bg-teal-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-teal-700 transition duration-300"
                onClick={handleBulkEditDates}
              >
                Upraviť dátumy
              </button>
              <button
                className="bg-purple-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-purple-700 transition duration-300"
                onClick={handleBulkDownload}
              >
                Stiahnuť PDF
              </button>
              <button
                className="bg-orange-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-orange-700 transition duration-300"
                onClick={handleBulkExportExcel}
              >
                Export Excel
              </button>
              <button
                className="bg-red-600 text-white font-semibold px-3 py-1 rounded-md hover:bg-red-700 transition duration-300"
                onClick={handleBulkDelete}
              >
                Vymazať
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoice Table */}
      <div className="bg-white w-full p-4 shadow-xl rounded-2xl">
        <InvoiceTableExtended
          invoices={currentInvoices}
          onEdit={handleEdit}
          onMarkAsSent={handleMarkAsSent}
          onMarkAsPaid={handleMarkAsPaid}
          onDelete={handleDelete}
          selectedInvoiceIds={selectedInvoiceIds}
          onSelectInvoice={handleSelectInvoice}
          onSelectAllInvoices={handleSelectAllInvoices}
        />
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 gap-2">
          {/* Previous Button */}
          <button
            className={`px-3 py-1 rounded ${
              currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ Predchádzajúca
          </button>

          {/* First Page */}
          {currentPage > 3 && (
            <>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {currentPage > 4 && <span className="px-2">...</span>}
            </>
          )}

          {/* Page Numbers around current page */}
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter(pageNumber => {
              // Show pages around current page
              return pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2;
            })
            .map(pageNumber => (
              <button
                key={pageNumber}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

          {/* Last Page */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="px-2">...</span>}
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next Button */}
          <button
            className={`px-3 py-1 rounded ${
              currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Ďalšia ›
          </button>

          {/* Page Info */}
          <span className="ml-2 text-gray-600">
            Strana {currentPage} z {totalPages}
          </span>
        </div>
      )}

      {/* Modals */}
      {showAddInvoiceModal && (
        <AddInvoiceModal closeModal={() => setShowAddInvoiceModal(false)} onSubmit={handleAddInvoice} />
      )}
      {showEditInvoiceModal && (
        <EditInvoiceModal
          closeModal={() => {
            setShowEditInvoiceModal(false);
            setSelectedInvoiceId(null);
          }}
          onSubmit={handleUpdateInvoice}
          invoiceId={selectedInvoiceId}
        />
      )}
      {/* Modál pre import XML s výdavkami */}
      {showImportModal && (
        <ImportExpensesModal
          closeModal={() => setShowImportModal(false)}
          onImport={(transactions) => {
            sendTransactionsToBackend(transactions);
          }}
        />
      )}
      {showAddMonthlyInvoicesModal && (
        <AddMonthlyInvoicesModal closeModal={() => setShowAddMonthlyInvoicesModal(false)} onSubmit={handleAddMonthlyInvoices} />
      )}
      {showAddMonthlyInvoicesForCompanyModal && (
        <AddMonthlyInvoicesForCompanyModal closeModal={() => setShowAddMonthlyInvoicesForCompanyModal(false)} onSubmit={handleAddMonthlyInvoicesForCompany} />
      )}
      {showBulkMarkAsPaidModal && (
        <MarkAsPaidModal closeModal={() => setShowBulkMarkAsPaidModal(false)} onSubmit={handleBulkMarkAsPaidSubmit} />
      )}
      {showBulkEditDatesModal && (
        <BulkEditInvoiceDatesModal closeModal={() => setShowBulkEditDatesModal(false)} onSubmit={handleBulkEditDatesSubmit} />
      )}
      {isGeneratingPDF && (
        <div className="flex justify-center items-center">
          <div className="loader">Generovanie PDF...</div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Invoices;
