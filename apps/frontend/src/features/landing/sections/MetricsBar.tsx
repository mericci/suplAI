import { AnimatedCounter } from '../components/AnimatedCounter';
import { FadeIn } from '../components/FadeIn';

const METRICS = [
  { value: '-80%', label: 'menos tiempo vs. proceso manual' },
  { value: '+5.000', label: 'facturas sincronizadas del SII' },
  { value: '95%', label: 'de facturas validadas automáticamente' },
  { value: 'Ilimitados', label: 'proveedores con contratos centralizados' },
];

export function MetricsBar(): React.JSX.Element {
  return (
    <div
      className="w-full"
      style={{ borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#e9e8e4' }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x py-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            {METRICS.map((metric) => (
              <AnimatedCounter key={metric.value} value={metric.value} label={metric.label} />
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
