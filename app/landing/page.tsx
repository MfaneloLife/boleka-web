export const dynamic = 'force-static';

// Tailwind recreation of the old static /out/index.html placeholder page (without inline <style>)
export default function Landing() {
  const features = [
    {
      title: '🤖 ML Vision',
      body: 'Advanced image analysis, text extraction, and barcode detection using Google Cloud Vision API'
    },
    {
      title: '🔐 OAuth Integration',
      body: 'Secure authentication with Google and (optionally) Facebook OAuth providers'
    },
    {
      title: '🎯 Rewards System',
      body: '(Planned) points, discounts, and achievements system with Firestore integration'
    },
    {
      title: '🔥 Firebase Backend',
      body: 'Firestore + Auth + (optional) Cloud Functions foundation'
    }
  ];
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 via-indigo-500 to-purple-600 p-6 text-white">
      <div className="w-full max-w-4xl text-center">
        <div className="text-5xl font-extrabold mb-2">🚀 Boleka</div>
        <p className="text-xl opacity-90 mb-8">ML Vision & Rental Platform</p>

        <div className="rounded-lg border border-green-400/60 bg-green-400/10 px-6 py-4 mb-8 backdrop-blur-sm">
          <p className="font-medium">✅ Deployment Scaffold Ready</p>
          <p className="mt-1 text-sm opacity-90">This page replaces the exported static placeholder (removed inline CSS).</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-10">
          {features.map(f => (
            <div key={f.title} className="rounded-xl bg-white/10 p-5 backdrop-blur-md border border-white/15 text-left">
              <h3 className="font-semibold text-lg mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-white/80 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-amber-400/60 bg-amber-400/10 px-6 py-5 backdrop-blur-sm text-left mx-auto max-w-2xl">
          <p className="font-semibold mb-1">Note</p>
          <p className="text-sm text-amber-50/90 leading-relaxed">
            The old <code className="px-1 py-0.5 rounded bg-black/30 text-amber-200">/out/index.html</code> was a static export artifact. Next.js will
            inline critical CSS for static export. To enforce a stricter CSP without <code className="px-1 py-0.5 rounded bg-black/30 text-amber-200">'unsafe-inline'</code>, use a dynamic
            page (like this) + global Tailwind classes instead of inline <code className="px-1 py-0.5 rounded bg-black/30 text-amber-200">&lt;style&gt;</code> blocks.
          </p>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/" className="inline-flex items-center justify-center rounded-md bg-white text-indigo-600 font-medium px-6 py-3 shadow hover:bg-indigo-50 transition-colors">Go to Main App</a>
          <a href="/auth/login" className="inline-flex items-center justify-center rounded-md bg-indigo-700 hover:bg-indigo-800 font-medium px-6 py-3 shadow transition-colors">Sign In</a>
        </div>
      </div>
    </div>
  );
}
