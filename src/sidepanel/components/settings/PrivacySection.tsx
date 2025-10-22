import { Shield } from 'lucide-react';

export function PrivacySection() {
  return (
    <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Privacy</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        All data is stored locally on your device using Chrome's encrypted storage. We never send
        your data to external servers.
      </p>
    </section>
  );
}
