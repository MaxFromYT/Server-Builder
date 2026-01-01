import { useGame } from "@/lib/game-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow, format } from "date-fns";
import { AlertCircle, Clock, Server, CheckCircle2 } from "lucide-react";

const severityConfig = {
  P1: { color: "bg-noc-red", label: "Critical" },
  P2: { color: "bg-noc-yellow", label: "High" },
  P3: { color: "bg-noc-blue", label: "Medium" },
  P4: { color: "bg-muted", label: "Low" },
};

const statusConfig = {
  open: { color: "text-noc-red", label: "Open" },
  investigating: { color: "text-noc-yellow", label: "Investigating" },
  mitigating: { color: "text-noc-cyan", label: "Mitigating" },
  resolved: { color: "text-noc-green", label: "Resolved" },
};

export function IncidentPanel() {
  const { incidents, updateIncidentStatus } = useGame();

  if (incidents.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-full bg-card/50 backdrop-blur-sm p-8" data-testid="incident-panel-empty">
        <CheckCircle2 className="w-16 h-16 text-noc-green mb-4" />
        <h3 className="font-display text-lg font-semibold">All Systems Operational</h3>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          No active incidents. Your data center is running smoothly.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="incident-panel">
      {incidents.map((incident) => (
        <Card key={incident.id} className="bg-card/50 backdrop-blur-sm overflow-hidden" data-testid={`incident-${incident.id}`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${severityConfig[incident.severity].color}`} />
                <div>
                  <h3 className="font-semibold">{incident.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(incident.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {incident.severity}
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-mono ${statusConfig[incident.status].color}`}
                >
                  {statusConfig[incident.status].label}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start px-4 pt-2 bg-transparent">
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="affected" className="text-xs">Affected Systems</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-4 pt-2">
              <p className="text-sm">{incident.description}</p>
            </TabsContent>

            <TabsContent value="timeline" className="p-4 pt-2">
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {incident.timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        {idx < incident.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(entry.timestamp), "HH:mm:ss")} - {entry.actor}
                        </p>
                        <p className="mt-0.5">{entry.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="affected" className="p-4 pt-2">
              <div className="flex flex-wrap gap-2">
                {incident.affectedSystems.map((system) => (
                  <Badge key={system} variant="outline" className="font-mono">
                    <Server className="w-3 h-3 mr-1" />
                    {system}
                  </Badge>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="p-4 pt-2">
              <div className="flex flex-wrap gap-2">
                {incident.status !== "investigating" && incident.status !== "resolved" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateIncidentStatus(incident.id, "investigating")}
                    data-testid={`button-investigate-${incident.id}`}
                  >
                    Start Investigation
                  </Button>
                )}
                {incident.status === "investigating" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateIncidentStatus(incident.id, "mitigating")}
                    data-testid={`button-mitigate-${incident.id}`}
                  >
                    Begin Mitigation
                  </Button>
                )}
                {incident.status === "mitigating" && (
                  <Button
                    size="sm"
                    onClick={() => updateIncidentStatus(incident.id, "resolved")}
                    data-testid={`button-resolve-${incident.id}`}
                  >
                    Mark Resolved
                  </Button>
                )}
                {incident.status === "resolved" && (
                  <Badge variant="secondary" className="text-noc-green">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Incident Resolved
                  </Badge>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      ))}
    </div>
  );
}
