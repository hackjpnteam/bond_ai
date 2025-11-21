import Link from 'next/link';
import Logo from '@/components/Logo';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

const footerLinks: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Ranking', href: '/ranking' },
      { label: 'Trust Map', href: '/trust-map' },
      { label: 'Introductions', href: '/introductions' },
    ],
  },
  {
    title: 'Network',
    links: [
      { label: 'Connections', href: '/connections' },
      { label: 'Referral routes', href: '/referral-routes' },
      { label: 'Timeline', href: '/timeline' },
      { label: 'Users', href: '/users' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Sign up', href: '/signup' },
      { label: 'Forgot password', href: '/forgot-password' },
      { label: 'Support', href: 'mailto:support@bond.ai', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t sr-only">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="col-span-2">
            <Logo className="text-gray-900 mb-4" />
            <p className="text-sm text-gray-600 max-w-sm">
              Building trust through transparent business relationships. 
              Connect with verified partners and grow your network.
            </p>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © 2024 Bond. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a
                href="mailto:support@bond.ai"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                support@bond.ai
              </a>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Reset access
              </Link>
              <Link
                href="/settings"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Account settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
