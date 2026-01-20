// InvoiceExtendedPDFBulk.js
import React from 'react';
import { View, Text, StyleSheet, Font, Image } from '@react-pdf/renderer';
import PropTypes from 'prop-types';

const colors = {
  primaryBlue: '#2f5597',
  white: '#FFFFFF',
  lightGray: '#e4e4e4',
  darkGray: '#555555',
};

// Registrácia fontu (samozrejme, cesta k TTF súborom musí existovať)
Font.register({
  family: 'DejaVu Sans',
  fonts: [
    {
      src: '/fonts/dejavu-sans.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/dejavu-sans-bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const styles = StyleSheet.create({
  // Namiesto "page" radšej nazvime "container", aby nevznikal chaos
  container: {
    fontFamily: 'DejaVu Sans',
    fontSize: 10,
    paddingTop: 20,
    paddingHorizontal: 40,
    paddingBottom: 40,
    lineHeight: 1.5,
    flexDirection: 'column',
    minHeight: '100%',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 10,
  },
  invoiceNumber: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    width: '100%',
    color: colors.primaryBlue,
    fontWeight: 'bold',
  },
  invoiceDetails: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: colors.primaryBlue,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceDetailsText: {
    fontSize: 11,
    color: colors.white,
    marginBottom: 2,
  },
  section: {
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
    textAlign: 'left',
    border: '2 solid #2f5597',
  },
  section2: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 8,
    textDecoration: 'underline',
  },
  infoText: {
    fontSize: 10,
    color: colors.darkGray,
    marginBottom: 2,
  },
  boldText: {
    fontWeight: 'bold',
  },
  invoiceDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  detailsColumn: {
    width: '45%',
  },
  tableContainer: {
    marginTop: 10,
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    borderRadius: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primaryBlue,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBlue,
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    padding: 5,
  },
  tableColHeader: {
    width: '25%',
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'left',
    paddingLeft: 4,
  },
  tableCol: {
    width: '25%',
    fontSize: 10,
    color: colors.darkGray,
    textAlign: 'left',
    paddingLeft: 4,
  },
  totalSection: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
    color: colors.primaryBlue,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primaryBlue,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signature: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: '#000',
    width: '80%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  footer: {
    textAlign: 'center',
    fontSize: 9,
    color: '#777',
    borderTopWidth: 1,
    borderColor: colors.lightGray,
    paddingTop: 10,
    marginTop: 20,
  },
  signatureSectionFull: {
    marginTop: 'auto', // Posunie podpisy na spodok
    justifyContent: 'flex-end',
    paddingBottom: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 40,
  },
  contentWrapper: {
    flexGrow: 1,
    marginBottom: 200, // Priestor pre podpisy a footer
  },
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 15,
  },
  paymentInfo: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    textAlign: 'left',
    border: '2 solid #2f5597',
  },
  qrCodeContainer: {
    padding: 5,
    borderRadius: 5,
    border: '1 solid #2f5597',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 105,
  },
  qrCode: {
    width: 95,
    height: 95,
  },
});

const formatDescription = (desc, billing_month, issue_date) => {
  if (!desc) return '';
  const formatted = desc
    .replace(/{mesiac\/rok}/g, () => {
      const invoiceDateObj = new Date(issue_date);
      let invoiceYear = invoiceDateObj.getFullYear();
      return `${billing_month}/${invoiceYear}`;
    })
    .replace(/{mesiac}/g, billing_month);
  return formatted;
}; 

