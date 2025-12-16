import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiCaretLeft } from "react-icons/pi";
import { TopBar } from "@/components/topbar";

export default function TermsPage() {
  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title="Terms of Use"
        startAdornment={
          <Link
            href="../menu"
            className="flex size-10 items-center justify-center rounded-full bg-gray-100"
          >
            <PiCaretLeft className="size-4 text-gray-900" />
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4">
          <Typography
            variant="body"
            level={3}
            className="text-xs text-gray-500"
          >
            Last Updated: December 2025
          </Typography>
        </div>

        <div className="flex flex-col gap-4">
          {/* Section 1 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              1. Acceptance of Terms
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              By accessing or using World Republic ("we," "us," "our," or the
              "Service"), you agree to be bound by these Terms of Use ("Terms").
              If you do not agree to these Terms, you may not access or use the
              Service.
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              These Terms constitute a legally binding agreement between you and
              World Republic. Please read these Terms carefully before using the
              Service.
            </Typography>
          </div>

          {/* Section 2 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              2. Definitions
            </Typography>
            <ul className="ml-4 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">"Service"</strong> refers to
                the World Republic application, website, and all related
                services
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">
                  "User," "you," or "your"
                </strong>{" "}
                refers to the individual accessing or using the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">"Content"</strong> refers to
                all information, data, text, software, graphics, and other
                materials available through the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">"User Content"</strong> refers
                to content that you create, upload, or submit through the
                Service, including political parties and related information
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">"WDD"</strong> refers to World
                Drachma, the digital currency used within the Service
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              3. Description of Service
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              World Republic is a democratic platform that enables global
              citizens to participate in collective decision-making and
              governance. The Service provides:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Identity verification through Self, a zero-knowledge proof
                verification system
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Political party creation and management tools
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Test elections and voting mechanisms (currently experimental)
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Digital currency (WDD) wallet functionality and transaction
                processing
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Community engagement and democratic participation features
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mt-3! text-[14px]! leading-normal! text-gray-900"
            >
              We reserve the right to modify, suspend, or discontinue any aspect
              of the Service at any time, with or without notice.
            </Typography>
          </div>

          {/* Section 4 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              4. Eligibility and Account Registration
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              4.1 Eligibility Requirements
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              To use the Service, you must:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Be at least 18 years of age
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Have the legal capacity to enter into binding agreements in your
                jurisdiction
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Comply with all applicable laws and regulations
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Provide accurate, current, and complete information during
                registration
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Maintain and promptly update your account information
              </li>
            </ul>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              4.2 Account Creation
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              You may create an account using:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Google OAuth authentication
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Passkey/biometric authentication (WebAuthn)
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mt-3! text-[14px]! leading-normal! text-gray-900"
            >
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              4.3 Account Security
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              You agree to:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Not share your account credentials with any third party
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Immediately notify us of any unauthorized use of your account
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Use a strong, unique password or secure authentication method
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Log out of your account when using shared devices
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mt-3! text-[14px]! leading-normal! text-gray-900"
            >
              We are not liable for any loss or damage arising from your failure
              to comply with these security obligations.
            </Typography>
          </div>

          {/* Section 5 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              5. Acceptable Use
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              5.1 Permitted Uses
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-3 text-[14px]! leading-normal! text-gray-900"
            >
              You may use the Service for lawful purposes in accordance with
              these Terms and all applicable laws and regulations.
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              5.2 Prohibited Activities
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              You agree NOT to:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Violate any applicable local, state, national, or international
                law or regulation
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Infringe upon the intellectual property rights of others
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Transmit any malicious code, viruses, worms, or other harmful
                software
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Attempt to gain unauthorized access to the Service, other
                accounts, or computer systems
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Interfere with or disrupt the Service, servers, or networks
                connected to the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Create fake accounts or impersonate any person or entity
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Engage in fraudulent, deceptive, or illegal activities
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Manipulate, interfere with, or attempt to compromise voting or
                election processes
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Harass, abuse, threaten, or harm other users
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Collect or harvest information about other users without their
                consent
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Use the Service for any commercial purpose without our prior
                written consent
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Reverse engineer, decompile, or disassemble any portion of the
                Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Use automated systems (bots, scrapers) to access the Service
                without permission
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              6. Test Elections and Voting
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              <strong className="font-semibold">Important Notice:</strong> Test
              elections conducted through the Service are experimental and for
              demonstration purposes only. These elections:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Do not constitute binding governance decisions
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Are not legally enforceable
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Are intended solely for testing platform functionality
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Do not create legal obligations or rights
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                May be modified, suspended, or discontinued at any time
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mt-3! text-[14px]! leading-normal! text-gray-900"
            >
              Results from test elections are for informational purposes and do
              not represent actual governance outcomes.
            </Typography>
          </div>

          {/* Section 7 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              7. Digital Currency (WDD)
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              7.1 Nature of WDD
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                WDD (World Drachma) is a digital token used within the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                WDD has no guaranteed value and may fluctuate
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                WDD is not a security, investment, or financial instrument
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                We do not guarantee the value, stability, or liquidity of WDD
              </li>
            </ul>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              7.2 Transactions
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Transactions are processed on blockchain networks and may be
                irreversible
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                You are solely responsible for the accuracy of transaction
                details
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                We are not responsible for losses due to: user error (incorrect
                wallet addresses, amounts, or network selection), fraud or
                unauthorized transactions, technical failures or network issues,
                or changes in token value
              </li>
            </ul>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              7.3 Wallet Security
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              You are responsible for:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Securing your wallet and account credentials
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Verifying transaction details before confirming
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Protecting against unauthorized access to your account
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Any losses resulting from security breaches of your account
              </li>
            </ul>
          </div>

          {/* Section 8 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              8. Intellectual Property
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              8.1 Our Content
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-3 text-[14px]! leading-normal! text-gray-900"
            >
              All content, features, and functionality of the Service, including
              but not limited to text, graphics, logos, icons, images, audio
              clips, digital downloads, and software, are the exclusive property
              of World Republic and are protected by international copyright,
              trademark, patent, trade secret, and other intellectual property
              laws.
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              8.2 User Content
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                You retain ownership of User Content you create through the
                Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                By creating User Content, you grant us a worldwide,
                non-exclusive, royalty-free, perpetual, irrevocable license to
                use, reproduce, modify, adapt, publish, translate, distribute,
                and display such User Content in connection with the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                You represent and warrant that you have all necessary rights to
                grant this license
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                We reserve the right to remove, edit, or refuse to post any User
                Content that violates these Terms
              </li>
            </ul>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              8.3 Trademarks
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              "World Republic" and related logos and marks are trademarks of
              World Republic. You may not use our trademarks without our prior
              written permission.
            </Typography>
          </div>

          {/* Section 9 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              9. Disclaimers
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              <strong className="font-semibold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT
                NOT LIMITED TO:
              </strong>
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Warranties of merchantability
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Fitness for a particular purpose
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Non-infringement of third-party rights
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Uninterrupted or error-free operation
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Accuracy, reliability, or completeness of content
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              We do not warrant that:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                The Service will meet your requirements
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                The Service will be available at all times or be uninterrupted
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                The Service will be error-free or secure
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Defects will be corrected
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                The Service or servers are free of viruses or other harmful
                components
              </li>
            </ul>
          </div>

          {/* Section 10 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              10. Limitation of Liability
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              <strong className="font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WORLD
                REPUBLIC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND
                AFFILIATES SHALL NOT BE LIABLE FOR:
              </strong>
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Indirect, incidental, special, consequential, or punitive
                damages
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Loss of profits, revenue, data, use, goodwill, or other
                intangible losses
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Damages resulting from your use or inability to use the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Unauthorized access to or alteration of your transmissions or
                data
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Statements or conduct of any third party on the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Any other matter relating to the Service
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              Our total liability to you for all claims arising from or related
              to the Service shall not exceed the greater of: (a) the amount you
              paid us in the 12 months preceding the claim, or (b) $100 USD.
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              Some jurisdictions do not allow the exclusion or limitation of
              certain damages, so some of the above limitations may not apply to
              you.
            </Typography>
          </div>

          {/* Section 11 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              11. Indemnification
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              You agree to indemnify, defend, and hold harmless World Republic
              and its officers, directors, employees, agents, and affiliates
              from and against any and all claims, damages, obligations, losses,
              liabilities, costs, and expenses (including reasonable attorneys'
              fees) arising from:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Your use of or access to the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Your violation of these Terms
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Your violation of any third-party right, including intellectual
                property, privacy, or other rights
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                User Content you submit, post, or transmit through the Service
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Your violation of any applicable law or regulation
              </li>
            </ul>
          </div>

          {/* Section 12 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              12. Account Termination
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              12.1 Termination by You
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-3 text-[14px]! leading-normal! text-gray-900"
            >
              You may terminate your account at any time by deleting it through
              the account settings in the Service. Upon termination, your right
              to use the Service will immediately cease.
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              12.2 Termination by Us
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              We may suspend or terminate your account immediately, without
              prior notice, if:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                You violate these Terms of Use
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                You engage in fraudulent or illegal activity
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                You fail to pay any fees owed (if applicable)
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                We are required to do so by law or court order
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                We determine, in our sole discretion, that termination is
                necessary to protect the Service or other users
              </li>
            </ul>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              12.3 Effect of Termination
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              Upon termination:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Your right to access and use the Service will immediately cease
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                We may delete your account and User Content
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Provisions that by their nature should survive termination will
                remain in effect
              </li>
            </ul>
          </div>

          {/* Section 13 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              13. Changes to Terms
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              We reserve the right to modify these Terms at any time. We will
              notify you of material changes by:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                Posting the updated Terms on this page
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Updating the "Last Updated" date
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                Sending you a notification through the Service or via email (if
                required by law)
              </li>
            </ul>
            <Typography
              variant="body"
              level={3}
              className="mt-3! text-[14px]! leading-normal! text-gray-900"
            >
              Your continued use of the Service after any changes constitutes
              acceptance of the modified Terms. If you do not agree to the
              modified Terms, you must stop using the Service and may delete
              your account.
            </Typography>
          </div>

          {/* Section 14 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              14. Governing Law and Dispute Resolution
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              14.1 Governing Law
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-3 text-[14px]! leading-normal! text-gray-900"
            >
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which World Republic operates,
              without regard to its conflict of law provisions.
            </Typography>

            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 mt-3! text-sm font-medium text-gray-900"
            >
              14.2 Dispute Resolution
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              Any disputes arising from these Terms or the Service shall be
              resolved through:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">
                  Good Faith Negotiation:
                </strong>{" "}
                The parties will attempt to resolve disputes through direct
                negotiation
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">Mediation:</strong> If
                negotiation fails, disputes may be resolved through mediation
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">
                  Arbitration or Litigation:
                </strong>{" "}
                As applicable by jurisdiction and the nature of the dispute
              </li>
            </ul>
          </div>

          {/* Section 15 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              15. Severability
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision shall be limited or eliminated to the
              minimum extent necessary, and the remaining provisions shall
              remain in full force and effect.
            </Typography>
          </div>

          {/* Section 16 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              16. Entire Agreement
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and World Republic regarding the
              Service and supersede all prior agreements and understandings.
            </Typography>
          </div>

          {/* Section 17 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              17. Waiver
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of such right or provision. The waiver
              of any such right or provision will be effective only if in
              writing and signed by a duly authorized representative of World
              Republic.
            </Typography>
          </div>

          {/* Section 18 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              18. Assignment
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              You may not assign or transfer these Terms or your rights
              hereunder without our prior written consent. We may assign or
              transfer these Terms or our rights and obligations without
              restriction.
            </Typography>
          </div>

          {/* Section 19 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              19. Contact Information
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="mb-2 text-[14px]! leading-normal! text-gray-900"
            >
              If you have questions about these Terms, please contact us at:
            </Typography>
            <ul className="ml-4 mb-3 list-disc space-y-1.5">
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">Email:</strong>{" "}
                legal@worldrepublic.org
              </li>
              <li className="text-[14px] leading-normal text-gray-900">
                <strong className="font-semibold">Website:</strong>{" "}
                https://www.worldrepublic.org
              </li>
            </ul>
          </div>

          {/* Section 20 */}
          <div>
            <Typography
              variant="subtitle"
              level={3}
              className="mb-2 text-base font-semibold text-gray-900"
            >
              20. Acknowledgment
            </Typography>
            <Typography
              variant="body"
              level={3}
              className="text-[14px]! leading-normal! text-gray-900"
            >
              By using the Service, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Use. If you do
              not agree to these Terms, you may not use the Service.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
}
