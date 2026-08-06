// src/components/InvoicePdf.js
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import PropTypes from 'prop-types';

const colors = {
    primaryBlue: '#2f5597',
    white: '#FFFFFF',
    lightGray: '#e4e4e4',
    darkGray: '#555555',
};

// Registrácia fontu, ktorý podporuje slovenské znaky
Font.register({
    family: 'DejaVu Sans',
    fonts: [
        {
            src: '/fonts/dejavu-sans.ttf', // Normálny font
            fontWeight: 'normal',
        },
        {
            src: '/fonts/dejavu-sans-bold.ttf', // Tučný font
            fontWeight: 'bold',
        },
    ],
});

// Definujeme štýly
const styles = StyleSheet.create({
    page: {
        fontFamily: 'DejaVu Sans',
        fontSize: 10,
        paddingTop: 20,
        paddingHorizontal: 40,
        paddingBottom: 40,
        lineHeight: 1.5,
        flexDirection: 'column',
        justifyContent: 'space-between',
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
    headerText: {
        fontSize: 20,
        color: colors.primaryBlue,
        fontWeight: 'bold',
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
        fontSize: 9,
        color: colors.white,
        marginBottom: 2,
    },
    // Každý dátum dostane vlastnú tretinu šírky, aby sa texty neprekrývali
    invoiceDetailsColumn: {
        flex: 1,
        paddingRight: 4,
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
        marginTop: 10,
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
});

// Pomocná funkcia na formátovanie description_above_services
const formatDescription = (desc, month, invoice_date) => {
  if (!desc) return '';
  // Najprv nahradíme token {mesiac/rok}
  const formatted = desc
    .replace(/{mesiac\/rok}/g, () => {
      const invoiceDateObj = new Date(invoice_date);
      let invoiceYear = invoiceDateObj.getFullYear();
      const invoiceMonth = parseInt(month, 10);

      return `${month}/${invoiceYear}`;
    })
    // Potom nahradíme token {mesiac}
    .replace(/{mesiac}/g, month);
  return formatted;
};

const InvoicePdf = ({ invoice }) => {
    const {
        invoice_number,
        invoice_date,
        due_date,
        month,
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
        services_planned,
    } = invoice;

    // Použijeme formátovanie description_above_services
    const formattedDescriptionAbove = formatDescription(description_above_services, month, invoice_date);

    // Formátovanie služieb
    const formattedServices = Array.isArray(services_planned)
        ? services_planned
            .filter(service => service && typeof service === 'object' && 'name' in service)
            .map(service => ({
                ...service,
                price: typeof service.price === 'number' ? service.price : Number(service.price) || 0,
                quantity: typeof service.quantity === 'number' ? service.quantity : Number(service.quantity) || 0,
            }))
        : [];

    const totalPrice = formattedServices.reduce(
        (acc, service) => acc + (service.price || 0) * (service.quantity || 0),
        0
    );
    
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Hlavička */}
                <View style={styles.header}>
                    {/* Logo alebo číslo faktúry */}
                    <Text style={styles.invoiceNumber}>Faktúra č: {invoice_number}</Text>
                </View>

                {/* Detaily Faktúry v jednom riadku */}
                <View style={styles.invoiceDetails}>
                    <View style={styles.invoiceDetailsColumn}>
                        <Text style={styles.invoiceDetailsText}>Fakturačný mesiac: {month || 'N/A'}</Text>
                    </View>
                    <View style={styles.invoiceDetailsColumn}>
                        <Text style={styles.invoiceDetailsText}>Dátum vystavenia: {invoice_date || 'N/A'}</Text>
                    </View>
                    <View style={styles.invoiceDetailsColumn}>
                        <Text style={styles.invoiceDetailsText}>Dátum splatnosti: {due_date || 'N/A'}</Text>
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
                        {header1 && <Text style={styles.infoText}>{header1.trim()}</Text>}
                        {header2 && <Text style={styles.infoText}>{header2.trim()}</Text>}
                        {header3 && <Text style={styles.infoText}>{header3.trim()}</Text>}
                        {header4 && <Text style={styles.infoText}>{header4.trim()}</Text>}
                        {residential_company_name && (
                            <Text style={styles.infoText}>{residential_company_name.trim()}</Text>
                        )}
                        {residential_company_address && (
                            <Text style={styles.infoText}>{residential_company_address.trim()}</Text>
                        )}
                        {(residential_city && residential_postal_code) && (
                            <Text style={styles.infoText}>
                                {residential_city.trim()}, {residential_postal_code.trim()}
                            </Text>
                        )}
                        {residential_company_ico && (
                            <Text style={styles.infoText}>IČO: {residential_company_ico.trim()}</Text>
                        )}
                        {residential_company_dic && (
                            <Text style={styles.infoText}>DIČ: {residential_company_dic.trim()}</Text>
                        )}
                        {residential_company_iban && (
                            <Text style={styles.infoText}>Iban: {residential_company_iban.trim()}</Text>
                        )}
                    </View>
                </View>

                {/* Platobné Informácie */}
                <View style={styles.section}>
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
                        <Text style={styles.boldText}>Forma úhrady: Prevodom</Text>
                    </Text>
                </View>

                {/* Description Above Services s tokenmi nahradenými */}
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
                        <Text style={{ ...styles.tableColHeader, flex: 1 }}>Cena za služby</Text>
                    </View>
                    {description_services && (
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.tableCol, width: '100%', textAlign: 'left' }}>
                                {description_services}
                            </Text>
                        </View>
                    )}
                    {formattedServices.map((service, index) => (
                        <View style={styles.tableRow} key={index}>
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

                {/* Priestor medzi tabuľkou a podpisami/spodkom */}
                <View style={{ flexGrow: 1 }} />

                {/* Podpisy a Pätička */}
                <View>
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
                    <View style={styles.footer}>
                        <Text>
                            © {new Date().getFullYear()} {company_name || 'N/A'}. Všetky práva vyhradené.
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

InvoicePdf.propTypes = {
    invoice: PropTypes.shape({
        invoice_number: PropTypes.string,
        invoice_date: PropTypes.string,
        due_date: PropTypes.string,
        month: PropTypes.string,
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
        residential_company_iban: PropTypes.string,
        description_above_services: PropTypes.string,
        description_services: PropTypes.string,
        payment_method: PropTypes.string,
        services_planned: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                quantity: PropTypes.number,
                price: PropTypes.number,
            })
        ).isRequired,
    }).isRequired,
};

export default InvoicePdf;
