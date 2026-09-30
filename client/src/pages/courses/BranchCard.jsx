import { useIntlayer } from 'react-intlayer';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';

/**
 * Branch card displayed inside a track detail page
 */
export default function BranchCard({ branch, enrolledCount = 0, isEnrolled = false }) {
  const content = useIntlayer('courses');

  return (
    <div className="flex items-center gap-4 bg-surface-lowest border border-outline rounded-xl p-5 hover:shadow-elevation-2 transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-ink-navy to-secondary-900 flex items-center justify-center shrink-0">
        <HiOutlineBuildingOffice2 className="w-6 h-6 text-white" strokeWidth={1.5} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-heading-6 text-neutral-900 truncate">
          {branch.name}
        </h4>
        <p className="text-body-2 text-neutral-500 mt-1">
          {enrolledCount} {content.enrolledCount.value}
        </p>
      </div>

      {isEnrolled && (
        <span className="px-3 py-1 bg-success/10 text-success text-caption font-medium rounded-full">
          {content.enrolled.value}
        </span>
      )}
    </div>
  );
}
