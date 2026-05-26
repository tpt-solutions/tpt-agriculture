import Link from "next/link";

export default function UpgradePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Module not included</h1>
        <p className="mt-2 text-sm text-gray-500">
          This module is not part of your current subscription. Upgrade your plan to unlock it.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            View subscription
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
