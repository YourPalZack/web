import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about AquaBuilder.',
  alternates: { canonical: '/faq' },
};

const faqs = [
  { q: 'What is AquaBuilder?', a: 'AquaBuilder helps you plan aquarium builds, check compatibility, and track prices.' },
  { q: 'How do you get prices?', a: 'We track price points from retailers, including Amazon via the Product Advertising API.' },
  { q: 'Are links affiliate?', a: 'Some links are affiliate; they help support the project at no extra cost.' },
];

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-semibold">FAQ</h1>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="border-b pb-3">
            <div className="font-medium">{f.q}</div>
            <div className="text-sm text-gray-700 mt-1">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

