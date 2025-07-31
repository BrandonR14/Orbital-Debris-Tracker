import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover z-[-1]"
      >
        <source src="/earth.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Content */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-black/50 text-white px-4">
        <h1 className="text-4xl font-bold mb-4 text-center">Orbital Debris Tracker</h1>
        <p className="text-lg text-center mb-6">
          Predict potential satellite collisions using real orbital data.
        </p>

        <div className="flex gap-4">
          <Link href="/login">
            <button className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="px-6 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition">
              Register
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
