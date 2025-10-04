import BrowseTabs from './tabs';
import CurrentBuildPanel from './current-build-panel';

export default function BrowsePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Browse Parts</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BrowseTabs />
        </div>
        <div className="space-y-4">
          <CurrentBuildPanel />
        </div>
      </div>
    </div>
  );
}
