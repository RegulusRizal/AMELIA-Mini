export default function TestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Test Page</h1>
          <p>This is a simple test page to verify deployment.</p>
          <p className="mt-4">Deployment timestamp: {new Date().toISOString()}</p>
          <p className="mt-2">Build time: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
}