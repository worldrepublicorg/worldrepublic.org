import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiCaretLeft } from "react-icons/pi";
import { TopBar } from "@/components/topbar";

export default function PrivacyPage() {
	return (
		<div className="pb-safe flex flex-col">
			<TopBar
				title="Privacy Policy"
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
							1. Introduction
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="text-[14px]! leading-normal! text-gray-900"
						>
							Welcome to World Republic. We respect your privacy and are
							committed to protecting your personal information. This Privacy
							Policy explains how we collect, use, disclose, and safeguard your
							information when you use our mobile application and services
							(collectively, the "Service").
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mt-2 text-[14px]! leading-normal! text-gray-900"
						>
							Please read this Privacy Policy carefully. By using our Service,
							you agree to the collection and use of information in accordance
							with this policy. If you do not agree with our policies and
							practices, please do not use our Service.
						</Typography>
					</div>

					{/* Section 2 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							2. Information We Collect
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-3 text-[14px]! leading-normal! text-gray-900"
						>
							We collect information that you provide directly to us and
							information that is automatically collected when you use our
							Service. Under applicable privacy laws (including GDPR and CCPA),
							"personal information" is broadly defined and includes any
							information that can identify you directly or indirectly.
						</Typography>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							2.1 Information You Provide to Us
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Account Information:</strong>{" "}
								When you create an account, we collect your email address, name,
								and profile image (if you sign in with Google OAuth)
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Profile Information:</strong>{" "}
								We automatically generate a unique username for your account
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Content You Create:</strong>{" "}
								Information you provide when creating political parties,
								including party names, descriptions, and website URLs
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Transaction Information:
								</strong>{" "}
								Details about transactions you initiate, including wallet
								addresses and transaction amounts
							</li>
						</ul>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							2.2 Information Automatically Collected
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Device Information:</strong>{" "}
								We collect information about your device, including device type,
								operating system, browser type, and device identifiers
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Log Information:</strong> When
								you use our Service, we automatically collect certain
								information, including: IP addresses, browser type and version,
								pages you visit and time spent on pages, date and time of your
								visit, and referring website addresses
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Usage Information:</strong> We
								collect information about how you interact with our Service,
								including features you use, actions you take, pages you view,
								and time and duration of your activities
							</li>
						</ul>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							2.3 Cookies and Similar Technologies
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We use cookies, local storage, and similar technologies to:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Essential Cookies:</strong>{" "}
								Required for authentication and security. These cookies are
								necessary for the Service to function and cannot be switched off
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Functional Cookies:</strong>{" "}
								Store your preferences, such as language selection
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Analytics Cookies:</strong>{" "}
								Help us understand how visitors interact with our Service
								through anonymized performance monitoring
							</li>
						</ul>
						<Typography
							variant="body"
							level={3}
							className="mt-3! text-[14px]! leading-normal! text-gray-900"
						>
							You can control cookies through your browser settings. However,
							disabling certain cookies may limit your ability to use some
							features of our Service.
						</Typography>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							2.4 Identity Verification Information
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We use Self, a third-party identity verification service that
							employs zero-knowledge proofs.{" "}
							<strong className="font-semibold">Important:</strong> We do NOT
							collect, store, or have access to any personal information from
							your government-issued identification documents (such as passports
							or national IDs).
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							Self verification works by:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								You scan your ID document using the Self mobile app
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Self creates a cryptographic proof that verifies you are a
								unique, real person
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								We only receive a cryptographic nullifier (a unique identifier)
								that prevents duplicate verifications
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								No personal data from your ID document is ever shared with us or
								stored on our servers
							</li>
						</ul>
						<Typography
							variant="body"
							level={3}
							className="mt-3! text-[14px]! leading-normal! text-gray-900"
						>
							This zero-knowledge approach ensures your identity can be verified
							while maintaining complete privacy of your personal identification
							information.
						</Typography>
					</div>

					{/* Section 3 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							3. How We Use Your Information
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We use the information we collect to:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Provide and Maintain the Service:
								</strong>{" "}
								Create and manage your account, process transactions, and
								deliver the features you request
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Authenticate Your Identity:
								</strong>{" "}
								Verify your identity and secure your account using
								authentication methods you choose
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Process Transactions:</strong>{" "}
								Facilitate digital currency transactions, manage your wallet
								balance, and maintain transaction records
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Enable Platform Features:
								</strong>{" "}
								Support political party creation, voting mechanisms, and
								community engagement features
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Improve Our Service:</strong>{" "}
								Analyze usage patterns to enhance user experience, fix bugs, and
								develop new features
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Ensure Security:</strong>{" "}
								Detect, prevent, and address fraud, abuse, security issues, and
								technical problems
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Comply with Legal Obligations:
								</strong>{" "}
								Meet legal requirements, respond to legal processes, and protect
								our rights
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Communicate with You:</strong>{" "}
								Send you service-related notifications and respond to your
								inquiries
							</li>
						</ul>
					</div>

					{/* Section 4 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							4. How We Share Your Information
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-3 text-[14px]! leading-normal! text-gray-900"
						>
							We do not sell your personal information. We may share your
							information in the following circumstances:
						</Typography>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							4.1 Service Providers
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We share information with third-party service providers who
							perform services on our behalf:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Google (OAuth):</strong> For
								user authentication. Google's use of your information is
								governed by their Privacy Policy:
								https://policies.google.com/privacy
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Self (Identity Verification):
								</strong>{" "}
								For identity verification using zero-knowledge proofs. Only
								cryptographic nullifiers are shared; no personal ID data is
								transmitted
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Vercel Speed Insights:
								</strong>{" "}
								For performance monitoring. Vercel Speed Insights collects
								anonymized performance metrics only and does not store personal
								information
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Thirdweb:</strong> For
								processing blockchain transactions. Only transaction data
								(wallet addresses, amounts, network information) is shared; no
								personal identifying information is sent
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Neon Database:</strong> For
								data storage and hosting. All user data stored in our database
								is hosted on Neon's infrastructure
							</li>
						</ul>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							4.2 Legal Requirements
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-3 text-[14px]! leading-normal! text-gray-900"
						>
							We may disclose your information if required to do so by law or in
							response to valid requests by public authorities (e.g., a court or
							government agency).
						</Typography>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							4.3 Business Transfers
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="text-[14px]! leading-normal! text-gray-900"
						>
							If we are involved in a merger, acquisition, or asset sale, your
							information may be transferred as part of that transaction.
						</Typography>
					</div>

					{/* Section 5 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							5. Data Security
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We implement appropriate technical and organizational security
							measures designed to protect your personal information, including:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								Encryption of data in transit using HTTPS/TLS
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Secure database storage with access controls
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Regular security assessments and updates
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Secure authentication and session management
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Limited access to personal information on a need-to-know basis
							</li>
						</ul>
						<Typography
							variant="body"
							level={3}
							className="mt-3! text-[14px]! leading-normal! text-gray-900"
						>
							However, no method of transmission over the Internet or electronic
							storage is 100% secure. While we strive to use commercially
							acceptable means to protect your information, we cannot guarantee
							absolute security.
						</Typography>
					</div>

					{/* Section 6 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							6. Data Retention
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We retain your personal information for as long as necessary to
							fulfill the purposes outlined in this Privacy Policy, unless a
							longer retention period is required or permitted by law:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Account Information:</strong>{" "}
								Retained until you delete your account or for 3 years of account
								inactivity
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Transaction Records:</strong>{" "}
								Retained for 7 years to comply with legal and regulatory
								requirements
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">
									Server Logs (including IP addresses):
								</strong>{" "}
								Retained for 90 days
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Analytics Data:</strong>{" "}
								Aggregated and anonymized data may be retained indefinitely
							</li>
						</ul>
						<Typography
							variant="body"
							level={3}
							className="mt-3! text-[14px]! leading-normal! text-gray-900"
						>
							When we no longer need your personal information, we will delete
							or anonymize it in accordance with our data retention policies.
						</Typography>
					</div>

					{/* Section 7 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							7. Your Privacy Rights
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-3 text-[14px]! leading-normal! text-gray-900"
						>
							Depending on your location, you may have certain rights regarding
							your personal information:
						</Typography>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							7.1 Rights Under GDPR (European Users)
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							If you are located in the European Economic Area (EEA), you have
							the right to:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Access:</strong> Request a
								copy of the personal information we hold about you
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Rectification:</strong>{" "}
								Request correction of inaccurate or incomplete information
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Erasure:</strong> Request
								deletion of your personal information ("right to be forgotten")
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Restriction:</strong> Request
								limitation of processing in certain circumstances
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Data Portability:</strong>{" "}
								Receive your personal information in a structured,
								machine-readable format
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Objection:</strong> Object to
								processing based on legitimate interests
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Withdraw Consent:</strong>{" "}
								Withdraw consent where processing is based on consent
							</li>
						</ul>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							7.2 Rights Under CCPA (California Users)
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							If you are a California resident, you have the right to:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Know:</strong> Request
								disclosure of the categories and specific pieces of personal
								information we collect
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Delete:</strong> Request
								deletion of your personal information
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Opt-Out:</strong> Opt-out of
								the sale of personal information (we do not sell personal
								information)
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Non-Discrimination:</strong>{" "}
								Not be discriminated against for exercising your privacy rights
							</li>
						</ul>

						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 mt-3! text-sm font-medium text-gray-900"
						>
							7.3 How to Exercise Your Rights
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="text-[14px]! leading-normal! text-gray-900"
						>
							To exercise any of these rights, please contact us at
							privacy@worldrepublic.org. We will respond to your request within
							the timeframes required by applicable law.
						</Typography>
					</div>

					{/* Section 8 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							8. International Data Transfers
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							Your information may be transferred to and processed in countries
							other than your country of residence. These countries may have
							data protection laws that differ from those in your country.
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							When we transfer your information internationally, we ensure
							appropriate safeguards are in place, including:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								Standard Contractual Clauses approved by the European Commission
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Adequacy decisions by relevant data protection authorities
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Other legally recognized transfer mechanisms
							</li>
						</ul>
					</div>

					{/* Section 9 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							9. Children's Privacy
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="text-[14px]! leading-normal! text-gray-900"
						>
							Our Service is not intended for children under 18 years of age. We
							do not knowingly collect personal information from children under
							18. If you are a parent or guardian and believe your child has
							provided us with personal information, please contact us
							immediately.
						</Typography>
					</div>

					{/* Section 10 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							10. Changes to This Privacy Policy
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							We may update this Privacy Policy from time to time to reflect
							changes in our practices or for other operational, legal, or
							regulatory reasons. We will notify you of any material changes by:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								Posting the updated Privacy Policy on this page
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Updating the "Last Updated" date
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								Sending you a notification (if required by law)
							</li>
						</ul>
						<Typography
							variant="body"
							level={3}
							className="mt-3! text-[14px]! leading-normal! text-gray-900"
						>
							Your continued use of the Service after any changes constitutes
							acceptance of the updated Privacy Policy.
						</Typography>
					</div>

					{/* Section 11 */}
					<div>
						<Typography
							variant="subtitle"
							level={3}
							className="mb-2 text-base font-semibold text-gray-900"
						>
							11. Contact Us
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="mb-2 text-[14px]! leading-normal! text-gray-900"
						>
							If you have questions, concerns, or requests regarding this
							Privacy Policy or our privacy practices, please contact us at:
						</Typography>
						<ul className="ml-4 mb-3 list-disc space-y-1.5">
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Email:</strong>{" "}
								privacy@worldrepublic.org
							</li>
							<li className="text-[14px] leading-normal text-gray-900">
								<strong className="font-semibold">Website:</strong>{" "}
								https://www.worldrepublic.org
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
							12. Data Protection Authority
						</Typography>
						<Typography
							variant="body"
							level={3}
							className="text-[14px]! leading-normal! text-gray-900"
						>
							If you are located in the EEA and believe we have violated your
							privacy rights, you have the right to lodge a complaint with your
							local data protection authority.
						</Typography>
					</div>
				</div>
			</div>
		</div>
	);
}
