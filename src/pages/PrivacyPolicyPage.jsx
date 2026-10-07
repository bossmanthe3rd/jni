import LegalLayout, { LegalHeading, LegalList } from '../components/layout/LegalLayout'
import { legalBusinessDetails } from '../data/site'

const { email } = legalBusinessDetails

const FAQ = [
  {
    q: 'Do you sell my personal information?',
    a: 'No. We don’t sell your personal information for unrelated commercial purposes.',
  },
  {
    q: 'Do you store my card details?',
    a: 'We don’t intentionally store your complete card number, CVV or PIN on our own systems. Payments are processed through payment providers such as Razorpay.',
  },
  {
    q: 'Why do you need my phone number?',
    a: 'Mainly to process your order and keep you updated about delivery, support, returns or other order-related matters.',
  },
  {
    q: 'Can I stop marketing messages?',
    a: null,
  },
  {
    q: 'Can I ask you to delete my data?',
    a: 'You can request deletion of your personal information, subject to information we are legally required to retain or need to keep for legitimate business purposes.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="14 August 2026">
      <p>
        At Just Nibble It, we believe privacy should be simple. This policy explains what information
        we collect, why we need it, and how we protect it when you shop with us at
        www.justnibbleit.in.
      </p>
      <p>By using our website, you agree to this Privacy Policy.</p>

      <LegalHeading>1. What We Collect</LegalHeading>
      <p>When you shop with us or contact us, we may collect:</p>
      <LegalList
        items={[
          'Your name, email address and phone number',
          'Delivery and billing address',
          'Order and transaction details',
          'Information you provide when contacting us',
          'Basic device, browser, IP address and website usage information',
          'Cookie and similar technology data',
        ]}
      />
      <p>
        We only collect information that is reasonably necessary to run our website, process your
        orders and improve your experience.
      </p>

      <LegalHeading>2. Why We Use Your Information</LegalHeading>
      <p>We use your information to:</p>
      <LegalList
        items={[
          'Process and deliver your orders',
          'Send order, payment and delivery updates',
          'Provide customer support',
          'Process refunds, returns and cancellations',
          'Prevent fraud and misuse',
          'Improve our website, products and services',
          'Understand how customers use our website',
          'Send offers, product updates and Crunch Club communications where permitted and, where required, with your consent',
          'Meet applicable legal, tax and regulatory requirements',
        ]}
      />

      <LegalHeading>3. Payments &amp; Checkout</LegalHeading>
      <p>
        Payments may be processed through third-party service providers such as Razorpay.
      </p>
      <p>
        We do not intentionally store your complete card number, CVV, PIN or other sensitive payment
        credentials on our own systems. Payment information may be collected and processed by the
        relevant payment provider according to its own privacy and security practices.
      </p>

      <LegalHeading>4. Who We Share Information With</LegalHeading>
      <p>We don’t sell your personal information.</p>
      <p>We may share necessary information with trusted service providers such as:</p>
      <LegalList
        items={[
          'Payment and checkout providers',
          'Delivery and logistics partners',
          'Website, hosting and technology providers',
          'Customer support and communication platforms',
          'Analytics and marketing service providers',
          'Government, regulatory or law-enforcement authorities when legally required',
        ]}
      />
      <p>
        These parties receive only information reasonably required to provide their services or meet
        legal obligations.
      </p>

      <LegalHeading>5. Cookies</LegalHeading>
      <p>
        We use cookies and similar technologies to keep the website working, remember preferences,
        understand website usage and improve your shopping experience.
      </p>
      <p>
        You can control cookies through your browser settings. Some website features may not work
        properly if cookies are disabled.
      </p>

      <LegalHeading>6. Your Choices &amp; Rights</LegalHeading>
      <p>Subject to applicable Indian law, you may have the right to:</p>
      <LegalList
        items={[
          'Ask what personal information we hold about you',
          'Request correction of inaccurate information',
          'Request deletion of information where legally permitted',
          'Withdraw consent for consent-based processing',
          'Opt out of promotional communications',
          'Raise a complaint about how your information is handled',
        ]}
      />
      <p>To make a request, contact us at {email}.</p>

      <LegalHeading>7. How Long We Keep Your Information</LegalHeading>
      <p>
        We keep personal information only for as long as reasonably necessary for the purposes
        described in this policy, including completing orders, providing support, resolving disputes
        and meeting legal, tax and accounting requirements.
      </p>

      <LegalHeading>8. Third-Party Links</LegalHeading>
      <p>
        Our website may link to third party websites, platforms or services. Their privacy practices
        are governed by their own policies, not this Privacy Policy.
      </p>

      <LegalHeading>9. Children’s Privacy</LegalHeading>
      <p>
        Our website is intended for users who are 18 years or older. We do not knowingly collect
        personal information from children.
      </p>

      <LegalHeading>10. Changes to This Policy</LegalHeading>
      <p>
        We may update this Privacy Policy when our services, technology or applicable laws change.
      </p>
      <p>
        The latest version will always be available on this page, along with the updated date.
      </p>

      <LegalHeading>QUICK FAQ</LegalHeading>
      <div className="space-y-4">
        {FAQ.map((item) => (
          <div key={item.q}>
            <h3 className="text-lg font-bold text-black">{item.q}</h3>
            {item.a ? (
              <p>{item.a}</p>
            ) : (
              <p>
                Absolutely. You can opt out of promotional communications or contact us at{' '}
                <strong>{email}</strong>.
              </p>
            )}
          </div>
        ))}
      </div>

      <LegalHeading>Who can I contact about my privacy?</LegalHeading>
      <p>Reach out to our Grievance Officer:</p>
      <div className="rounded-lg bg-gray-50 p-6">
        <p className="font-bold text-black">Saksham Srivastava</p>
        <p>
          Email:{' '}
          <a href={`mailto:${email}`} className="text-teal hover:underline">
            {email}
          </a>
        </p>
        <p>Phone: +91 9652336777</p>
        <p className="mt-4 text-sm italic text-gray-600">
          We aim to address privacy-related requests and complaints within a reasonable period and in
          accordance with applicable law.
        </p>
      </div>

      <p className="text-center text-xl font-bold text-teal">
        Privacy should be simple. So we keep it that way.
      </p>
    </LegalLayout>
  )
}