const InvoiceExtendedPDFBulk = ({ invoice }) => {
  const {
    invoice_number,
    invoice_name,
    issue_date,
    due_date,
    billing_month,
    company_name,
    company_address,
    city,
    postal_code,
    company_ico,
    company_dic,
    company_iban,
    bank_connection,
    header1,
    header2,
    header3,
    header4,
    residential_company_name,
    residential_company_address,
    residential_city,
    residential_postal_code,
    residential_company_ico,
    residential_company_dic,
    residential_company_iban,
    description_above_services,
    description_services,
    services,
  } = invoice;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formátovanie služieb
  const formattedServices = Array.isArray(services)
    ? services.map((service) => {
        const price = parseFloat(service.price) || 0;
        const quantity = parseInt(service.quantity, 10) || 0;
        return {
          ...service,
          price,
          quantity,
        };
      })
    : [];

  const formattedDescriptionAbove = formatDescription(description_above_services, billing_month, issue_date);

  const totalPrice = formattedServices.reduce((acc, service) => acc + service.price * service.quantity, 0);

  // Funkcia na vytvorenie QR kódu pre platobné údaje
  const generateQRCodeData = () => {
    if (!company_iban) return null;
    
    // Odstránime medzery z IBAN
    const cleanIban = company_iban.replace(/\s+/g, '');
    const amount = totalPrice.toFixed(2);
    const variableSymbol = invoice_number.replace(/\s+/g, ''); // Odstránime medzery z čísla faktúry
    const recipientName = company_name || '';
    const message = invoice_name || '';
    
    // Slovenský formát SPAYD (Short Payment Descriptor) pre slovenské banky
    // Format: SPD*1.0*ACC:IBAN*AM:AMOUNT*CC:EUR*RN:RECIPIENT_NAME*VS:VARIABLE_SYMBOL*MSG:MESSAGE
    // Všetky parametre sú voliteľné okrem ACC (IBAN)
    const qrDataParts = [
      'SPD*1.0',
      `ACC:${cleanIban}`,
      `AM:${amount}`,
      'CC:EUR',
      recipientName ? `RN:${recipientName}` : '',
      variableSymbol ? `VS:${variableSymbol}` : '',
      message ? `MSG:${message}` : ''
    ].filter(part => part !== ''); // Odstránime prázdne časti
    
    const qrData = qrDataParts.join('*');
    
    // Použijeme službu na generovanie QR kódu s vyšším rozlíšením pre lepšiu čitateľnosť
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(qrData)}`;
  };

  const qrCodeUrl = generateQRCodeData();

  return (
    <View style={styles.container}>
      {/* Hlavný obsah */}
      <View style={styles.contentWrapper}>
        {/* Hlavička */}
        <View style={styles.header}>
          <Text style={styles.invoiceNumber}>Faktúra č: {invoice_number}</Text>
        </View>

        {/* Detaily Faktúry v jednom riadku */}
        <View style={styles.invoiceDetails}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceDetailsText}>Fakturačný mesiac: {billing_month || 'N/A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceDetailsText}>Dátum vystavenia: {formatDate(issue_date)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceDetailsText}>Dátum splatnosti: {formatDate(due_date)}</Text>
          </View>
        </View>

        {/* Detaily Spoločností */}
        <View style={styles.invoiceDetailsContainer}>
          <View style={styles.detailsColumn}>
            <Text style={styles.sectionTitle}>Dodávateľ</Text>
            <Text style={styles.infoText}>{company_name || 'N/A'}</Text>
            <Text style={styles.infoText}>{company_address || 'N/A'}</Text>
            <Text style={styles.infoText}>
              {city || 'N/A'}, {postal_code || 'N/A'}
            </Text>
            <Text style={styles.infoText}>IČO: {company_ico || 'N/A'}</Text>
            <Text style={styles.infoText}>DIČ: {company_dic || 'N/A'}</Text>
          </View>
          <View style={styles.detailsColumn}>
            <Text style={styles.sectionTitle}>Odberateľ</Text>
            {header1 && <Text style={styles.infoText}>{header1}</Text>}
            {header2 && <Text style={styles.infoText}>{header2}</Text>}
            {header3 && <Text style={styles.infoText}>{header3}</Text>}
            {header4 && <Text style={styles.infoText}>{header4}</Text>}
            {residential_company_name && (
              <Text style={styles.infoText}>{residential_company_name}</Text>
            )}
            {residential_company_address && (
              <Text style={styles.infoText}>{residential_company_address}</Text>
            )}
            {residential_city && residential_postal_code && (
              <Text style={styles.infoText}>{residential_city}, {residential_postal_code}
              </Text>
            )}
            {residential_company_ico && (
              <Text style={styles.infoText}>IČO: {residential_company_ico}</Text>
            )}
            {residential_company_dic && (
              <Text style={styles.infoText}>DIČ: {residential_company_dic}</Text>
            )}
            {residential_company_iban && (
              <Text style={styles.infoText}>Iban: {residential_company_iban}</Text>
            )}
          </View>
        </View>

        {/* Platobné Informácie */}
        <View style={styles.paymentSection}>
          {qrCodeUrl && (
            <View style={styles.qrCodeContainer}>
              <Image src={qrCodeUrl} style={styles.qrCode} />
              <Text style={{ ...styles.infoText, marginTop: 5, fontSize: 8, textAlign: 'center', fontWeight: 'bold' }}>
                QR kód pre platbu
              </Text>
            </View>
          )}
          <View style={styles.paymentInfo}>
            {company_iban && (
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>IBAN:</Text> {company_iban}
              </Text>
            )}
            {bank_connection && (
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>Bankové spojenie:</Text> {bank_connection}
              </Text>
            )}
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Variabilný symbol:</Text> {invoice_number}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Forma úhrady:</Text> Prevodom
            </Text>
          </View>
        </View>

        {formattedDescriptionAbove && (
          <View style={styles.section2}>
            <Text style={styles.infoText}>{formattedDescriptionAbove}</Text>
          </View>
        )}

        {/* Tabuľka Služieb */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableColHeader, flex: 4 }}>Popis služby</Text>
            <Text style={{ ...styles.tableColHeader, flex: 1 }}>Množstvo</Text>
            <Text style={{ ...styles.tableColHeader, flex: 1 }}>Cena</Text>
          </View>
          {/* Riadok s description_services, ak je zadaný */}
          {description_services && (
            <View style={styles.tableRow}>
              <Text style={{ ...styles.tableCol, width: '100%', textAlign: 'left' }}>
                {description_services}
              </Text>
            </View>
          )}
          {/* Samotné služby */}
          {formattedServices.map((service, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={{ ...styles.tableCol, flex: 4 }}>{service.name || 'N/A'}</Text>
              <Text style={{ ...styles.tableCol, flex: 1 }}>{service.quantity}</Text>
              <Text style={{ ...styles.tableCol, flex: 1 }}>
                {(service.price * service.quantity).toFixed(2)} €
              </Text>
            </View>
          ))}
        </View>

        {/* Celková Cena */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Celková suma:</Text>
          <Text style={styles.totalValue}>{totalPrice.toFixed(2)} €</Text>
        </View>
      </View>

      {/* Podpisy a Pätička - vždy na spodku */}
      <View style={styles.signatureSectionFull}>
        {/* Podpisy */}
        <View style={styles.signatureSection}>
          <View style={styles.signature}>
            <Text>Vyhotovil: Erika Keszegová</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signature}>
            <Text>Prevzal:</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            © {new Date().getFullYear()} {company_name || 'N/A'}. Všetky práva vyhradené.
          </Text>
        </View>
      </View>
    </View>
  );
};

InvoiceExtendedPDFBulk.propTypes = {
  invoice: PropTypes.shape({
    invoice_number: PropTypes.string,
    invoice_name: PropTypes.string,
    issue_date: PropTypes.string,
    due_date: PropTypes.string,
    billing_month: PropTypes.string,
    company_name: PropTypes.string,
    company_address: PropTypes.string,
    city: PropTypes.string,
    postal_code: PropTypes.string,
    company_ico: PropTypes.string,
    company_dic: PropTypes.string,
    company_iban: PropTypes.string,
    bank_connection: PropTypes.string,
    header1: PropTypes.string,
    header2: PropTypes.string,
    header3: PropTypes.string,
    header4: PropTypes.string,
    residential_company_name: PropTypes.string,
    residential_company_address: PropTypes.string,
    residential_city: PropTypes.string,
    residential_postal_code: PropTypes.string,
    residential_company_ico: PropTypes.string,
    residential_company_dic: PropTypes.string,
    description_above_services: PropTypes.string,
    description_services: PropTypes.string,
    payment_method: PropTypes.string,
    services: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        quantity: PropTypes.number,
        price: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
};

export default InvoiceExtendedPDFBulk;