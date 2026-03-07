---
name: sii-suppliers-document
description: Extract supplier information from PDF/Word text or images (JPG/PNG): name, tax ID number, document type, service category, pricing structure, and amounts.
---

# Get documents data

Extract supplier information from PDF/Word text or images (JPG/PNG): name, tax ID number, document type, service category, pricing structure, and amounts.

System: "You are an expert in commercial document analysis. Analyze the text or image of a document and extract the supplier information: (+ base64 image if it is an image) and return a JSON with: supplierName, supplierRut, documentType (Contract, Quote, Invoice, etc.), serviceDescription, serviceCategory (Lease, Consulting, Technology, etc.), tariffType (Fixed CLP/UF/USD, Variable by volume/hour/consultation, Mixed), tariffDetail, and amounts[] with amount, currency, concept, and frequency.“ User: ”Analyze the following document and extract the information: {text truncated to 15,000 characters}"