'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Cloud, Info, HardDrive, Download } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';

export default function BackupPage() {
  const { state, isLoaded } = useAppContext();

  const handleDownload = () => {
    const dataToDownload = {
      user: state.user,
      ganhos: state.ganhos,
      despesas: state.despesas,
      goals: state.goals,
      colorCache: state.colorCache,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToDownload, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "meu_saldo_ia_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };


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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5"/> Exportar Meus Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground mb-4">
            Clique no botão abaixo para baixar um arquivo JSON contendo todos os seus dados (ganhos, despesas, metas e configurações).
          </p>
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4"/> Fazer Download dos Dados
          </Button>
        </CardContent>
      </Card>

      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Atenção!</AlertTitle>
        <AlertDescription>
          Seus dados estão salvos apenas neste navegador. Se você limpar o cache, usar outro navegador ou dispositivo, seus dados serão perdidos. Considere fazer backups regulares.
        </AlertDescription>
      </Alert>
    </div>
  );
}
