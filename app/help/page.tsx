import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="帮助中心" 
        description="获取使用帮助和支持"
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>帮助文档</CardTitle>
              <CardDescription>
                查看常见问题和使用指南
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                帮助内容正在开发中...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}