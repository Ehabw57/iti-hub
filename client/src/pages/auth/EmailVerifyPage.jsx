import { useSearchParams } from 'react-router-dom';

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-xl font-semibold mb-2">
          Email Verification
        </h1>

        {token ? (
          <p className="text-green-600">
            Mock verification successful ✅
          </p>
        ) : (
          <p className="text-red-600">
            No verification token found ❌
          </p>
        )}

        <p className="text-gray-500 text-sm mt-4">
          (This is a mock page for now)
        </p>
      </div>
    </div>
  );
}
