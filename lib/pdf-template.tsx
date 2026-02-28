import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    paddingTop: 71,
    paddingBottom: 71,
    paddingLeft: 71,
    paddingRight: 71,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#10B981',
  },
  headerLeft: { flexDirection: 'column' },
  headerBrand: { fontSize: 14, fontFamily: 'Times-Bold', color: '#10B981' },
  headerSub: { fontSize: 8, color: '#666' },
  title: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  body: { fontSize: 11, lineHeight: 1.7, textAlign: 'justify' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 71,
    right: 71,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#888',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 6,
  },
})

interface Props {
  titulo: string
  cleanText: string
  fechaGeneracion: string
}

export function LegalPdfDocument({ titulo, cleanText, fechaGeneracion }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBrand}>LexAI CR</Text>
            <Text style={styles.headerSub}>Documento Legal</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#888' }}>{fechaGeneracion}</Text>
        </View>

        <Text style={styles.title}>{titulo}</Text>

        <Text style={styles.body}>{cleanText}</Text>

        <View style={styles.footer} fixed>
          <Text>LexAI CR — Documento generado electrónicamente</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
