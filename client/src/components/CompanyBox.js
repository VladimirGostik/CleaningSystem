// src/components/CompanyBox.js
import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';

const CompanyBox = ({ company, invoices, expenses, fromDate, toDate }) => {
  const [invoiceStatusTotals, setInvoiceStatusTotals] = useState({});
  const [expenseTypeTotals, setExpenseTypeTotals] = useState({});
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    // Agregácia faktúr podľa statusu (predpokladáme, že faktúry už obsahujú computed "total_price")
    const computedInvoices = invoices.map((invoice) => {
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
    // Agregácia faktúr podľa statusu
    const invoiceTotals = computedInvoices.reduce((acc, inv) => {
      const status = inv.status || 'unknown';
      const amount = parseFloat(inv.total_price) || 0;
      acc[status] = (acc[status] || 0) + amount;
      acc.total = (acc.total || 0) + amount;
      return acc;
    }, {});

    // Pre výdavky definujeme filtrované obdobie
    const filterStart = new Date(fromDate);
    const filterEnd = new Date(toDate);

    // Agregácia výdavkov podľa typu s prepočtom mesacných výdavkov
    const expenseTotals = expenses.reduce((acc, exp) => {
      let effectiveAmount = 0;
      if (exp.type === 'mesacna') {
        // Pre mesacné výdavky počítame počet mesiacov, počas ktorých je výdavok aktívny v rámci filtrovaného obdobia.
        const expenseStart = new Date(exp.start_date);
        // Ak nie je definovaný end_date, predpokladáme, že výdavok trvá až do konca filtrovaného obdobia.
        const expenseEnd = exp.end_date ? new Date(exp.end_date) : filterEnd;
        // Výpočet aktívneho intervalu: od maximálneho z expenseStart a filterStart,
        // do minimálneho z expenseEnd a filterEnd.
        const activeStart = expenseStart > filterStart ? expenseStart : filterStart;
        const activeEnd = expenseEnd < filterEnd ? expenseEnd : filterEnd;
        if (activeStart <= activeEnd) {
          // Funkcia na výpočet rozdielu v mesiacoch vrátane oboch mesiacov
          const monthDiff = (activeEnd.getFullYear() - activeStart.getFullYear()) * 12 +
            (activeEnd.getMonth() - activeStart.getMonth()) + 1;
          effectiveAmount = (parseFloat(exp.price) || 0) * monthDiff;
        }
      } else {
        // Jednorazový výdavok sa počíta len raz
        effectiveAmount = parseFloat(exp.price) || 0;
      }
      const type = exp.type || 'unknown';
      acc[type] = (acc[type] || 0) + effectiveAmount;
      acc.total = (acc.total || 0) + effectiveAmount;
      return acc;
    }, {});

    const paidInvoiceTotal = invoiceTotals.paid || 0;
    const expenseTotal = expenseTotals.total || 0;
    setProfit(paidInvoiceTotal - expenseTotal);

    setInvoiceStatusTotals(invoiceTotals);
    setExpenseTypeTotals(expenseTotals);
  }, [invoices, expenses, fromDate, toDate]);

  return (
    <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, boxShadow: 2, bgcolor: 'white', mb: 2 }}>
      {/* Názov firmy */}
      <Typography variant="h6" align="center" gutterBottom>
        {company.company_name}
      </Typography>

      {/* Sekcia: Faktúry podľa stavu */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Faktúry podľa stavu:
      </Typography>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>Created:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.created || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sent:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.sent || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Expired:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.expired || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Paid:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.paid || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Total:</strong></TableCell>
            <TableCell align="right"><strong>{invoiceStatusTotals.total || 0} €</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Sekcia: Výdavky podľa typu */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Výdavky podľa typu:
      </Typography>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>Mesačné:</TableCell>
            <TableCell align="right">{expenseTypeTotals.mesacna || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jednorazové:</TableCell>
            <TableCell align="right">{expenseTypeTotals.jednorazova || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Total:</strong></TableCell>
            <TableCell align="right"><strong>{expenseTypeTotals.total || 0} €</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Sekcia: Kombinácia (zaplatené faktúry vs. výdavky) */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Kombinácia (Zaplatené faktúry vs. Výdavky):
      </Typography>
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell>Zaplatené faktúry:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.paid || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Výdavky:</TableCell>
            <TableCell align="right">{expenseTypeTotals.total || 0} €</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Sekcia: Zisk */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Zisk:
      </Typography>
      <Typography variant="h6" align="center" sx={{ color: profit >= 0 ? 'green' : 'red' }}>
        {profit.toFixed(2)} €
      </Typography>
    </Box>
  );
};

export default CompanyBox;
