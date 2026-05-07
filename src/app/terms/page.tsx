import type { Metadata } from "next";
import LegalShell from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions governing your use of the MyEjari Virtual Office Ejari comparison platform.",
  alternates: { canonical: "https://myejari.ae/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms & Conditions"
      subtitle="The ground rules for using MyEjari."
      lastUpdated="May 2026"
    >
      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using myejari.ae, myejari.com, or any associated
          service (the &ldquo;Platform&rdquo;), you agree to be bound by these
          Terms & Conditions. If you do not agree, please do not use the
          Platform.
        </p>
      </Section>

      <Section title="2. About Our Service">
        <p>
          MyEjari is a facilitator that connects users with licensed business
          centers in the UAE authorised to issue Ejari certificates for Virtual
          Office arrangements. We are{" "}
          <strong>
            not a government entity and we do not issue Ejari certificates
            ourselves
          </strong>
          . The actual issuance of the Ejari is performed by the licensed
          business center engaged on your behalf.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <p>
          You must be at least 18 years old and legally capable of entering
          into binding contracts under the laws of the United Arab Emirates to
          use our Platform.
        </p>
      </Section>

      <Section title="4. Payments">
        <p>
          Payment for Ejari services is made via a payment link or bank
          transfer, as agreed at the time of engagement. Once the Ejari
          certificate has been issued,{" "}
          <strong>refunds are not possible</strong>.
        </p>
      </Section>

      <Section title="5. MyEjari as a Facilitator">
        <p>
          By proceeding with the issuance of the Ejari certificate, the
          undersigned acknowledges and agrees that MyEjari is acting solely as
          a facilitator in the process of obtaining the Ejari. Furthermore,
          MyEjari is not responsible for any delays, cancellations, or
          disputes that may occur due to actions taken by third-party entity.
        </p>
      </Section>

      <Section title="6. User Responsibilities">
        <p>You agree to:</p>
        <ul>
          <li>
            Provide accurate, current, and complete information when using the
            Platform.
          </li>
          <li>
            Submit only documents you are legally entitled to share, including
            valid trade licenses, passport copies, and Emirates IDs.
          </li>
          <li>
            Use the Platform only for lawful purposes and not for any fraudulent
            or unauthorised activity.
          </li>
          <li>
            Not attempt to reverse engineer, scrape, or interfere with the
            Platform&rsquo;s operation.
          </li>
        </ul>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          All content on the Platform — including the MyEjari name, logo,
          design, text, graphics, and software — is owned by or licensed to
          MyEjari and is protected by intellectual property laws. You may not
          reproduce or use any of it without prior written permission.
        </p>
      </Section>

      <Section title="8. Disclaimers">
        <p>
          The Platform is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranties of any kind, express or implied.
          We do not warrant that the Platform will be uninterrupted, error-free,
          or secure, nor that the information provided by business centers is
          complete or accurate.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, MyEjari shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the Platform or from any agreement
          you enter into with a business center introduced via the Platform.
        </p>
      </Section>

      <Section title="10. Indemnification">
        <p>
          You agree to indemnify and hold MyEjari, its officers, employees, and
          partners harmless from any claim or demand, including reasonable
          legal fees, arising from your breach of these Terms or your misuse of
          the Platform.
        </p>
      </Section>

      <Section title="11. Termination">
        <p>
          We may suspend or terminate your access to the Platform at any time,
          with or without notice, if we reasonably believe you have violated
          these Terms.
        </p>
      </Section>

      <Section title="12. Governing Law">
        <p>
          These Terms are governed by the laws of the United Arab Emirates.
          Any dispute arising from or relating to these Terms or the Platform
          shall be subject to the exclusive jurisdiction of the Dubai courts.
        </p>
      </Section>

      <Section title="13. Changes">
        <p>
          We may update these Terms from time to time. The &ldquo;Last
          updated&rdquo; date at the top reflects the latest version. Continued
          use of the Platform after changes constitutes acceptance.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>
          For any questions about these Terms, message us on WhatsApp at{" "}
          <a
            href="https://api.whatsapp.com/send?phone=971585540076"
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="terms_contact"
            className="text-primary hover:underline"
          >
            +971 58 554 0076
          </a>
          . WhatsApp is the only customer contact channel we operate.
        </p>
      </Section>
    </LegalShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_a]:text-primary">
        {children}
      </div>
    </section>
  );
}
