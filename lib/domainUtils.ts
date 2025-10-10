import dns from 'dns/promises';

export function validateDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

export function generateVerificationToken(): string {
  return `creatoros-${Buffer.from(Date.now().toString()).toString('base64')}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function verifyDomainOwnership(domain: string, expectedToken: string): Promise<{
  verified: boolean;
  dnsRecords: any[];
}> {
  try {
    const txtRecords = await dns.resolveTxt(`_creatoros-verification.${domain}`);
    const foundToken = txtRecords.flat().find(record => record === expectedToken);

    // Verify CNAME record
    let cnameVerified = false;
    try {
      const cnameRecords = await dns.resolveCname(domain);
      cnameVerified = cnameRecords.some(record => 
        record === process.env.NEXT_PUBLIC_APP_DOMAIN
      );
    } catch (error) {
      // CNAME might not be set yet
      console.log('CNAME verification failed:', error);
    }

    const dnsRecords = [
      {
        type: 'TXT',
        name: `_creatoros-verification.${domain}`,
        value: expectedToken,
        status: foundToken ? 'verified' : 'pending'
      },
      {
        type: 'CNAME',
        name: domain,
        value: process.env.NEXT_PUBLIC_APP_DOMAIN || 'yourapp.com',
        status: cnameVerified ? 'verified' : 'pending'
      }
    ];

    return {
      verified: !!foundToken && cnameVerified,
      dnsRecords
    };
  } catch (error) {
    console.error('DNS verification error:', error);
    return {
      verified: false,
      dnsRecords: []
    };
  }
}

export function generateCustomCSS(config: any): string {
  return `
    :root {
      --primary-color: ${config.primary_color || '#3B82F6'};
      --secondary-color: ${config.secondary_color || '#1E40AF'};
      --accent-color: ${config.accent_color || '#10B981'};
      --background-color: ${config.background_color || '#FFFFFF'};
      --text-color: ${config.text_color || '#1F2937'};
      --font-family: ${config.font_family || 'Inter, sans-serif'};
    }

    .brand-primary { color: var(--primary-color); }
    .brand-bg-primary { background-color: var(--primary-color); }
    .brand-border-primary { border-color: var(--primary-color); }

    .brand-secondary { color: var(--secondary-color); }
    .brand-bg-secondary { background-color: var(--secondary-color); }

    .brand-accent { color: var(--accent-color); }
    .brand-bg-accent { background-color: var(--accent-color); }

    body {
      font-family: var(--font-family);
      color: var(--text-color);
      background-color: var(--background-color);
    }

    /* Additional branding styles */
    ${config.custom_css || ''}
  `;
}