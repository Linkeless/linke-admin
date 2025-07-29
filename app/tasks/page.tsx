import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function TasksPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Tasks" 
        description="Here's a list of your tasks for this month!"
      >
        <Button variant="outline" size="sm">
          Import
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-sm">Filter tasks...</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Priority</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Manage your tasks efficiently with our dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">TASK-8762</p>
                    <p className="text-sm text-muted-foreground">
                      You can't compress the program without quantifying the open-source...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">In Progress</Badge>
                    <Badge>Medium</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">TASK-7878</p>
                    <p className="text-sm text-muted-foreground">
                      Try to calculate the EXE feed, maybe it will index the multi-byte pixel!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Backlog</Badge>
                    <Badge>Medium</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">TASK-7839</p>
                    <p className="text-sm text-muted-foreground">
                      We need to bypass the neural TCP card!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Todo</Badge>
                    <Badge variant="destructive">High</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}