import { useParams } from 'wouter';
import RoadmapViewer from '../../pages/RoadmapViewer';

export default function SuperAdminRoadmapViewerPage() {
  const params = useParams<{ tenantId: string }>();
  
  return <RoadmapViewer tenantId={params.tenantId} />;
}
