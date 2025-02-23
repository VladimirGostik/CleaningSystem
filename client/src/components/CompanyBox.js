// src/components/CompanyBox.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';

const CompanyBox = ({ company, invoices, expenses, fromDate, toDate, onEdit, onDelete }) => {
  const [invoiceStatusTotals, setInvoiceStatusTotals] = useState({});
  const [expenseTypeTotals, setExpenseTypeTotals] = useState({});
  const [profit, setProfit] = useState(0);

  // Pomocná funkcia na formátovanie čísla na dve desatinné miesta
  const formatNumber = (num) => (parseFloat(num) || 0).toFixed(2);

  // Stav pre menu (3 bodky)
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) onEdit(company.id);
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) onDelete(company.id);
  };
  useEffect(() => {
    // Prepočet total_price pre každú faktúru (ak obsahuje pole "services")
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
  
    // Výpočet súčtov výdavkov
    const expenseTotals = expenses.reduce((acc, exp) => {
      let effectiveAmount = 0;
      const expenseDate = new Date(exp.start_date);
  
      // Mesačné výdavky
      if (exp.type === 'mesacna') {
        const expenseStart = expenseDate;
        const expenseEnd = exp.end_date ? new Date(exp.end_date) : filterEnd;
        const activeStart = expenseStart > filterStart ? expenseStart : filterStart;
        const activeEnd = expenseEnd < filterEnd ? expenseEnd : filterEnd;
        if (activeStart <= activeEnd) {
          const monthDiff =
            (activeEnd.getFullYear() - activeStart.getFullYear()) * 12 +
            (activeEnd.getMonth() - activeStart.getMonth()) +
            1;
          effectiveAmount = (parseFloat(exp.price) || 0) * monthDiff;
        }
      }
      // Jednorazové výdavky
      else if (exp.type === 'jednorazova') {
        if (expenseDate >= filterStart && expenseDate <= filterEnd) {
          effectiveAmount = parseFloat(exp.price) || 0;
        }
      }
      // Ak je effectiveAmount > 0, pridaj do súčtov
      if (effectiveAmount > 0) {
        const type = exp.type;
        acc[type] = (acc[type] || 0) + effectiveAmount;
        acc.total = (acc.total || 0) + effectiveAmount;
      }
      return acc;
    }, {});
  
    const paidInvoiceTotal = invoiceTotals.paid || 0;
    const expenseTotal = expenseTotals.total || 0;
    setProfit(paidInvoiceTotal - expenseTotal);
    setInvoiceStatusTotals(invoiceTotals);
    setExpenseTypeTotals(expenseTotals);
  }, [invoices, expenses, fromDate, toDate]);

  return (
    <Box
      sx={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        p: 2,
        boxShadow: 2,
        bgcolor: 'white',
        mb: 2,
        position: 'relative', // pre absolútne pozicovanie menu
      }}
    >
      {/* Ikonka s 3 bodkami (vertikálny ellipsis) */}
      <IconButton
        aria-label="more"
        onClick={handleMenuClick}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <Typography variant="h6" component="span" sx={{ lineHeight: 1 }}>
          ⋮
        </Typography>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>Upraviť</MenuItem>
        <MenuItem onClick={handleDelete}>Vymazať</MenuItem>
      </Menu>

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
            <TableCell align="right">{formatNumber(invoiceStatusTotals.created)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Sent:</TableCell>
            <TableCell align="right">{formatNumber(invoiceStatusTotals.sent)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Expired:</TableCell>
            <TableCell align="right">{formatNumber(invoiceStatusTotals.expired)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Paid:</TableCell>
            <TableCell align="right">{formatNumber(invoiceStatusTotals.paid)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <strong>Total:</strong>
            </TableCell>
            <TableCell align="right">
              <strong>{formatNumber(invoiceStatusTotals.total)} €</strong>
            </TableCell>
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
            <TableCell align="right">{formatNumber(expenseTypeTotals.mesacna)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jednorazové:</TableCell>
            <TableCell align="right">{formatNumber(expenseTypeTotals.jednorazova)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <strong>Total:</strong>
            </TableCell>
            <TableCell align="right">
              <strong>{formatNumber(expenseTypeTotals.total)} €</strong>
            </TableCell>
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
            <TableCell align="right">{formatNumber(invoiceStatusTotals.paid)} €</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Výdavky:</TableCell>
            <TableCell align="right">{formatNumber(expenseTypeTotals.total)} €</TableCell>
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
