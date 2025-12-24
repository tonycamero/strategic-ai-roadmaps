import { useLocation } from 'wouter';

export default function Roadmap() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Roadmap</h1>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your AI Roadmap
          </h2>
          <p className="text-gray-600 mb-6">
            This feature will display your strategic AI roadmap once generated.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">Phase 2 Feature</h3>
            <p className="text-sm text-blue-800">
              In the next phase, you'll be able to:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
              <li>View AI-generated strategic roadmaps</li>
              <li>Upload custom PDF roadmaps</li>
              <li>Share roadmaps with your team</li>
              <li>Track implementation progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
