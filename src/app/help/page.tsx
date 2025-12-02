'use client';

import { useState } from 'react';
import { HelpCircle, MessageCircle, Book, Mail, ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on "Sign Up" in the top right corner. You can register as a Client to post jobs, or as a Professional to offer your services. Fill in your details and verify your email to get started.',
    },
    {
      question: 'How do I post a job?',
      answer: 'Once logged in as a client, click "Post a Job" from the menu. Describe your project, set your budget, location, and any specific requirements. Professionals will then be able to submit proposals.',
    },
    {
      question: 'How do payments work?',
      answer: 'Payments are handled securely through our platform. When you accept a proposal, the payment is held in escrow. Once the work is completed and approved, the funds are released to the professional.',
    },
    {
      question: 'How do I become a professional on Homico?',
      answer: 'Register as a Professional, complete your profile with your skills and experience, add portfolio items, and set up your service areas. Once approved, you can start bidding on jobs.',
    },
    {
      question: 'What if I have a dispute?',
      answer: 'If you have any issues with an order, first try to resolve it directly with the other party through messages. If that doesn\'t work, you can open a dispute and our support team will help mediate.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can reach our support team via email at support@homico.ge or through the contact form below. We typically respond within 24 hours.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50">Help & Support</h1>
          <p className="mt-2 text-gray-600 dark:text-neutral-400">How can we help you today?</p>

          {/* Search */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-neutral-600" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none p-6 text-center hover:shadow-md transition-all duration-200 ease-out cursor-pointer">
            <div className="bg-blue-100 dark:bg-dark-elevated w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-neutral-50 mb-2">Getting Started</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400">Learn the basics of using Homico</p>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none p-6 text-center hover:shadow-md transition-all duration-200 ease-out cursor-pointer">
            <div className="bg-green-100 dark:bg-dark-elevated w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-neutral-50 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400">Chat with our support team</p>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none p-6 text-center hover:shadow-md transition-all duration-200 ease-out cursor-pointer">
            <div className="bg-purple-100 dark:bg-dark-elevated w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-neutral-50 mb-2">Email Us</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400">support@homico.ge</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-neutral-50">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
                  )}
                </button>
                {openFaq === index && (
                  <p className="pb-4 text-gray-600 dark:text-neutral-400">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm dark:shadow-none p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-6">Still need help?</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">Subject</label>
              <input
                type="text"
                placeholder="What do you need help with?"
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-400 mb-2">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your issue in detail..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-elevated rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 ease-out"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
