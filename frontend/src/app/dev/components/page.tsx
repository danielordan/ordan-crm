import { notFound } from 'next/navigation';
import { ComponentsPreview } from './ComponentsPreview';

// Development-only preview of the design system. Not part of the product.
export default function DevComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ComponentsPreview />;
}
