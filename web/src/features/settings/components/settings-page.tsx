import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";

export function SettingsPage() {
  return (
    <PageContainer>
      <PageHeading
        title="Settings"
        description="Preferences for this device."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose how the interface looks.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceSettings />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
