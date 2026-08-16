import type { Metadata } from "next";
import AppShellClient from "@/src/components/layout/AppShellClient";

export const metadata: Metadata = {
  title: "Privacy Policy — BOLEKA | E-BOLEKA (PTY) LTD",
  description:
    "Read the Privacy Policy for E-BOLEKA (PTY) LTD, operator of eboleka.co.za. Learn how we collect, use, and protect your personal information, including data shared with Meta Business Tools and Google Services.",
  keywords: [
    "boleka privacy policy",
    "eboleka privacy",
    "E-Boleka (Pty) Ltd privacy",
    "rental marketplace privacy South Africa",
    "POPIA compliance",
    "boleka data protection",
  ],
  openGraph: {
    title: "Privacy Policy — BOLEKA",
    description:
      "How E-BOLEKA (PTY) LTD collects, uses, and protects your personal information on eboleka.co.za.",
    type: "website",
    locale: "en_ZA",
    siteName: "BOLEKA",
    url: "https://eboleka.co.za/privacy",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "BOLEKA Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — BOLEKA",
    description:
      "How E-BOLEKA (PTY) LTD collects, uses, and protects your personal information.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://eboleka.co.za/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LAST_UPDATED = "16 August 2026";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-bold shrink-0">
          {number}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3 text-sm sm:text-base text-gray-600 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm sm:text-base font-semibold text-gray-900 pt-1">
      {children}
    </h3>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <AppShellClient>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold mb-3">
              Privacy Policy
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              How E-BOLEKA (PTY) LTD collects, uses, and protects your personal
              information on eboleka.co.za.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Last updated: {LAST_UPDATED}
            </p>
          </div>

          {/* 1. Who we are */}
          <Section number="1" title="Who We Are">
            <p>
              This Privacy Policy describes how <strong>E-BOLEKA (PTY) LTD</strong>{" "}
              (&quot;E-Boleka&quot;, &quot;BOLEKA&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company
              registered in South Africa, collects, uses, stores, and shares personal
              information when you visit or use our website,{" "}
              <span className="font-medium text-gray-900">eboleka.co.za</span>, our
              mobile application, and any related services (collectively, the
              &quot;Platform&quot;).
            </p>
            <p>
              E-Boleka acts as the responsible party (data controller) for the
              personal information processed through the Platform. This policy is
              drafted to comply with the Protection of Personal Information Act, 4 of
              2013 (&quot;POPIA&quot;) and other applicable data protection laws.
            </p>
          </Section>

          {/* 2. Information we collect */}
          <Section number="2" title="Information We Collect">
            <SubHeading>Information you provide</SubHeading>
            <Bullets
              items={[
                "Identity and account details: your full name, email address, phone/WhatsApp number, profile photo, and any information you provide when creating or updating your account.",
                "Contact information: your email address, mobile number, and location or delivery details you supply when listing, renting, or requesting items.",
                "Communications: messages you send through the Platform, and any support requests, emails, or chat messages you send to us.",
              ]}
            />
            <SubHeading>Rental and marketplace information</SubHeading>
            <Bullets
              items={[
                "Listing details: item titles, descriptions, photos, categories, prices, and availability you publish on the Platform.",
                "Rental records: rental requests, agreements, pickup and return details, payments, wallet transactions, and QR-code verification logs.",
                "Reviews and ratings: feedback you submit about other users and items.",
              ]}
            />
            <SubHeading>Technical data and cookies</SubHeading>
            <Bullets
              items={[
                "Usage data: internet protocol (IP) address, browser type and version, device information, operating system, pages viewed, timestamps, and referring URLs.",
                "Cookies and similar technologies: session cookies, preference cookies, and analytics and advertising tags, as described in Section 4.",
              ]}
            />
          </Section>

          {/* 3. How we use your information */}
          <Section number="3" title="How We Use Your Information">
            <p>We process your personal information for the following purposes:</p>
            <SubHeading>Marketplace listings and transactions</SubHeading>
            <Bullets
              items={[
                "To publish and display your item listings, connect renters with owners, and facilitate rental requests, payments, returns, and QR-code verification.",
                "To build trust through reviews, ratings, and reliability scores.",
              ]}
            />
            <SubHeading>Platform security</SubHeading>
            <Bullets
              items={[
                "To detect, prevent, and respond to fraud, abuse, spam, and other harmful or unlawful activity.",
                "To verify identities, resolve disputes, enforce our Terms, and protect the security of accounts and the Platform.",
              ]}
            />
            <SubHeading>Advertising and measurement</SubHeading>
            <Bullets
              items={[
                "To personalise advertising and measure the performance of our marketing campaigns using Meta Business Tools and Google Services, as detailed in Section 5.",
                "To understand how visitors use the Platform and to improve our products, features, and user experience.",
              ]}
            />
            <SubHeading>Communications and legal compliance</SubHeading>
            <Bullets
              items={[
                "To send transactional notifications, service updates, and responses to your support requests.",
                "To comply with POPIA, tax, accounting, and other legal or regulatory obligations.",
              ]}
            />
          </Section>

          {/* 4. Cookies */}
          <Section number="4" title="Cookies and Tracking Technologies">
            <p>
              We use cookies and similar technologies (such as pixels and tags) to
              recognise your browser, remember your preferences, and collect usage
              data. Cookies are small text files stored on your device.
            </p>
            <SubHeading>Categories of cookies we use</SubHeading>
            <Bullets
              items={[
                "Strictly necessary cookies: required for the Platform to function, including authentication and security.",
                "Preference cookies: remember your settings and choices to improve your experience.",
                "Analytics cookies: help us measure traffic and understand how visitors interact with the Platform.",
                "Advertising cookies: set by Meta (Meta Pixel) and Google (Google Ads tags) to personalise ads and measure campaign effectiveness.",
              ]}
            />
            <p>
              You can control or disable cookies through your browser settings. Most
              browsers allow you to refuse or delete cookies; however, disabling
              strictly necessary cookies may affect the functionality of the Platform.
              You can also manage advertising preferences through the opt-out controls
              described in Sections 5 and 8.
            </p>
          </Section>

          {/* 5. Third-party business tools */}
          <Section number="5" title="Third-Party Business Tools">
            <p>
              To operate, market, and measure the Platform, we integrate third-party
              business tools that may collect and process your information as
              described below. These providers are subject to their own privacy
              policies and act as separate data controllers or processors, as
              applicable.
            </p>
            <SubHeading>Meta Business Tools (Meta Platforms, Inc.)</SubHeading>
            <Bullets
              items={[
                "Meta Pixel: a tracking tag on our website that records page views and actions you take (such as visits and sign-ups) to measure ad performance and help Meta show you more relevant ads on Facebook and Instagram.",
                "Meta Conversions API and Graph API: we send selected event data to Meta through its Graph API, including a hashed (encrypted) email address for events such as CompleteRegistration, to improve ad measurement, audience matching, and engagement tracking.",
                "Meta may combine this data with other information it holds about you in line with the Meta Data Policy.",
              ]}
            />
            <p>
              To control how Meta uses your information, you can review your Facebook{" "}
              <a
                href="https://www.facebook.com/ads/preferences"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                Ad Preferences
              </a>{" "}
              and manage your off-Facebook activity in your Facebook settings.
            </p>
            <SubHeading>Google Services (Google LLC)</SubHeading>
            <Bullets
              items={[
                "Google Analytics: collects technical and usage data (such as pages visited, device type, and approximate location) to help us measure website performance and understand user behaviour.",
                "Google Ads tracking tags: conversion tracking and remarketing tags that enable ad personalisation and measurement of Google advertising campaigns.",
                "Google may process this data in accordance with the Google Privacy Policy.",
              ]}
            />
            <p>
              You can opt out of personalised Google advertising through your{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                Google Ads Settings
              </a>{" "}
              and install the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </p>
          </Section>

          {/* 6. Sharing */}
          <Section number="6" title="How We Share Your Information">
            <p>We may share your personal information in the following circumstances:</p>
            <Bullets
              items={[
                "Service providers: trusted third parties that help us operate the Platform, including hosting, authentication, database, payment processing (such as PayFast), and cloud storage providers, who process data only on our instructions.",
                "Advertising and analytics partners: Meta (Meta Business Tools) and Google (Google Services), as described in Section 5.",
                "Legal and safety: where required by law, regulation, legal process, or a lawful request from authorities, or to protect the rights, property, or safety of E-Boleka, our users, or the public.",
                "Business transfers: in connection with a merger, acquisition, reorganisation, or sale of assets, where personal information may be transferred as part of the transaction.",
              ]}
            />
            <p>
              We do not sell your personal information to third parties. Other users
              of the Platform can see information you choose to publish, such as your
              listings and profile information.
            </p>
          </Section>

          {/* 7. Retention */}
          <Section number="7" title="Data Retention">
            <p>
              We retain your personal information only for as long as necessary to
              fulfil the purposes described in this policy, including to provide the
              Platform, comply with legal and accounting obligations, resolve
              disputes, and enforce our agreements. When information is no longer
              required, we securely delete or anonymise it.
            </p>
          </Section>

          {/* 8. Rights */}
          <Section number="8" title="Your Rights and Choices">
            <p>
              Subject to applicable law (including POPIA), you have the following
              rights regarding your personal information:
            </p>
            <Bullets
              items={[
                "Access: request a copy of the personal information we hold about you.",
                "Correction: request that we correct or update inaccurate or incomplete information.",
                "Deletion: request deletion of your personal information or your account (see account deletion below).",
                "Objection and restriction: object to or request restriction of certain processing, including direct marketing.",
                "Withdrawal of consent: withdraw consent where processing is based on consent, without affecting the lawfulness of prior processing.",
                "Opt-out of personalised advertising: use the Meta and Google controls described in Section 5, or adjust cookie settings in your browser.",
              ]}
            />
            <SubHeading>Account deletion requests</SubHeading>
            <p>
              You may request deletion of your account and associated personal
              information at any time by contacting us using the details in Section
              11, or through the account settings in the Platform. We will action
              verified requests within the timeframes required by law, subject to any
              retention obligations.
            </p>
            <p>
              You also have the right to lodge a complaint with the Information
              Regulator (South Africa) at{" "}
              <a
                href="https://inforegulator.org.za"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline"
              >
                inforegulator.org.za
              </a>{" "}
              if you believe your personal information has been processed unlawfully.
            </p>
          </Section>

          {/* 9. Children */}
          <Section number="9" title="Children's Privacy">
            <p>
              The Platform is intended for users aged 18 years and older and is not
              directed at children. We do not knowingly collect personal information
              from children. If you believe a child has provided us with personal
              information, please contact us and we will take steps to delete it.
            </p>
          </Section>

          {/* 10. Changes */}
          <Section number="10" title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes
              in our practices, technology, or legal requirements. The updated version
              will be posted on this page with a revised &quot;Last updated&quot; date.
              We encourage you to review this policy periodically.
            </p>
          </Section>

          {/* 11. Contact */}
          <Section number="11" title="Contact Us">
            <p>
              For any privacy-related questions, requests, or concerns, or to exercise
              any of the rights described above, please contact our privacy team:
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 space-y-3">
              <p className="font-semibold text-gray-900">E-BOLEKA (PTY) LTD</p>
              <div className="space-y-1.5">
                <p>
                  <span className="font-medium text-gray-900">Privacy email:</span>{" "}
                  <a
                    href="mailto:privacy@eboleka.co.za"
                    className="text-orange-600 hover:underline"
                  >
                    privacy@eboleka.co.za
                  </a>
                </p>
                <p>
                  <span className="font-medium text-gray-900">Support email:</span>{" "}
                  <a
                    href="mailto:support@eboleka.co.za"
                    className="text-orange-600 hover:underline"
                  >
                    support@eboleka.co.za
                  </a>
                </p>
                <p>
                  <span className="font-medium text-gray-900">WhatsApp:</span>{" "}
                  <a
                    href="https://wa.me/27658967514"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    065 896 7514
                  </a>
                </p>
                <p>
                  <span className="font-medium text-gray-900">Website:</span>{" "}
                  <a href="https://eboleka.co.za" className="text-orange-600 hover:underline">
                    https://eboleka.co.za
                  </a>
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </AppShellClient>
  );
}
