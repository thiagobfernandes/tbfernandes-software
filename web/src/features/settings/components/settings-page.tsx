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
import { DataSettings } from "@/features/settings/components/data-settings";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
          <CardDescription>
            Where your records are kept, and a JSON copy of all of them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSettings />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
