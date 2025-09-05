'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { ArrowLeft, Scale, Shield, AlertTriangle, FileText, Globe, Ban, Gavel, Mail, DollarSign } from 'lucide-react';

export default function TermsOfServicePage() {
  const lastUpdated = '2025-01-05';
  const effectiveDate = '2025-01-05';
  
  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms', icon: FileText },
    { id: 'services', title: 'Services Description', icon: Globe },
    { id: 'account', title: 'Account Terms', icon: Shield },
    { id: 'usage', title: 'Acceptable Use', icon: Scale },
    { id: 'payment', title: 'Payment Terms', icon: DollarSign },
    { id: 'intellectual', title: 'Intellectual Property', icon: FileText },
    { id: 'privacy', title: 'Privacy & Data', icon: Shield },
    { id: 'warranties', title: 'Warranties & Disclaimers', icon: AlertTriangle },
    { id: 'limitation', title: 'Limitation of Liability', icon: Ban },
    { id: 'termination', title: 'Termination', icon: Ban },
    { id: 'governing', title: 'Governing Law', icon: Gavel },
    { id: 'contact', title: 'Contact Information', icon: Mail },
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
            Terms of Service
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <p>
              Effective Date: {new Date(effectiveDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p>
              Last Updated: {new Date(lastUpdated).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] px-4 pb-4">
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
                <section id="acceptance" className="scroll-mt-8">
                  <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    By accessing or using the AMELIA-Mini ERP System ("Service"), you agree to be bound by these 
                    Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access 
                    the Service.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    These Terms apply to all visitors, users, and others who access or use the Service. By using 
                    the Service, you represent that you are at least 18 years old and have the legal capacity to 
                    enter into these Terms.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    If you are using the Service on behalf of an organization, you agree to these Terms on behalf 
                    of that organization and warrant that you have the authority to bind that organization to these 
                    Terms.
                  </p>
                </section>

                <section id="services" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">2. Services Description</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    AMELIA-Mini provides a comprehensive Enterprise Resource Planning (ERP) software solution that includes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>User and role management system</li>
                    <li>Human Resources management module</li>
                    <li>Inventory and warehouse management</li>
                    <li>Point of Sale (POS) functionality</li>
                    <li>Financial and accounting tools</li>
                    <li>Reporting and analytics features</li>
                    <li>Integration capabilities with third-party services</li>
                    <li>Data backup and recovery services</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    We reserve the right to modify, suspend, or discontinue any part of the Service at any time 
                    with reasonable notice to users. We shall not be liable to you or any third party for any 
                    modification, suspension, or discontinuance of the Service.
                  </p>
                </section>

                <section id="account" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">3. Account Terms</h2>
                  <h3 className="text-lg font-semibold mb-2">Account Creation</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    To use certain features of the Service, you must register for an account. When creating an account, 
                    you must provide accurate, complete, and current information. You are responsible for maintaining 
                    the confidentiality of your account credentials.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Account Responsibilities</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>You must notify us immediately of any unauthorized use of your account</li>
                    <li>You may not use another user's account without permission</li>
                    <li>You must not share your account credentials with others</li>
                    <li>You are responsible for maintaining accurate account information</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-2 mt-4">Account Security</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    We implement security measures to protect accounts, but you acknowledge that no security system 
                    is impenetrable. You agree to immediately notify us of any unauthorized access to or use of your 
                    account.
                  </p>
                </section>

                <section id="usage" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">4. Acceptable Use Policy</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You agree not to use the Service to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon intellectual property rights of others</li>
                    <li>Transmit malicious code, viruses, or harmful software</li>
                    <li>Attempt to gain unauthorized access to systems or data</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Collect or harvest user data without authorization</li>
                    <li>Engage in fraudulent or deceptive practices</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Use the Service for illegal or unauthorized purposes</li>
                    <li>Exceed usage limits or circumvent access restrictions</li>
                    <li>Reverse engineer or attempt to derive source code</li>
                    <li>Resell or redistribute the Service without authorization</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    Violation of this policy may result in immediate termination of your account and legal action 
                    if warranted.
                  </p>
                </section>

                <section id="payment" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">5. Payment Terms</h2>
                  <h3 className="text-lg font-semibold mb-2">Subscription Fees</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Access to the Service requires a paid subscription. Subscription fees are billed in advance on 
                    a monthly or annual basis and are non-refundable except as required by law.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Billing</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>You authorize us to charge your payment method for all fees</li>
                    <li>Fees are subject to change with 30 days notice</li>
                    <li>All fees are exclusive of taxes unless stated otherwise</li>
                    <li>You are responsible for providing accurate billing information</li>
                    <li>Failed payments may result in service suspension</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-2 mt-4">Free Trial</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    We may offer a free trial period. At the end of the trial, your account will be automatically 
                    charged unless you cancel before the trial expires. Trial terms and duration may vary.
                  </p>

                  <h3 className="text-lg font-semibold mb-2 mt-4">Refunds</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Refunds are provided only as required by applicable law or at our sole discretion. Partial month 
                    refunds are not provided for cancelled subscriptions.
                  </p>
                </section>

                <section id="intellectual" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">6. Intellectual Property Rights</h2>
                  <h3 className="text-lg font-semibold mb-2">Our Property</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    The Service and its original content, features, and functionality are and will remain the exclusive 
                    property of AMELIA-Mini and its licensors. The Service is protected by copyright, trademark, and 
                    other laws. Our trademarks and trade dress may not be used without our prior written consent.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Your Content</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You retain ownership of any content you submit, post, or display through the Service ("Your Content"). 
                    By submitting Your Content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                    reproduce, and process Your Content solely for the purpose of providing the Service.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Feedback</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Any feedback, suggestions, or ideas you provide about the Service becomes our property and may be 
                    used without compensation or attribution to you.
                  </p>
                </section>

                <section id="privacy" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">7. Privacy and Data Protection</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your use of the Service is also governed by our Privacy Policy, which describes how we collect, 
                    use, and protect your personal information. By using the Service, you consent to our data practices 
                    as described in the Privacy Policy.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    You acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>You are responsible for the accuracy of data you provide</li>
                    <li>You have obtained necessary consents for any third-party data you upload</li>
                    <li>We process data according to your instructions and applicable law</li>
                    <li>You must comply with applicable data protection regulations</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    For detailed information about our data practices, please refer to our{' '}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>.
                  </p>
                </section>

                <section id="warranties" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">8. Warranties and Disclaimers</h2>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 dark:text-amber-200 font-semibold uppercase">
                      Disclaimer of Warranties
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
                    OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
                    PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    We do not warrant that:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>The Service will be uninterrupted or error-free</li>
                    <li>The Service will meet your specific requirements</li>
                    <li>The results obtained from the Service will be accurate or reliable</li>
                    <li>Any errors in the Service will be corrected</li>
                    <li>The Service will be free from viruses or harmful components</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    Any material downloaded or obtained through the Service is accessed at your own risk, and you 
                    will be solely responsible for any damage to your computer system or loss of data.
                  </p>
                </section>

                <section id="limitation" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">9. Limitation of Liability</h2>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <p className="text-red-800 dark:text-red-200 font-semibold uppercase">
                      Important Limitation
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, AMELIA-MINI AND ITS OFFICERS, DIRECTORS, EMPLOYEES, 
                    AGENTS, SUPPLIERS, OR LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                    CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, 
                    GOODWILL, OR OTHER INTANGIBLE LOSSES.
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    In no event shall our total liability exceed the greater of:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>The amount you paid to us in the twelve (12) months preceding the claim</li>
                    <li>One hundred dollars ($100 USD)</li>
                  </ul>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    These limitations apply regardless of the legal theory on which the claim is based and even if 
                    we have been advised of the possibility of such damages.
                  </p>
                </section>

                <section id="termination" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
                  <h3 className="text-lg font-semibold mb-2">Termination by You</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You may terminate your account at any time by contacting customer support. Termination does not 
                    entitle you to any refunds unless required by applicable law.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Termination by Us</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    We may terminate or suspend your account immediately, without prior notice or liability, for any 
                    reason, including if you breach these Terms. Reasons for termination may include:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                    <li>Violation of these Terms or our policies</li>
                    <li>Non-payment of fees</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Extended period of inactivity</li>
                    <li>Request by law enforcement or court order</li>
                  </ul>

                  <h3 className="text-lg font-semibold mb-2 mt-4">Effect of Termination</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Upon termination, your right to use the Service will cease immediately. We may delete your 
                    account and data after a reasonable retention period. You remain liable for any fees incurred 
                    before termination.
                  </p>
                </section>

                <section id="governing" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">11. Governing Law and Dispute Resolution</h2>
                  <h3 className="text-lg font-semibold mb-2">Governing Law</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of the State of 
                    California, United States, without regard to its conflict of law provisions. You agree to 
                    submit to the personal jurisdiction of the courts located in San Francisco, California.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Arbitration</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Any dispute arising out of or relating to these Terms or the Service shall be resolved through 
                    binding arbitration in accordance with the rules of the American Arbitration Association. The 
                    arbitration shall be conducted in San Francisco, California.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Class Action Waiver</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    You agree that any dispute resolution proceedings will be conducted only on an individual basis 
                    and not in a class, consolidated, or representative action. You waive your right to participate 
                    in class actions.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-8 pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    If you have any questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg space-y-2">
                    <p className="font-semibold">Legal Department</p>
                    <p className="text-slate-600 dark:text-slate-400">AMELIA-Mini ERP System</p>
                    <p className="text-slate-600 dark:text-slate-400">Email: legal@amelia-mini.com</p>
                    <p className="text-slate-600 dark:text-slate-400">Phone: +1 (555) 123-4567</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Address: 123 Business Park, Suite 100<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-4">
                    For technical support, please contact: support@amelia-mini.com
                  </p>
                </section>

                <section className="pt-8 border-t">
                  <h2 className="text-2xl font-bold mb-4">General Provisions</h2>
                  
                  <h3 className="text-lg font-semibold mb-2">Entire Agreement</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    These Terms constitute the entire agreement between you and AMELIA-Mini regarding the Service 
                    and supersede all prior agreements and understandings.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Severability</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions will 
                    continue in full force and effect.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Waiver</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No waiver of any term or condition shall be deemed a further or continuing waiver of such term 
                    or condition or any other term or condition.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Assignment</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    You may not assign or transfer these Terms without our prior written consent. We may assign 
                    these Terms without restriction.
                  </p>

                  <h3 className="text-lg font-semibold mb-2">Modifications</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    We reserve the right to modify these Terms at any time. We will provide notice of material 
                    changes through the Service or by email. Your continued use of the Service after such 
                    modifications constitutes acceptance of the updated Terms.
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