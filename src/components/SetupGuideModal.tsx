import React from 'react';
import { X, Key, Shield, Calendar, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Setup Guide: Automated Email Delivery</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-400 font-bold mb-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">1</span>
              <span>Generate Gmail App Password (Takes 60 seconds)</span>
            </div>
            <p className="text-slate-400 mb-3 leading-relaxed">
              Google requires an <strong>App Password</strong> for automated SMTP scripts instead of your personal Google account password.
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 ml-1">
              <li>Open your <strong>Google Account</strong> &rarr; <strong>Security</strong> (<code className="text-blue-300">myaccount.google.com/security</code>).</li>
              <li>Ensure <strong>2-Step Verification</strong> is enabled.</li>
              <li>Search for <strong className="text-white">&ldquo;App Passwords&rdquo;</strong> in the search bar.</li>
              <li>Create a new password labeled <code className="text-amber-300">AI Paper Digest</code>.</li>
              <li>Copy the generated <strong>16-character code</strong> (e.g. <code className="text-emerald-400">abcd efgh ijkl mnop</code>).</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">2</span>
              <span>Set GitHub Actions Secrets (Zero-Cost Automation)</span>
            </div>
            <p className="text-slate-400 mb-3 leading-relaxed">
              Push this repository to GitHub. In your GitHub repository:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 ml-1">
              <li>Go to <strong>Settings</strong> &rarr; <strong>Secrets and variables</strong> &rarr; <strong>Actions</strong>.</li>
              <li>Add the following <strong>Repository Secrets</strong>:</li>
            </ol>
            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="text-emerald-400">GMAIL_USER</span>
                <span className="text-slate-400">Your full Gmail address</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-emerald-400">GMAIL_APP_PASSWORD</span>
                <span className="text-slate-400">The 16-character code from Step 1</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-emerald-400">RECIPIENT_EMAIL</span>
                <span className="text-slate-400">Target inbox to receive the digest</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-emerald-400">OPENALEX_POLITE_EMAIL</span>
                <span className="text-slate-400">saber.naseralavi@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
              <span>Cron Scheduling &amp; Manual Triggers</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-2">
              The included workflow <code className="text-blue-300">.github/workflows/weekly_digest.yml</code> is configured to run every Monday at 09:00 UTC (<code className="text-amber-300">0 9 * * 1</code>).
            </p>
            <p className="text-slate-400 leading-relaxed">
              You can also test-run it immediately at any time by navigating to <strong>Actions</strong> &rarr; <strong>Weekly AI Research Velocity Digest</strong> &rarr; <strong>Run workflow</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
