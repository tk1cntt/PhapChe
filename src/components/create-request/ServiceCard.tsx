'use client';

export interface ServiceOption {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  tags: Array<{ label: Record<string, string>; variant: 'green' | 'blue' | 'orange' | 'purple' | 'red' }>;
  estimatedTime?: Record<string, string>;
}

interface ServiceCardProps {
  service: ServiceOption;
  selected: boolean;
  onSelect: () => void;
  locale?: string;
}

const tagStyles = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-700',
};

export default function ServiceCard({ service, selected, onSelect, locale = 'vi' }: ServiceCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all
        ${selected 
          ? 'border-teal-600 bg-emerald-50 shadow-sm' 
          : 'border-slate-200 hover:border-teal-400/35 hover:bg-slate-50'}`}
    >
      <div className="flex items-start gap-4">
        {/* Radio circle */}
        <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
          ${selected ? 'border-emerald-500' : 'border-slate-300'}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">{service.title[locale] || service.title.vi}</h4>
          <p className="text-sm text-slate-500 leading-relaxed mb-3">{service.description[locale] || service.description.vi}</p>
          
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {service.tags.map((tag) => (
              <span 
                key={tag.label.vi}
                className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-bold whitespace-nowrap ${tagStyles[tag.variant]}`}
              >
                {tag.label[locale] || tag.label.vi}
              </span>
            ))}
            {service.estimatedTime && (
              <span className="inline-flex items-center h-7 px-3 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {service.estimatedTime[locale] || service.estimatedTime.vi}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
