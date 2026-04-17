import config from '@payload-config'
import Link from 'next/link'
import { requireDashboardSectionAccess } from '@/lib/dashboard-auth'
import { env, serverEnv } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import { logger } from '@/lib/logger'
import { normalizeSiteSettings } from '@/lib/site-settings'

export const metadata = { title: 'Settings' }

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export default async function SettingsPage() {
  await requireDashboardSectionAccess('settings')
  const payloadConfig = await config
  const payload = await getPayloadClient()
  let settings: any | null = null
  const configuredLocales = payloadConfig.localization ? payloadConfig.localization.locales : []
  const localeSummary =
    configuredLocales
      .map((locale) =>
        typeof locale === 'string'
          ? locale
          : `${locale.label} (${locale.code})`,
      )
      .join(', ') || 'Not configured'
  const weatherApiKeyStatus = 'Not required' // Open-Meteo needs no key

  try {
    settings = normalizeSiteSettings(
      await payload.findGlobal({
        slug: 'site-settings',
        depth: 0,
        overrideAccess: true,
      }),
    )
  } catch (error) { logger.error('Failed to fetch site settings', error, 'dashboard'); settings = null }

  return (
    <main className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Airport of Rodrigues Ltd — site configuration and global settings
          </p>
        </div>
        <div className="page-actions">
          <Link
            href="/admin/globals/site-settings"
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalIcon />
            Edit in Payload Admin
          </Link>
        </div>
      </div>

      <div className="info-banner">
        <InfoIcon />
        <div>
          Settings are managed through the Payload CMS admin panel. Values shown below
          are <strong>read-only</strong>. Click &ldquo;Edit in Payload Admin&rdquo; to make changes.
        </div>
      </div>

      {/* General Settings */}
      <div className="settings-section">
        <h2 className="settings-section-title">General</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Site Name</span>
                <input
                  className="form-input"
                  type="text"
                  value={settings?.siteName ?? 'Not configured'}
                  disabled
                  readOnly
                />
              </div>
              <div className="form-group">
                <span className="form-label">Airport Name</span>
                <input
                  className="form-input"
                  type="text"
                  value={settings?.airportName ?? 'Not configured'}
                  disabled
                  readOnly
                />
              </div>
            </div>
            <div className="form-group">
              <span className="form-label">Tagline</span>
              <input
                className="form-input"
                type="text"
                value={settings?.tagline ?? ''}
                disabled
                readOnly
                placeholder="No tagline set"
              />
            </div>
            <div className="form-group">
              <span className="form-label">Physical Address</span>
              <textarea
                className="form-textarea"
                value={settings?.physicalAddress ?? ''}
                disabled
                readOnly
                rows={2}
                placeholder="No address configured"
              />
            </div>
            {settings?.workingHours && (
              <div className="form-group">
                <span className="form-label">Working Hours</span>
                <input
                  className="form-input"
                  type="text"
                  value={settings.workingHours}
                  disabled
                  readOnly
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="settings-section">
        <h2 className="settings-section-title">Contact Information</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Primary Phone</span>
                <input
                  className="form-input"
                  type="tel"
                  value={settings?.primaryPhone ?? ''}
                  disabled
                  readOnly
                  placeholder="No phone configured"
                />
              </div>
              <div className="form-group">
                <span className="form-label">Primary Email</span>
                <input
                  className="form-input"
                  type="email"
                  value={settings?.primaryEmail ?? ''}
                  disabled
                  readOnly
                  placeholder="No email configured"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="settings-section">
        <h2 className="settings-section-title">Social Media Links</h2>
        <div className="card">
          <div className="card-body">
            {settings?.socialLinks && settings.socialLinks.length > 0 ? (
              <div>
                {settings.socialLinks.map((
                  link: { id?: string | null; label?: string | null; url?: string | null },
                  idx: number,
                ) => (
                  <div key={link.id ?? idx} className="form-row" style={{ marginBottom: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <span className="form-label">Label</span>
                      <input className="form-input" type="text" value={link.label ?? ''} disabled readOnly />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <span className="form-label">URL</span>
                      <input className="form-input" type="url" value={link.url ?? ''} disabled readOnly />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No social links configured.</p>
                <Link
                  href="/admin/globals/site-settings"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add Social Links
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEO Defaults */}
      <div className="settings-section">
        <h2 className="settings-section-title">SEO Defaults</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <span className="form-label">Default Page Title</span>
              <input
                className="form-input"
                type="text"
                value={settings?.seoDefaultTitle ?? ''}
                disabled
                readOnly
                placeholder="No default title configured"
              />
            </div>
            <div className="form-group">
              <span className="form-label">Default Meta Description</span>
              <textarea
                className="form-textarea"
                value={settings?.seoDefaultDescription ?? ''}
                disabled
                readOnly
                rows={3}
                placeholder="No default description configured"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Useful Links */}
      <div className="settings-section">
        <h2 className="settings-section-title">Useful Links</h2>
        <div className="card">
          <div className="card-body">
            {settings?.usefulLinks && settings.usefulLinks.length > 0 ? (
              <div>
                {settings.usefulLinks.map((
                  link: { id?: string | null; label?: string | null; url?: string | null },
                  idx: number,
                ) => (
                  <div key={link.id ?? idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx < (settings!.usefulLinks!.length - 1) ? '1px solid hsl(var(--border))' : 'none',
                  }}>
                    <span style={{ fontWeight: 500 }}>{link.label ?? ''}</span>
                    <a
                      href={link.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'hsl(var(--primary))', fontSize: 12 }}
                    >
                      {link.url ?? ''}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No useful links configured.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Other Globals quick access */}
      <div className="settings-section">
        <h2 className="settings-section-title">Other Configuration Areas</h2>
        <div className="card">
          <div className="card-body">
            <p className="text-muted text-small" style={{ marginBottom: 16 }}>
              The following globals can be edited directly in Payload admin:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { label: 'Site Settings',           slug: 'site-settings' },
                { label: 'Home Page',               slug: 'home-page' },
                { label: 'Passenger Guide',         slug: 'passenger-guide' },
                { label: 'Transport & Parking',     slug: 'transport-parking' },
                { label: 'Accessibility Info',      slug: 'accessibility-info' },
                { label: 'Airport Map',             slug: 'airport-map' },
                { label: 'Contact Info',            slug: 'contact-info' },
                { label: 'Regulations',             slug: 'regulations' },
                { label: 'Usage Fees',              slug: 'usage-fees' },
                { label: 'VIP Lounge',              slug: 'vip-lounge' },
                { label: 'Emergency Services',      slug: 'emergency-services' },
                { label: 'Working Hours',           slug: 'working-hours-directions' },
                { label: 'Useful Links',            slug: 'useful-links' },
                { label: 'Management & Staff',      slug: 'management-staff' },
                { label: 'Legal Pages',             slug: 'legal-pages' },
              ].map((item) => (
                <Link
                  key={item.slug}
                  href={`/admin/globals/${item.slug}`}
                  className="btn btn-outline btn-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ justifyContent: 'flex-start' }}
                >
                  <ExternalIcon />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="settings-section">
        <h2 className="settings-section-title">Integrations</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Flight Provider</span>
                <input
                  className="form-input"
                  type="text"
                  value={`${env.flightProviderLabel} (${env.flightProviderMode})`}
                  disabled
                  readOnly
                />
              </div>
              <div className="form-group">
                <span className="form-label">Weather Provider</span>
                <input
                  className="form-input"
                  type="text"
                  value={`${env.weatherProviderLabel} (${env.weatherProviderMode})`}
                  disabled
                  readOnly
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Flight Endpoint</span>
                <input
                  className="form-input"
                  type="text"
                  value={serverEnv.flightProviderEndpoint || 'Not configured'}
                  disabled
                  readOnly
                />
              </div>
              <div className="form-group">
                <span className="form-label">Weather Endpoint</span>
                <input
                  className="form-input"
                  type="text"
                  value={serverEnv.weatherProviderEndpoint || 'Not configured'}
                  disabled
                  readOnly
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Flight API Key</span>
                <input
                  className="form-input"
                  type="text"
                  value={serverEnv.flightProviderApiKey ? 'Configured' : 'Not configured'}
                  disabled
                  readOnly
                />
              </div>
              <div className="form-group">
                <span className="form-label">Weather API Key</span>
                <input
                  className="form-input"
                  type="text"
                  value={weatherApiKeyStatus}
                  disabled
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment info */}
      <div className="settings-section">
        <h2 className="settings-section-title">Environment</h2>
        <div className="card">
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Platform</span>
                <input className="form-input" type="text" value="Next.js 15 + Payload CMS 3.x" disabled readOnly />
              </div>
              <div className="form-group">
                <span className="form-label">Database</span>
                <input className="form-input" type="text" value="Supabase PostgreSQL" disabled readOnly />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <span className="form-label">Storage</span>
                <input className="form-input" type="text" value="Supabase Storage" disabled readOnly />
              </div>
              <div className="form-group">
                <span className="form-label">Locales</span>
                <input className="form-input" type="text" value={localeSummary} disabled readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
