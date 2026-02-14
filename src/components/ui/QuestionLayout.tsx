import { type ReactNode } from 'react';

interface QuestionLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

/**
 * Reusable layout wrapper for question screens
 */
export function QuestionLayout({ title, description, children }: QuestionLayoutProps) {
  return (
    <div className="space-y-6 flex-1">
      <div className="space-y-3">
        <h2 className="text-[#304e5d] font-oswald text-3xl text-left font-bold uppercase">
          {title}
        </h2>
        <p className="text-gray-600 text-lg text-left">
          {description}
        </p>
      </div>

      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
