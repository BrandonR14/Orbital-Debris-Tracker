'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import {
  Satellite, Shield, Brain, ChevronRight, Database,
  GitBranch, BarChart3, AlertTriangle, Globe, Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-bold tracking-widest text-yellow-400 uppercase mb-3">
      {children}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
      {children}
    </h2>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TLE annotated example
// ---------------------------------------------------------------------------

function TLEAnnotation({ label, color, children }: { label: string; color: string; children: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${color}`} />
      <div>
        <span className={`text-xs font-bold ${color.replace('bg-', 'text-')}`}>{label}</span>
        <p className="text-gray-300 text-xs leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step card for the prediction pipeline
// ---------------------------------------------------------------------------

function StepCard({
  number, icon: Icon, title, body,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shrink-0">
          <span className="text-yellow-400 font-bold text-sm">{number}</span>
        </div>
        <div className="w-px flex-1 bg-yellow-500/20 mt-2" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-yellow-400" />
          <h4 className="text-white font-semibold">{title}</h4>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();
  const authed = isAuthenticated();

  return (
    <div className="text-white">

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 relative">
        {/* Subtle gradient overlay to darken the video */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Nav pill */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live orbital data from Space-Track.org
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 bg-clip-text text-transparent leading-none pb-2">
            Orbital Debris<br />Tracker
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Real-time satellite conjunction analysis powered by SGP4 orbital mechanics
            and machine learning. Predict collision risk between any two tracked objects
            in Earth orbit.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {authed ? (
              <button
                onClick={() => router.push('/predict')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-semibold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20"
              >
                Go to Dashboard <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <>
                <Link href="/register">
                  <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-semibold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20 w-full">
                    Get Started Free <ChevronRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 bg-white/5 backdrop-blur border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all w-full">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Scroll hint */}
          <div className="mt-20 flex flex-col items-center gap-2 text-gray-500 text-sm animate-bounce">
            <span>Scroll to learn more</span>
            <ChevronRight className="h-4 w-4 rotate-90" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STATS BAR                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-black/70 backdrop-blur border-y border-white/10 py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '25,000+', label: 'Tracked Objects' },
            { value: '7 Days', label: 'Prediction Window' },
            { value: '1-Second', label: 'TCA Precision' },
            { value: 'ML-Powered', label: 'Risk Classification' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-bold text-yellow-400">{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* THE DEBRIS PROBLEM                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-black/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel>The Problem</SectionLabel>
              <SectionHeading>Earth's orbit is getting crowded</SectionHeading>
              <p className="text-gray-300 leading-relaxed mb-4">
                There are more than 25,000 objects larger than 10 cm orbiting Earth right now —
                including active satellites, spent rocket stages, and fragments from past collisions
                and explosions. At orbital velocities of 7–8 km/s, even a paint fleck carries
                the energy of a bullet.
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                In 1978, NASA scientist Donald Kessler proposed that beyond a certain debris density,
                collisions would generate enough new fragments to trigger a chain reaction — the
                <span className="text-yellow-400 font-medium"> Kessler Syndrome</span> — potentially
                rendering entire orbital shells unusable for generations.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Tracking conjunctions (close approaches between objects) and assessing collision risk
                is one of the most critical tasks in modern spaceflight operations.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Globe, title: 'Low Earth Orbit (LEO)', body: '200–2,000 km altitude. The most congested region. Home to the ISS, Hubble, and thousands of Starlink satellites. Debris here decays over years to decades.' },
                { icon: AlertTriangle, title: 'Hypervelocity Impacts', body: 'Objects in LEO cross each other at relative velocities up to 15 km/s. An impact at this speed shatters both objects into thousands of fragments, each capable of causing further collisions.' },
                { icon: Shield, title: 'Conjunction Screening', body: 'Space agencies screen every tracked object against every other daily. Events with miss distances under 1 km get flagged for close monitoring and possible maneuver planning.' },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title} className="flex gap-4">
                  <Icon className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">{title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* WHAT IS A TLE                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Orbital Data</SectionLabel>
            <SectionHeading>What is a Two-Line Element set?</SectionHeading>
            <p className="text-gray-300 max-w-2xl mx-auto">
              A TLE is the standard format for describing a satellite's orbit. Every tracked
              object has one, updated regularly as ground stations refine their measurements.
            </p>
          </div>

          <Card className="mb-10">
            {/* TLE display */}
            <p className="text-gray-500 text-xs mb-3 font-mono">Example — ISS (ZARYA) · NORAD ID 25544</p>
            <div className="font-mono text-sm leading-7 bg-black/60 rounded-xl p-5 overflow-x-auto">
              <p className="text-gray-400">ISS (ZARYA)</p>
              <p>
                <span className="text-blue-400">1 </span>
                <span className="text-green-400">25544</span>
                <span className="text-gray-500">U </span>
                <span className="text-purple-400">98067A   </span>
                <span className="text-yellow-400">24001.50000000</span>
                <span className="text-gray-500">  </span>
                <span className="text-orange-400">.00001234</span>
                <span className="text-gray-500">  00000-0  </span>
                <span className="text-pink-400">12345-4</span>
                <span className="text-gray-500"> 0  9999</span>
              </p>
              <p>
                <span className="text-blue-400">2 </span>
                <span className="text-green-400">25544  </span>
                <span className="text-cyan-400">51.6400 </span>
                <span className="text-red-400">123.4567 </span>
                <span className="text-emerald-400">0001234 </span>
                <span className="text-violet-400">123.4567 </span>
                <span className="text-yellow-400">236.5432 </span>
                <span className="text-white">15.49000000</span>
                <span className="text-gray-500">123456</span>
              </p>
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
              <TLEAnnotation label="NORAD ID" color="bg-green-400">
                Unique 5-digit catalog number assigned to every tracked object by the US Space Force.
              </TLEAnnotation>
              <TLEAnnotation label="International Designator" color="bg-purple-400">
                Encodes the launch year, launch number of the year, and piece identifier (98067A = ISS, launched 1998, 67th launch, piece A).
              </TLEAnnotation>
              <TLEAnnotation label="Epoch" color="bg-yellow-400">
                The moment in time the TLE is valid for, expressed as year + day-of-year with decimal fraction.
              </TLEAnnotation>
              <TLEAnnotation label="Ballistic Coefficient / Drag" color="bg-orange-400">
                Describes how much atmospheric drag slows the satellite. Higher drag means faster orbital decay for LEO objects.
              </TLEAnnotation>
              <TLEAnnotation label="Inclination" color="bg-cyan-400">
                Angle of the orbital plane relative to the equator in degrees. 51.6° for ISS — it passes over most populated latitudes.
              </TLEAnnotation>
              <TLEAnnotation label="RAAN" color="bg-red-400">
                Right Ascension of the Ascending Node — where the orbit crosses the equator going northward, measured from the vernal equinox.
              </TLEAnnotation>
              <TLEAnnotation label="Eccentricity" color="bg-emerald-400">
                How elliptical the orbit is (0 = perfect circle, 1 = parabolic). Most LEO satellites aim for near-zero eccentricity.
              </TLEAnnotation>
              <TLEAnnotation label="Mean Motion" color="bg-white">
                Revolutions per day. ISS orbits at ~15.49 rev/day, completing one orbit roughly every 92 minutes.
              </TLEAnnotation>
            </div>
          </Card>

          <Card>
            <div className="flex gap-3">
              <Database className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Where do TLEs come from?</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The US Space Force's 18th Space Control Squadron operates a global network of
                  radar and optical sensors that continuously track orbital objects. The observations
                  are processed using orbit determination software to produce updated TLEs, published
                  publicly through <span className="text-yellow-400">Space-Track.org</span>. This
                  tracker fetches fresh TLEs for each prediction so the orbital positions are always
                  based on the latest available data.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* HOW PREDICTIONS WORK                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-black/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Steps */}
            <div>
              <SectionLabel>The Engine</SectionLabel>
              <SectionHeading>How a prediction works</SectionHeading>
              <p className="text-gray-300 mb-10 leading-relaxed">
                Every prediction runs a four-stage pipeline from raw orbital data
                to a calibrated risk classification.
              </p>

              <div>
                <StepCard
                  number="1"
                  icon={Database}
                  title="Fetch TLE data from Space-Track"
                  body="The tracker authenticates with Space-Track.org and retrieves the most recently published TLE for each satellite. This ensures the prediction uses current orbital parameters, not stale cached data."
                />
                <StepCard
                  number="2"
                  icon={Satellite}
                  title="SGP4 orbital propagation"
                  body="The Simplified General Perturbations model 4 (SGP4) integrates the equations of motion forward in time, accounting for Earth's oblateness, atmospheric drag, and other perturbations. Both satellites are propagated at 5-minute intervals across a 7-day window — 2,016 position samples each."
                />
                <StepCard
                  number="3"
                  icon={GitBranch}
                  title="Refine to 1-second precision"
                  body="The coarse pass identifies the approximate Time of Closest Approach (TCA). A second fine-grained pass re-propagates both satellites at 1-second steps in a ±10 minute window around the coarse TCA, yielding a precise miss distance in kilometres."
                />
                <StepCard
                  number="4"
                  icon={Brain}
                  title="ML risk classification"
                  body="A Random Forest classifier trained on 15,000 synthetic conjunction events evaluates five features — miss distance, relative velocity, altitude, collision probability, and time to TCA — and outputs a HIGH / MEDIUM / LOW risk label with per-class confidence scores."
                />
              </div>
            </div>

            {/* Concepts panel */}
            <div className="space-y-6">
              <SectionLabel>Key Concepts</SectionLabel>

              <Card>
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Miss Distance
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The minimum separation between two objects at the Time of Closest Approach.
                  Industry thresholds: conjunctions inside <span className="text-white font-medium">1 km</span> are
                  screened, inside <span className="text-white font-medium">200 m</span> may trigger
                  a maneuver decision. An actual physical collision requires a miss distance smaller
                  than the combined object size — typically a few metres.
                </p>
              </Card>

              <Card>
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Collision Probability
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Computed using a 2D Gaussian model in the encounter plane. It combines the miss
                  distance with the combined positional uncertainty (how well we know both objects'
                  locations) and the combined cross-sectional area. Values above
                  <span className="text-white font-medium"> 1-in-10,000</span> are generally
                  considered operationally significant.
                </p>
              </Card>

              <Card>
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Relative Velocity
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The speed at which the two objects approach each other at TCA, derived directly
                  from SGP4 velocity vectors. Impacts above approximately
                  <span className="text-white font-medium"> 3 km/s</span> exceed the Whipple shield
                  threshold — the energy is sufficient to shatter both objects rather than dent them,
                  generating thousands of new trackable fragments.
                </p>
              </Card>

              <Card>
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Why Machine Learning?
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  The Gaussian probability formula treats all conjunctions identically. The ML model
                  learns non-linear interactions — for instance, a 500 m miss at 14 km/s in LEO is
                  operationally very different from 500 m at 0.5 km/s in GEO. The classifier was
                  trained on synthetic events spanning all orbit regimes and velocity ranges,
                  then tested on a held-out set to validate accuracy.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* UNDERSTANDING RESULTS                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <SectionLabel>Results Guide</SectionLabel>
          <SectionHeading>Understanding your risk report</SectionHeading>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Every prediction produces a detailed report. Here is what each value means.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LOW */}
          <Card className="border-green-500/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold mb-4">
              LOW Risk
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Miss distance is large or probability is below 1-in-1,000,000. No action
              required. The conjunction is within normal day-to-day screening parameters.
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Miss distance &gt; 1 km</p>
              <p>Probability &lt; 0.0001%</p>
            </div>
          </Card>

          {/* MEDIUM */}
          <Card className="border-yellow-500/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-bold mb-4">
              MEDIUM Risk
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              An elevated conjunction worth close monitoring. Satellite operators
              are typically notified and may begin preliminary maneuver planning
              while awaiting updated TLEs closer to the event.
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Miss distance 200 m – 1 km</p>
              <p>Probability 0.0001% – 0.1%</p>
            </div>
          </Card>

          {/* HIGH */}
          <Card className="border-red-500/20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold mb-4">
              HIGH Risk
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              A serious conjunction alert. At this level, real satellite operators
              would convene a conjunction screening review and likely execute an
              avoidance maneuver if the spacecraft has propulsion capability.
            </p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Miss distance &lt; 200 m</p>
              <p>Probability &gt; 0.1%</p>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-24 px-4 bg-black/60 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>Get Started</SectionLabel>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Run your first<br />
            <span className="text-yellow-400">conjunction analysis</span>
          </h2>
          <p className="text-gray-300 mb-10 leading-relaxed">
            Create a free account and enter any two NORAD IDs to get a real-time
            orbital collision risk report in under 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {authed ? (
              <button
                onClick={() => router.push('/predict')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-semibold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20"
              >
                Go to Dashboard <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <>
                <Link href="/register">
                  <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-xl font-semibold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/20 w-full">
                    Create Free Account <ChevronRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="px-8 py-4 bg-white/5 backdrop-blur border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all w-full">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>

          <p className="text-gray-500 text-sm mt-6">
            Example NORAD IDs to try: 25544 (ISS) · 20580 (Hubble) · 43013 (Starlink-1)
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 border-t border-white/10 py-6 px-4 text-center text-gray-500 text-sm">
        <p>Orbital Debris Tracker · Orbital data sourced from Space-Track.org</p>
      </footer>

    </div>
  );
}
