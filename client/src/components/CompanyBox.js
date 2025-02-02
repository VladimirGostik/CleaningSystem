// src/components/CompanyBox.js
import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableRow } from '@mui/material';

const CompanyBox = ({ company, invoices, expenses }) => {
  const [invoiceStatusTotals, setInvoiceStatusTotals] = useState({});
  const [expenseTypeTotals, setExpenseTypeTotals] = useState({});
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    // Najprv prepočítame celkovú cenu faktúry, ak obsahuje pole "services"
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
  
    // Agregácia výdavkov podľa typu
    const expenseTotals = expenses.reduce((acc, exp) => {
      const type = exp.type || 'unknown';
      const amount = parseFloat(exp.price) || 0;
      acc[type] = (acc[type] || 0) + amount;
      acc.total = (acc.total || 0) + amount;
      return acc;
    }, {});
  
    const paidInvoiceTotal = invoiceTotals.paid || 0;
    const expenseTotal = expenseTotals.total || 0;
    setProfit(paidInvoiceTotal - expenseTotal);
  
    setInvoiceStatusTotals(invoiceTotals);
    setExpenseTypeTotals(expenseTotals);
  }, [invoices, expenses]);
  

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
            <TableCell>Vytvorene:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.created || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Poslane:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.sent || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Expired:</TableCell>
            <TableCell align="right">{invoiceStatusTotals.expired || 0} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Zaplatene:</TableCell>
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

      {/* Sekcia: Kombinácia */}
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
