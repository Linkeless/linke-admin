import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="账户设置" 
        description="管理您的账户配置"
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>账户配置</CardTitle>
              <CardDescription>
                修改账户相关设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                账户设置正在开发中...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}