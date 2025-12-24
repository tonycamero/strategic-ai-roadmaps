import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '../../lib/api';

export default function Summary() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ['owner-intakes'],
    queryFn: () => api.getOwnerIntakes(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Intake Summary</h1>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="text-center text-gray-600">Loading intakes...</div>
        )}

        {!isLoading && data?.intakes.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No intakes submitted yet</p>
          </div>
        )}

        {!isLoading && data && data.intakes.length > 0 && (
          <div className="space-y-6">
            {data.intakes.map((intake) => (
              <div key={intake.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 capitalize">
                    {intake.role} Lead Intake
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(intake.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-3">
                  {Object.entries(intake.answers).map(([key, value]) => (
                    <div key={key} className="border-b pb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-gray-600">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
