import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppearancePage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="外观设置" 
        description="自定义应用外观和主题"
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>主题设置</CardTitle>
              <CardDescription>
                选择您喜欢的主题和外观
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                外观设置正在开发中...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}