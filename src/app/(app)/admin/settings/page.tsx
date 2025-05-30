import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, BellDot, Lock, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="System Settings"
        description="Configure global settings for the FSP portal."
        icon={Settings}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellDot className="h-5 w-5 text-primary" /> Notification Settings</CardTitle>
            <CardDescription>Manage system-wide notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enable or disable email notifications for all users.
                </span>
              </Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="batch-updates" className="flex flex-col space-y-1">
                <span>Batch Update Alerts</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Notify students and teachers of batch changes.
                </span>
              </Label>
              <Switch id="batch-updates" defaultChecked />
            </div>
            <Button className="w-full">Save Notification Settings</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Security Settings</CardTitle>
            <CardDescription>Manage portal security configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
              <Label htmlFor="mfa" className="flex flex-col space-y-1">
                <span>Multi-Factor Authentication</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Require MFA for admin and teacher accounts.
                </span>
              </Label>
              <Switch id="mfa" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="session-timeout" className="flex flex-col space-y-1">
                <span>Session Timeout (minutes)</span>
                 <span className="font-normal leading-snug text-muted-foreground">
                  Set idle session timeout duration.
                </span>
              </Label>
              <input type="number" defaultValue="30" className="w-20 p-1 border rounded-md text-sm" />
            </div>
            <Button className="w-full">Save Security Settings</Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Appearance Settings</CardTitle>
            <CardDescription>Customize portal appearance (Branding options).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Appearance settings (e.g., logo upload, theme color adjustments) are currently managed via theme files. Advanced customization options will be available here in future updates.
             </p>
             <Button className="w-full" disabled>Update Appearance (Coming Soon)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const metadata = {
  title: "System Settings - AEC FSP Portal",
};
