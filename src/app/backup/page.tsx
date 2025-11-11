'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Cloud, Info, HardDrive } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

export default function BackupPage() {
  const { isLoaded } = useAppContext();

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-primary flex items-center gap-2">
        <Cloud className="h-6 w-6" /> Backup e Sincronização
      </h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" /> Status do Armazenamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Status: <strong className="text-destructive">Usando Armazenamento Local (Offline).</strong>
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Seu ID de Usuário (Local):
          </p>
          <code className="mt-1 block bg-muted p-2 rounded-md text-xs break-all">
            {isLoaded ? 'DADOS_SALVOS_NO_NAVEGADOR' : 'Carregando...'}
          </code>
        </CardContent>
      </Card>
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Atenção!</AlertTitle>
        <AlertDescription>
          Seus dados estão salvos apenas neste navegador. Se você limpar o cache, usar outro navegador ou dispositivo, seus dados serão perdidos.
        </AlertDescription>
      </Alert>
    </div>
  );
}
