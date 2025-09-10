import { DashboardControls } from './dashboard-controls';
import { Disclaimer } from '@/components/footer';

import { AssetOverview } from './asset-overview';

export default function DataVisualization() {
  return (
    <>
      <>
        <div className="container mx-auto py-8 px-4 relative">
          <h1 className="text-3xl font-bold mb-8">자산 대시보드</h1>

          <DashboardControls />

          <div className="grid gap-8">
            <AssetOverview />

            <Disclaimer />
          </div>
        </div>
      </>
    </>
  );
}
