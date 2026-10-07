import { Link } from 'react-router-dom'
import LegalLayout, { LegalHeading, LegalList } from '../components/layout/LegalLayout'
import { legalBusinessDetails } from '../data/site'

const { email } = legalBusinessDetails

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="17 August 2026">
      <p>
        This Refund Policy applies to purchases made on www.justnibbleit.in from Meenakshi Craft
        Foods Private Limited (Just Nibble It).
      </p>

      <LegalHeading>1. When we refund</LegalHeading>
      <LegalList
        items={[
          'Damaged, leaked, or inedible packs confirmed by our team',
          'Wrong or missing items versus the paid order',
          'Duplicate payment or confirmed payment where the order could not be fulfilled',
          'Cancelled orders that have not yet been packed or dispatched',
        ]}
      />

      <LegalHeading>2. When we cannot refund</LegalHeading>
      <LegalList
        items={[
          'Opened or partly consumed packs, except proven quality issues',
          'Change of mind after dispatch of perishable/packaged food',
          'Incorrect address provided by the customer that caused a failed delivery',
          'Requests raised later than 48 hours after delivery without a valid reason',
        ]}
      />

      <LegalHeading>3. How to request a refund</LegalHeading>
      <p>
        Email{' '}
        <a className="font-black text-ink hover:underline" href={`mailto:${email}`}>
          {email}
        </a>{' '}
        with order ID, payment ID (if available), photos of the issue, and your registered phone
        number. We aim to respond within 2 business days.
      </p>

      <LegalHeading>4. Refund method and timeline</LegalHeading>
      <p>
        Approved refunds are sent to the original payment method (UPI, card, net banking, or wallet
        used via Razorpay). Bank or UPI providers typically complete the credit in 5–7 business days
        after we initiate the reversal.
      </p>

      <LegalHeading>5. Partial refunds</LegalHeading>
      <p>
        If only some packs in an order are affected, we refund the value of those packs. Shipping may
        be refunded when the issue is our error.
      </p>
      <p>
        Shipping and return steps are described in our{' '}
        <Link className="font-black text-ink hover:underline" to="/shipping">
          Shipping and Return Policy
        </Link>
        .
      </p>
    </LegalLayout>
  )
}
