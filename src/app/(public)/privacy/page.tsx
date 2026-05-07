import type { Metadata } from "next";
import LegalShell from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MyEjari collects, uses, and protects your personal information when you use our Virtual Office Ejari comparison platform.",
  alternates: { canonical: "https://myejari.ae/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      subtitle="Your privacy matters to us. Here's exactly what we collect and why."
      lastUpdated="May 2026"
    >
      <Section title="1. Introduction">
        <p>
          MyEjari (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
          operates the website myejari.ae and myejari.com (the
          &ldquo;Platform&rdquo;). This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you visit our
          Platform or use our Virtual Office Ejari comparison and booking
          services.
        </p>
        <p>
          By using the Platform, you consent to the data practices described in
          this policy. If you do not agree, please do not use the Platform.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
          <li>
            <strong>Contact information:</strong> name, email address, WhatsApp
            number, and phone number when you submit our lead form.
          </li>
          <li>
            <strong>Business information:</strong> details about your trade
            license, business activity, and Ejari requirements that you share
            with us.
          </li>
          <li>
            <strong>Communications:</strong> messages you send us via WhatsApp,
            email, phone, or our forms.
          </li>
          <li>
            <strong>Usage data:</strong> automatically collected information
            including IP address, browser type, pages visited, time spent, and
            referring website.
          </li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>
            Match you with licensed business centers and provide quotations.
          </li>
          <li>Facilitate your Ejari issuance or renewal.</li>
          <li>Respond to your enquiries and provide customer support.</li>
          <li>
            Improve our Platform, services, and user experience based on
            aggregated usage trends.
          </li>
          <li>
            Send you transactional updates relating to your enquiry. We do not
            send marketing emails without your consent.
          </li>
          <li>Comply with applicable UAE laws and regulations.</li>
        </ul>
      </Section>

      <Section title="4. Sharing With Business Centers">
        <p>
          MyEjari is a comparison and concierge platform. To produce a
          quotation and to register your Ejari, we share the minimum
          necessary contact and business information with the licensed
          business center engaged to issue your certificate. Each business
          center is independently responsible for handling that data once
          shared.
        </p>
      </Section>

      <Section title="5. Cookies and Tracking">
        <p>
          We use cookies and similar tracking technologies to remember your
          preferences and analyse traffic. You can control cookies through your
          browser settings. Disabling cookies may affect the functionality of
          some Platform features.
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We implement reasonable technical and organisational measures to
          protect your information against unauthorised access, alteration,
          disclosure, or destruction. However, no method of transmission over
          the internet is fully secure, and we cannot guarantee absolute
          security.
        </p>
      </Section>

      <Section title="7. Data Retention">
        <p>
          We retain your information for as long as necessary to fulfil the
          purposes outlined in this policy, comply with legal obligations,
          resolve disputes, and enforce our agreements. Lead data is typically
          retained for 24 months unless you request earlier deletion.
        </p>
      </Section>

      <Section title="8. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your personal information.</li>
          <li>Object to or restrict the processing of your data.</li>
          <li>Withdraw consent at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, message us on{" "}
          <a
            href="https://api.whatsapp.com/send?phone=971585540076"
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="privacy_inline"
            className="text-primary hover:underline"
          >
            WhatsApp
          </a>
          .
        </p>
      </Section>

      <Section title="9. Third-Party Links">
        <p>
          Our Platform may contain links to third-party sites. We are not
          responsible for their privacy practices. Please review their policies
          before sharing any information.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. The updated
          version will be indicated by the &ldquo;Last updated&rdquo; date at
          the top of this page. Continued use of the Platform after changes
          constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          For questions or concerns about this Privacy Policy, message us on
          WhatsApp at{" "}
          <a
            href="https://api.whatsapp.com/send?phone=971585540076"
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="privacy_contact"
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
