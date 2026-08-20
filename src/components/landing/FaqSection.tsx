import { HelpCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// E-BOLEKA FAQ Section — Generative Engine Optimization (GEO)
// Server component: renders the schema into the initial HTML so LLMs and
// search engines can parse the JSON-LD directly.
// ---------------------------------------------------------------------------

interface FaqItem {
  question: string;
  answer: string;
}

// Single source of truth for both the visible FAQ and the FAQPage JSON-LD.
const FAQS: FaqItem[] = [
  {
    question: "Can I rent or buy varsity textbooks and electronics on E-BOLEKA?",
    answer:
      "Yes, you can both rent and buy university textbooks, chargers, and student gadgets directly from local owners. Search the student category to find items available for the semester.",
  },
  {
    question: "What type of event and household items are available?",
    answer:
      "You will find everything from daily household essentials to heavy-duty event equipment like catering gear, chairs, and tents for weddings or funerals.",
  },
  {
    question: "How does renting building and DIY tools work?",
    answer:
      "You search for the construction or fixing tool you need, book it for your required dates, and coordinate collection with the owner.",
  },
  {
    question: "Is it safe to rent out my personal or business equipment?",
    answer:
      "Yes, E-BOLEKA uses identity verification and secure payment processing to protect both the equipment owner and the renter.",
  },
  {
    question: "Can I list an item for sale and for rent at the same time?",
    answer:
      "Yes, the platform allows you to upload a single listing with both a daily rental rate and a flat purchase price so users have the option to choose.",
  },
];

// ── JSON-LD builders ──

interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  "@id": string;
  name: string;
  legalName: string;
  url: string;
  logo: string;
  description: string;
  areaServed: string;
  knowsAbout: string[];
  sameAs: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    email: string;
    areaServed: string;
    availableLanguage: string | string[];
  };
}

const organizationSchema: OrganizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://eboleka.co.za/#organization",
  name: "E-BOLEKA Pty Ltd",
  legalName: "E-BOLEKA Pty Ltd",
  url: "https://eboleka.co.za",
  logo: "https://eboleka.co.za/logo.png",
  description:
    "E-BOLEKA is South Africa's peer-to-peer rental and selling marketplace. Rent and buy textbooks, electronics, tools, and event equipment directly from local owners.",
  areaServed: "ZA",
  knowsAbout: [
    "Peer-to-peer marketplace",
    "Item rental",
    "Buy and sell",
    "Textbook rental",
    "Electronics rental",
    "Event equipment rental",
    "DIY and building tools rental",
  ],
  sameAs: [
    "https://eboleka.co.za",
    "https://www.linkedin.com/company/eboleka",
    "https://www.facebook.com/eboleka",
    "https://www.instagram.com/eboleka",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "notifications@eboleka.co.za",
    areaServed: "ZA",
    availableLanguage: ["en", "zu", "af", "xh"],
  },
};

interface FaqPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

// Dynamically maps the 5 exact questions and answers to the FAQPage schema.
const faqPageSchema: FaqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FaqSection() {
  return (
    <section aria-labelledby="eboleka-faq-heading" className="px-4 py-10">
      {/* Advanced GEO / SEO schema markup (server-rendered) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      <div className="max-w-2xl mx-auto">
        {/* Section heading */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 id="eboleka-faq-heading" className="text-xl md:text-2xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Everything you need to know about renting and selling on E-BOLEKA.
            </p>
          </div>
        </div>

        {/* FAQ list — each question is an <h3> heading, each answer a <p> tag */}
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <article
              key={faq.question}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <h2 className="text-base font-semibold text-gray-900 leading-snug">
                {faq.question}
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}