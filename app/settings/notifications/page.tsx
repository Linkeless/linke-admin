import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="通知设置" 
        description="管理您的通知偏好"
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知偏好</CardTitle>
              <CardDescription>
                设置您希望接收的通知类型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                通知设置正在开发中...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}