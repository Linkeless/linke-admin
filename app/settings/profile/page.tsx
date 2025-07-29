import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="个人资料" 
        description="管理您的个人信息"
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>个人信息</CardTitle>
              <CardDescription>
                更新您的个人资料信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                个人资料设置正在开发中...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}