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
        title="Configurações"
        description="Preferências deste dispositivo."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
          <CardDescription>Escolha a aparência da interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceSettings />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados</CardTitle>
          <CardDescription>
            Onde seus registros ficam guardados, e uma cópia em JSON de todos
            eles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSettings />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
