import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LogsPage() {
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: api.listLogs
  });
  
  const { data: logContent, isLoading: isLoadingContent } = useQuery({
    queryKey: ['log-content', selectedLog],
    queryFn: () => api.downloadLog(selectedLog!),
    enabled: !!selectedLog
  });
  
  const handleDownload = async (filename: string) => {
    try {
      const content = await api.downloadLog(filename);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.split('/').pop() || 'log.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading log:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }
  
  const files = logsData?.files || [];
  const filteredFiles = files.filter(f => 
    f.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredContent = logContent 
    ? logContent.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logs</h1>
        <p className="text-muted-foreground mt-2">
          Consultez et téléchargez les fichiers de logs
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans les logs..."
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Liste des fichiers */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Fichiers de logs</CardTitle>
            <CardDescription>{files.length} fichier{files.length > 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {files.length === 0 ? 'Aucun fichier de log' : 'Aucun résultat'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map(file => {
                  const [date, name] = file.split('/');
                  return (
                    <div
                      key={file}
                      onClick={() => setSelectedLog(file)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLog === file
                          ? 'bg-secondary border-primary'
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Contenu du fichier */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contenu</CardTitle>
                <CardDescription>
                  {selectedLog ? selectedLog : 'Sélectionnez un fichier'}
                </CardDescription>
              </div>
              {selectedLog && (
                <Button size="sm" onClick={() => handleDownload(selectedLog)}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedLog ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un fichier pour voir son contenu
                </p>
              </div>
            ) : isLoadingContent ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">
                    {filteredContent.length} ligne{filteredContent.length > 1 ? 's' : ''}
                    {searchTerm && ` (filtrées)`}
                  </Badge>
                </div>
                <div className="bg-muted rounded-lg p-4 max-h-[600px] overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {filteredContent.length > 0 ? (
                      filteredContent.map((line, i) => (
                        <div key={i} className="hover:bg-background/50 px-2 py-1 rounded">
                          {line}
                        </div>
                      ))
                    ) : searchTerm ? (
                      <div className="text-muted-foreground text-center py-8">
                        Aucune ligne ne correspond à votre recherche
                      </div>
                    ) : (
                      logContent
                    )}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}