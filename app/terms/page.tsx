import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-1">
            <Image src="/cryptohaven-logo.jpg" alt="CryptoHaven Logo" width={56} height={56} className="rounded-lg" />
            <span className="text-xl font-bold text-slate-900">CryptoHaven</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-slate-600 hover:text-blue-600 transition-colors">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-slate-900">Terms of Service</CardTitle>
              <p className="text-slate-600 mt-2">Effective Date: September 12, 2025</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p className="text-slate-700 mb-8">
                Welcome to CryptoHaven. By accessing or using our website, services, or platform, you agree to the
                following Terms of Service. Please read them carefully.
              </p>

              <hr className="my-8 border-slate-200" />

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Eligibility</h2>
                  <p className="text-slate-700">
                    You must be at least 18 years old to use our services. By using this platform, you confirm that you
                    meet this requirement.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Account Registration</h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>You agree to provide accurate information when creating an account.</li>
                    <li>You are responsible for maintaining the confidentiality of your account login details.</li>
                    <li>We are not responsible for any loss arising from unauthorized access to your account.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Use of Services</h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>Our platform is provided for informational and investment purposes only.</li>
                    <li>
                      Any misuse of the platform, including fraudulent activity, will result in immediate suspension of
                      your account.
                    </li>
                    <li>You agree not to use this service for any illegal or prohibited activities.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Deposits and Withdrawals</h2>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>All deposits must be made using the wallet addresses provided within the platform.</li>
                    <li>Withdrawals will be processed according to our policies and may require verification.</li>
                    <li>Fees, limits, and timelines may vary depending on payment method and network conditions.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Risks</h2>
                  <p className="text-slate-700">
                    Trading and investing in cryptocurrencies involve significant risk. You acknowledge and agree that
                    you are solely responsible for any financial losses.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
                  <p className="text-slate-700 mb-3">CryptoHaven is not responsible for:</p>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    <li>Any losses due to market fluctuations.</li>
                    <li>Service interruptions, delays, or technical issues.</li>
                    <li>Third-party actions or errors beyond our control.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Changes to Terms</h2>
                  <p className="text-slate-700">
                    We reserve the right to update or modify these Terms at any time. Continued use of the platform
                    after updates means you accept the revised Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact</h2>
                  <p className="text-slate-700 mb-3">
                    If you have any questions regarding these Terms, please contact us at:
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-slate-700 mb-2">
                      📧 Email:{" "}
                      <a href="mailto:cryptohavenpk@gmail.com" className="text-blue-600 hover:text-blue-700">
                        cryptohavenpk@gmail.com
                      </a>
                    </p>
                    <p className="text-slate-700">
                      📱 WhatsApp / Support Line:{" "}
                      <a href="https://wa.me/601157524137" className="text-blue-600 hover:text-blue-700">
                        +60 11-5752 4137
                      </a>
                    </p>
                  </div>
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
