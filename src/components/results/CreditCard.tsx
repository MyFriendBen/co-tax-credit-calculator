import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface CreditCardProps {
  title: string;
  status: 'eligible' | 'ineligible' | 'maybe';
  estimatedBenefit: number;
  explanation: string;
  reasons: string[];
}

const STATUS_BASE_CONFIG = {
  eligible: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    labelKey: 'results.status.eligibleLabel',
  },
  ineligible: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    badge: 'bg-gray-200 text-gray-700',
    icon: XCircle,
    labelKey: 'results.status.ineligibleLabel',
  },
  maybe: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    icon: AlertCircle,
    labelKey: 'results.status.maybeLabel',
  },
};

export const CreditCard = memo(function CreditCard({
  title,
  status,
  estimatedBenefit,
  explanation,
  reasons,
}: CreditCardProps) {
  const { t, i18n } = useTranslation();
  const config = STATUS_BASE_CONFIG[status];
  const StatusIcon = config.icon;
  const formattedBenefit = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(estimatedBenefit);

  return (
    <Card className={`p-6 ${config.bg} ${config.border}`}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <h4 className="text-gray-900 font-oswald text-xl font-bold">{title}</h4>
          <span
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded ${config.badge} whitespace-nowrap self-start`}
          >
            <StatusIcon className="h-4 w-4" />
            {t(config.labelKey)}
          </span>
        </div>

        {status === 'eligible' && estimatedBenefit > 0 && (
          <div className="text-3xl text-[#304e5d] font-oswald">
            {t('results.upToAmount', { amount: formattedBenefit })}
          </div>
        )}

        <p className="text-gray-700">{explanation}</p>

        {reasons.length > 0 && (
          <div className="pt-3 border-t border-gray-300">
            <ul className="space-y-2">
              {reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
});
