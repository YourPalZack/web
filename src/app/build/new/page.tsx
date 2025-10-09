import type { Metadata } from 'next';
import NewBuildPageView from './page-view';

export const metadata: Metadata = {
  title: 'New Build',
  description: 'Start a new aquarium build and get recommendations.',
  alternates: { canonical: '/build/new' },
};

export default function NewBuildPage() {
  return <NewBuildPageView />;
}

