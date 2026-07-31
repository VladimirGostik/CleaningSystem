// BulkInvoiceDocumentOld.js
//
// STARÝ FORMÁT FAKTÚRY (stav kódu z 3.3.2025, commit 59a9721) - hromadné PDF
// pre dotlač starých faktúr. Zachováva pôvodný padding stránky (10), ktorý
// zodpovedá starému layoutu v InvoiceExtendedPDFBulkOld.
// NEUPRAVOVAŤ podľa nových požiadaviek - zmeny patria do BulkInvoiceDocument.js.
import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import InvoiceExtendedPDFBulkOld from './InvoiceExtendedPDFBulkOld'; // NECH VRACIA LEN <View> s obsahom

const BulkInvoiceDocumentOld = ({ invoices }) => (
  <Document>
    {invoices.map((invoice, index) => (
        <Page key={index} size="A4" style={{ flexDirection: 'column', padding: 10 }}>
        <InvoiceExtendedPDFBulkOld invoice={invoice} />
      </Page>
    ))}
  </Document>
);

BulkInvoiceDocumentOld.propTypes = {
  invoices: PropTypes.array.isRequired,
};

export default BulkInvoiceDocumentOld;
