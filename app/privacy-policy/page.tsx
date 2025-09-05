'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { ArrowLeft, Mail, Shield, Cookie, Database, Lock, Users, FileText, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = '2025-01-05';
  
  const sections = [
    { id: 'introduction', title: 'Introduction', icon: Shield },
    { id: 'data-collection', title: 'Data We Collect', icon: Database },
    { id: 'data-usage', title: 'How We Use Your Data', icon: FileText },
    { id: 'cookies', title: 'Cookies & Tracking', icon: Cookie },
    { id: 'data-sharing', title: 'Data Sharing', icon: Users },
    { id: 'data-security', title: 'Data Security', icon: Lock },
    { id: 'user-rights', title: 'Your Rights', icon: Shield },
    { id: 'data-retention', title: 'Data Retention', icon: Database },
    { id: 'international', title: 'International Transfers', icon: Globe },
    { id: 'contact', title: 'Contact Us', icon: Mail },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-4 pb-4">
                  <nav className="space-y-2">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardContent className="prose dark:prose-invert max-w-none p-8">
                <section id="introduction" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    AMELIA-Mini ERP System ("we," "our," or "us") is committed to protecting your privacy and ensuring 
                    the security of your personal information. This Privacy Policy explains how we collect, use, disclose, 
                    and safeguard your information when you use our enterprise resource planning software.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    We comply with the General Data Protection Regulation (GDPR) and other applicable data protection 
                    laws. By using our service, you agree to the collection and use of information in accordance with 
                    this policy.
                  </p>
                </section>

                <section id="data-collection" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">2. Data We Collect</h2>
                  <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Account credentials (username, encrypted password)</li>
                    <li>Company information (company name, address, tax ID)</li>
                    <li>Employee information (for HR module users)</li>
                    <li>Financial data (for accounting module users)</li>
                    <li>User role and permissions data</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-2 mt-4">Usage Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and features used</li>
                    <li>Access times and dates</li>
                    <li>System performance metrics</li>
                    <li>Error logs and debugging information</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-2 mt-4">Business Data</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Customer and vendor information</li>
                    <li>Inventory and product data</li>
                    <li>Sales and purchase transactions</li>
                    <li>Financial reports and analytics</li>
                  </ul>
                </section>

                <section id="data-usage" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">3. How We Use Your Data</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    We use the collected data for various purposes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li><strong>Service Provision:</strong> To provide and maintain our ERP services</li>
                    <li><strong>User Management:</strong> To manage user accounts and authentication</li>
                    <li><strong>Business Operations:</strong> To process transactions and manage business workflows</li>
                    <li><strong>Communication:</strong> To send important notifications and updates</li>
                    <li><strong>Support:</strong> To provide customer support and respond to inquiries</li>
                    <li><strong>Improvement:</strong> To analyze usage patterns and improve our services</li>
                    <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
                    <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
                  </ul>
                </section>

                <section id="cookies" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">4. Cookies & Tracking Technologies</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    We use cookies and similar tracking technologies to enhance your experience:
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Required for basic functionality, authentication, and security. These cannot be disabled.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Help us understand how users interact with our service to improve performance and features.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Preference Cookies</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Remember your settings and preferences for a personalized experience.
                  </p>

                  <p className="text-slate-600 dark:text-slate-400">
                    You can manage cookie preferences through our cookie consent tool or your browser settings.
                  </p>
                </section>

                <section id="data-sharing" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">5. Data Sharing and Disclosure</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    We do not sell, trade, or rent your personal information. We may share data with:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our service 
                    (hosting, analytics, support)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to respond to legal process</li>
                    <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                    <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                    <li><strong>Aggregated Data:</strong> Non-identifiable aggregated data for analytics and reporting</li>
                  </ul>
                </section>

                <section id="data-security" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">6. Data Security</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>End-to-end encryption for data transmission</li>
                    <li>Encrypted storage for sensitive information</li>
                    <li>Role-based access control (RBAC)</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Multi-factor authentication options</li>
                    <li>Regular automated backups</li>
                    <li>Incident response procedures</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    However, no method of transmission over the internet is 100% secure. We cannot guarantee 
                    absolute security but strive to use commercially acceptable means to protect your data.
                  </p>
                </section>

                <section id="user-rights" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">7. Your Rights Under GDPR</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Under the General Data Protection Regulation, you have the following rights:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                    <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
                    <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                    <li><strong>Right to Complain:</strong> Lodge a complaint with supervisory authorities</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    To exercise these rights, please contact our Data Protection Officer using the contact 
                    information provided below.
                  </p>
                </section>

                <section id="data-retention" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    We retain personal data for as long as necessary to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Provide our services and fulfill contractual obligations</li>
                    <li>Comply with legal and regulatory requirements</li>
                    <li>Resolve disputes and enforce agreements</li>
                    <li>Maintain business records for tax and accounting purposes</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    Typical retention periods:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Active account data: Duration of service + 30 days</li>
                    <li>Financial records: 7 years (legal requirement)</li>
                    <li>Support tickets: 2 years</li>
                    <li>Analytics data: 13 months</li>
                    <li>Backup data: 90 days after deletion request</li>
                  </ul>
                </section>

                <section id="international" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your data may be transferred to and processed in countries other than your country of residence. 
                    These countries may have data protection laws different from your country. We ensure appropriate 
                    safeguards are in place through:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mt-4">
                    <li>Standard contractual clauses approved by the European Commission</li>
                    <li>Data processing agreements with all third-party processors</li>
                    <li>Adequacy decisions where applicable</li>
                    <li>Privacy Shield certification (where applicable)</li>
                  </ul>
                </section>

                <section id="contact" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">10. Contact Information</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    For questions about this Privacy Policy or to exercise your rights, please contact:
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg space-y-2">
                    <p className="font-semibold">Data Protection Officer</p>
                    <p className="text-slate-600 dark:text-slate-400">AMELIA-Mini ERP System</p>
                    <p className="text-slate-600 dark:text-slate-400">Email: privacy@amelia-mini.com</p>
                    <p className="text-slate-600 dark:text-slate-400">Phone: +1 (555) 123-4567</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Address: 123 Business Park, Suite 100<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    We aim to respond to all privacy inquiries within 30 days.
                  </p>
                </section>

                <section className="pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">Updates to This Policy</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by 
                    posting the new Privacy Policy on this page and updating the "Last updated" date. For material 
                    changes, we will provide additional notice via email or through the service.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    We encourage you to review this Privacy Policy periodically to stay informed about how we are 
                    protecting your information.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}