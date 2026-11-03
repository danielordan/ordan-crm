import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

// Previous / Next only: no page numbers and no total count (PRD 4.2, DESIGN 1.6)
export function Pagination({ hasPrevious, hasNext, onPrevious, onNext }: PaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex justify-end gap-2">
      <Button
        variant="secondary"
        icon={<ChevronLeft />}
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <Button variant="secondary" disabled={!hasNext} onClick={onNext} className="flex-row-reverse">
        <ChevronRight aria-hidden="true" className="size-4" />
        Next
      </Button>
    </nav>
  );
}
