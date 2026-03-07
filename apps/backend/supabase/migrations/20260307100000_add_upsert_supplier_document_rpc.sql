CREATE OR REPLACE FUNCTION upsert_supplier_document(
  p_supplier_id UUID,
  p_file_name TEXT,
  p_storage_path TEXT,
  p_storage_bucket TEXT,
  p_document_type TEXT,
  p_service_category TEXT,
  p_service_description TEXT,
  p_tariff_type TEXT,
  p_tariff_detail TEXT,
  p_amounts JSONB,
  p_document_role TEXT,
  p_is_current BOOLEAN
) RETURNS supplier_documents AS $$
DECLARE
  result supplier_documents;
BEGIN
  -- Demote existing current cost contracts (if new doc is a cost contract)
  IF p_is_current AND p_document_role = 'cost_contract' THEN
    UPDATE supplier_documents
    SET is_current = false
    WHERE supplier_id = p_supplier_id
      AND document_role = 'cost_contract'
      AND deleted_at IS NULL;
  END IF;

  -- Insert new document
  INSERT INTO supplier_documents (
    supplier_id, file_name, storage_path, storage_bucket,
    document_type, service_category, service_description,
    tariff_type, tariff_detail, amounts, document_role, is_current
  ) VALUES (
    p_supplier_id, p_file_name, p_storage_path, p_storage_bucket,
    p_document_type, p_service_category, p_service_description,
    p_tariff_type, p_tariff_detail, p_amounts, p_document_role, p_is_current
  ) RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
