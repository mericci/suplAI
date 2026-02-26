const accountStatementsErrorReasons = {
  accountStatementsBucketNameNotFound: 'account_bucket_name_not_found',
  accountStatementsFileMissing: 'account_statements_file_missing',
  accountStatementsInvalidConfig: 'account_statements_invalid_config',
  accountStatementsInvalidStatus: 'account_statements_invalid_status',
  accountStatementsPeriodHasNoActivity:
    'account_statements_period_has_no_activity',
  accountStatementsSendingEmailDisabled:
    'account_statements_sending_email_disabled',
} as const;

const reportTransactionsErrorReasons = {
  reportTransactionsBucketNameNotFound: 'report_bucket_name_not_found',
  reportTransactionsFileMissing: 'report_transactions_file_missing',
  reportTransactionsInvalidConfig: 'report_transactions_invalid_config',
  reportTransactionsInvalidStatus: 'report_transactions_invalid_status',
  reportTransactionsNoTransactionsFound:
    'report_transactions_no_transactions_found',
  reportTransactionsSendingEmailDisabled:
    'report_transactions_sending_email_disabled',
} as const;

const profileErrorReasons = {
  profileAlreadyExists: 'profile_already_exists',
  profileEmailAlreadyUsed: 'profile_email_already_used',
  profileNotFound: 'profile_not_found',
} as const;

export const errorReasons = {
  ...accountStatementsErrorReasons,
  ...reportTransactionsErrorReasons,
  ...profileErrorReasons,
  documentNumberAlreadyUsed: 'document_number_already_used',
  emailAlreadyUsed: 'email_already_used',
  emailAlreadyVerified: 'email_already_verified',
  emailVerificationNotFound: 'email_verification_not_found',
  invalidParams: 'invalid_params',
  invalidVerificationCode: 'invalid_verification_code',
  kycRequired: 'kyc_required',
  unknown: 'unknown',
  userInformationMissing: 'user_information_missing',
  userNotFound: 'user_not_found',
} as const;
