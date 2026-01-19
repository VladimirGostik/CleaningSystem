import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import InvoiceExtendedPDFBulk from './InvoiceExtendedPDFBulk'; // NECH VRACIA LEN <View> s obsahom

const styles = StyleSheet.create({
  page: {
    margin: 0,
    padding: 0,
  },
});

const BulkInvoiceDocument = ({ invoices }) => (
  <Document>
    {invoices.map(invoice => (
        <Page size="A4" style={{ flexDirection: 'column', padding: 0, display: 'flex' }}>
        <InvoiceExtendedPDFBulk invoice={invoice} />
      </Page>
    ))}
  </Document>
);

BulkInvoiceDocument.propTypes = {
  invoices: PropTypes.array.isRequired,
};

export default BulkInvoiceDocument;