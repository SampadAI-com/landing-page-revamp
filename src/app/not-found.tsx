export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">404</h2>
        <p className="text-gray-600 mb-4">This page could not be found.</p>
        <a href="/" className="text-blue-500 hover:underline">
          Go back home
        </a>
      </div>
    </div>
  );
}

