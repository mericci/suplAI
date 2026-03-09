---
name: sii-invoices-states
description: SII Chile Invoice Status Tracker - Technical Specification. This skill transforms Claude into a Chilean Tax Compliance & Factoring Expert. It should be used whenever a user needs to programmatically or logically verify the "Ground Truth" of a Chilean electronic invoice (DTE) beyond its simple existence. It is a technical bridge between the SII's SOAP-based legacy infrastructure and modern TypeScript/Node.js development. It provides the specific XML schemas, endpoint URLs, and—most importantly—the business logic to interpret the "Life Cycle" events of a Chilean invoice.
---
## Overview

This specification defines the integration with the Chilean Internal Revenue Service (SII) Web Service QueryEventos to determine the legal and commercial status of an Electronic Tax Document (DTE).

- Target URL (Production): https://www4.sii.cl/wsrpceconsultaws/services/QueryEventos
- Protocol: SOAP 1.1 / XMLAuthentication: Requires a valid Token cookie obtained via the SII
- Authentication Flow (Seed/GetToken).

## HTTP Request Contract

### Header Requirements

- Content-Type: text/xml charset=UTF-8
- SOAPAction: listarEventosHistDoc
- CookieToken=YOUR_SESSION_TOKEN

## Request Body (XML)

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.sii.cl">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:listarEventosHistDoc>
         <ws:rutEmisor>{RUT}</ws:rutEmisor>
         <ws:dvEmisor>{DV}</ws:dvEmisor>
         <ws:tipoDoc>{DTE_TYPE}</ws:tipoDoc>
         <ws:folio>{FOLIO}</ws:folio>
      </ws:listarEventosHistDoc>
   </soapenv:Body>
</soapenv:Envelope>
```

## Event Mapping & Business Logic

### Event Codes Table
Use these codes to interpret the codEvento field in the XML response.

CodeSII DescriptionBusiness MeaningExecutive MeritACDAceptación de ContenidoExplicitly Accepted by ClientPositiveERMOtorgamiento de ReciboGoods/Services ReceivedREQUIREDATCAceptación TácitaImplicitly Accepted (8-day rule)PositiveRCDReclamo de ContenidoRejected due to Invoice DataNULLIFIESRFPReclamo Falta ParcialPartial Goods MissingNULLIFIESRFTReclamo Falta TotalTotal Goods MissingNULLIFIES

### Executive Merit Algorithm

A Chilean invoice becomes an Executive Title (legally enforceable for collection/factoring) if it meets the following condition:

$$ExecutiveMerit = (ERM \lor ATC) \land \neg (RCD \lor RFP \lor RFT)$$

## Reference Implementation (TypeScript/Node.js)

```typescript
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

interface SIIEvent {
    codEvento: string;
    descEvento: string;
    fechaEvento: string;
    rutResponsable: string;
}

/**
 * Retrieves and interprets the status of a Chilean DTE.
 */
async function checkDTEStatus(rut: string, dv: string, type: number, folio: number, token: string) {
    const soapBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.sii.cl">
       <soapenv:Body>
          <ws:listarEventosHistDoc>
             <ws:rutEmisor>${rut}</ws:rutEmisor>
             <ws:dvEmisor>${dv}</ws:dvEmisor>
             <ws:tipoDoc>${type}</ws:tipoDoc>
             <ws:folio>${folio}</ws:folio>
          </ws:listarEventosHistDoc>
       </soapenv:Body>
    </soapenv:Envelope>`;

    const { data } = await axios.post('https://www4.sii.cl/wsrpceconsultaws/services/QueryEventos', soapBody, {
        headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'listarEventosHistDoc',
            'Cookie': `Token=${token}`
        }
    });

    const parser = new XMLParser();
    const parsed = parser.parse(data);
    const rawResponse = parsed['soapenv:Envelope']['soapenv:Body']['ns1:listarEventosHistDocResponse']['ns1:return'];
    
    // Normalize response to array (SII returns object for single events)
    const events: SIIEvent[] = Array.isArray(rawResponse) ? rawResponse : [rawResponse].filter(Boolean);

    const hasReceipt = events.some(e => ['ERM', 'ATC'].includes(e.codEvento));
    const hasClaim = events.some(e => ['RCD', 'RFP', 'RFT'].includes(e.codEvento));

    return {
        events,
        isExecutiveTitle: hasReceipt && !hasClaim,
        status: hasClaim ? 'REJECTED' : (hasReceipt ? 'ACCEPTED' : 'PENDING_8_DAYS'),
        canBeFactored: hasReceipt && !hasClaim
    };
}
```

## Usage Notes

- Payment Status: The SII does not track if an invoice has been paid via bank transfer. "Accepted" only refers to tax/commercial acceptance.
- Factoring: An invoice must have the ERM (or ATC) event before it can be registered in the "Registro de Transferencia de Créditos" for factoring.
- 8-Day Rule: If no events are present after 8 days from the date of receipt by the SII, the document is considered Implicitly Accepted (ATC).