import { Link } from 'react-router-dom'
import LegalLayout, { LegalHeading, LegalList } from '../components/layout/LegalLayout'
import { legalBusinessDetails } from '../data/site'

const { email } = legalBusinessDetails

export default function ShippingReturnPage() {
  return (
    <LegalLayout title="Shipping and Return Policy" lastUpdated="17 August 2026">
      <p>
        This policy explains how Just Nibble It, operated by Meenakshi Craft Foods Private Limited,
        ships packaged snack orders and handles returns.
      </p>

      <LegalHeading>1. Delivery coverage</LegalHeading>
      <p>
        We deliver across serviceable pincodes in India. Availability is confirmed when you enter
        your 6-digit pincode at checkout. If a pincode is not serviceable, payment will not be
        completed for that address.
      </p>

      <LegalHeading>2. Processing and timelines</LegalHeading>
      <LegalList
        items={[
          'Orders are typically packed within 1–2 business days after payment confirmation.',
          'Metro pincodes may receive faster dispatch. Other serviceable pincodes usually take 4–7 business days.',
          'Delivery estimates shown at checkout are indicative and can change due to courier capacity, weather, or holidays.',
        ]}
      />

      <LegalHeading>3. Shipping charges</LegalHeading>
      <p>
        Orders of ₹499 and above currently qualify for free delivery. Below that threshold, shipping
        is calculated at dispatch and shown before you pay.
      </p>

      <LegalHeading>4. Tracking</LegalHeading>
      <p>
        Once your order is handed to the courier, we share tracking details by email/SMS where
        available. Please keep your phone reachable for delivery attempts.
      </p>

      <LegalHeading>5. Returns</LegalHeading>
      <p>
        Packaged foods cannot be returned once opened for hygiene reasons. We do accept returns or
        replacements for:
      </p>
      <LegalList
        items={[
          'Damaged, leaked, or crushed packs reported within 48 hours of delivery with photos',
          'Wrong item or missing item versus the confirmed order',
          'Expired product received in error',
        ]}
      />
      <p>
        To start a return, email{' '}
        <a className="font-black text-ink hover:underline" href={`mailto:${email}`}>
          {email}
        </a>{' '}
        with your order number, photos, and delivery date. Approved returns are collected or
        credited as per the{' '}
        <Link className="font-black text-ink hover:underline" to="/refunds">
          Refund Policy
        </Link>
        .
      </p>

      <LegalHeading>6. Failed delivery</LegalHeading>
      <p>
        If a shipment is returned because the address was incomplete, the recipient was unavailable,
        or the package was refused, we may charge re-shipping or process a refund minus outbound
        shipping, depending on the case.
      </p>
    </LegalLayout>
  )
}
