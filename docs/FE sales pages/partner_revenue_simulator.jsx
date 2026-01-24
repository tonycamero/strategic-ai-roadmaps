import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PartnerRevenueSimulator() {
  const [certifiedOperators, setCertifiedOperators] = useState(5);
  const [clientsPerOperator, setClientsPerOperator] = useState(10);

  const roadmapRevenuePerClient = 5000;
  const saasRevenuePerClient = 459 * 12; // Annual SaaS, includes TrustConsole

  const totalClients = certifiedOperators * clientsPerOperator;

  const totalRoadmapRevenue = totalClients * roadmapRevenuePerClient;
  const totalSaaSRevenue = totalClients * saasRevenuePerClient;

  const totalGrossRevenue = totalRoadmapRevenue + totalSaaSRevenue;
  const partnerTake = totalGrossRevenue * 0.5;
  const strategicAITake = totalGrossRevenue * 0.5;

  return (
    <div className="grid gap-6 p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">Partner Revenue Simulator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Certified Operators</Label>
          <Input
            type="number"
            value={certifiedOperators}
            onChange={(e) => setCertifiedOperators(Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Clients per Operator</Label>
          <Input
            type="number"
            value={clientsPerOperator}
            onChange={(e) => setClientsPerOperator(Number(e.target.value))}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6 grid gap-2">
          <div className="text-lg font-semibold">Simulated Results</div>
          <div>Total Clients: {totalClients.toLocaleString()}</div>
          <div>Roadmap Revenue: ${totalRoadmapRevenue.toLocaleString()}</div>
          <div>SaaS Revenue (incl. TrustConsole): ${totalSaaSRevenue.toLocaleString()}</div>
          <hr />
          <div className="font-medium text-green-700">Partner Take: ${partnerTake.toLocaleString()}</div>
          <div className="text-muted-foreground">StrategicAI Take: ${strategicAITake.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}
