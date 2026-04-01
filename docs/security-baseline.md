# Security baseline

## Mandatory controls

- Role-based admin access
- MFA for all admin users
- Audit logging for create, update, publish, unpublish, and delete actions
- Immutable publication timestamps for notices and charges
- Draft / review / publish flow
- Environment separation between development, staging, and production
- Daily backups and restore validation
- CDN / WAF in front of the origin
- Dependency patching and image scanning
- Strict secrets handling
- Upload validation for PDFs and media
- Accessibility and privacy review before launch

## Additional recommended controls

- On-call alerting for stale flight or weather feeds
- Approval rule for charges, fees, and regulations
- Signed revalidation hook secret
- Structured logs shipped to a central platform
- Synthetic monitoring of homepage, notices, and flight pages
