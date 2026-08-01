import { ClipboardPaste, Download, FileSpreadsheet, Loader2, Pencil } from 'lucide-react';

import { CsvInput } from '@/components/generator/CsvInput';
import { ManualInput } from '@/components/generator/ManualInput';
import { OutputOptions } from '@/components/generator/OutputOptions';
import { PasteInput } from '@/components/generator/PasteInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQrGenerator } from '@/hooks/useQrGenerator';
import type { InputMode } from '@/lib/types';

// The page <h1>, tagline, guides and FAQ live in index.html as static markup so
// crawlers see them without executing JavaScript. Only the tool renders here.
export default function App() {
  const g = useQrGenerator();

  const isError = g.status.startsWith('Error') || g.status.startsWith('Please');
  const isSuccess = g.status.startsWith('Success');

  return (
    <div className="mx-auto w-[90%] max-w-[900px] py-8">
      <Card>
        <CardContent>
          <Tabs value={g.inputMode} onValueChange={(value) => g.setInputMode(value as InputMode)}>
            <TabsList>
              <TabsTrigger value="csv">
                <FileSpreadsheet />
                Upload CSV
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Pencil />
                Enter manually
              </TabsTrigger>
              <TabsTrigger value="paste">
                <ClipboardPaste />
                Paste a list
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv">
              <CsvInput
                csvFile={g.csvFile}
                csvHeaders={g.csvHeaders}
                urlColumn={g.urlColumn}
                setUrlColumn={g.setUrlColumn}
                filenameColumn={g.filenameColumn}
                setFilenameColumn={g.setFilenameColumn}
                filenamePrefix={g.filenamePrefix}
                setFilenamePrefix={g.setFilenamePrefix}
                onFileChange={g.handleFileChange}
              />
            </TabsContent>

            <TabsContent value="manual">
              <ManualInput
                entries={g.manualEntries}
                updateEntry={g.updateManualEntry}
                addEntry={g.addManualEntry}
                removeEntry={g.removeManualEntry}
              />
            </TabsContent>

            <TabsContent value="paste">
              <PasteInput value={g.pastedList} onChange={g.setPastedList} count={g.pastedCount} />
            </TabsContent>
          </Tabs>

          <hr className="border-border" />

          <OutputOptions
            qrPerImage={g.qrPerImage}
            setQrPerImage={g.setQrPerImage}
            includeLabels={g.includeLabels}
            setIncludeLabels={g.setIncludeLabels}
            outputFormat={g.outputFormat}
            setOutputFormat={g.setOutputFormat}
            qrSize={g.qrSize}
            setQrSize={g.setQrSize}
            errorLevel={g.errorLevel}
            setErrorLevel={g.setErrorLevel}
            svgAvailable={g.svgAvailable}
          />

          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={g.handleGenerate}
            disabled={!g.canGenerate || g.isProcessing}
          >
            {g.isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
            {g.isProcessing ? 'Processing…' : 'Generate QR Codes'}
          </Button>

          {g.status && (
            <p
              role="status"
              className={
                isError
                  ? 'text-sm text-destructive'
                  : isSuccess
                    ? 'text-sm font-medium text-success'
                    : 'text-sm text-muted-foreground'
              }
            >
              {g.status}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
