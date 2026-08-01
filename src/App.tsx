import {
  ClipboardPaste,
  Contact,
  Download,
  FileSpreadsheet,
  Hash,
  Loader2,
  Palette,
  Pencil,
  Settings2
} from 'lucide-react';

import { CsvInput } from '@/components/generator/CsvInput';
import { LivePreview } from '@/components/generator/LivePreview';
import { ManualInput } from '@/components/generator/ManualInput';
import { OutputOptions } from '@/components/generator/OutputOptions';
import { PasteInput } from '@/components/generator/PasteInput';
import { SequenceInput } from '@/components/generator/SequenceInput';
import { StyleOptions } from '@/components/generator/StyleOptions';
import { TypedInput } from '@/components/generator/TypedInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
    <div className="mx-auto flex w-[90%] max-w-[900px] flex-col gap-5 py-8">
      <Card>
        <CardContent>
          <Tabs value={g.inputMode} onValueChange={(value) => g.setInputMode(value as InputMode)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="csv">
                <FileSpreadsheet />
                <span className="hidden sm:inline">Upload</span> CSV
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Pencil />
                Manual
              </TabsTrigger>
              <TabsTrigger value="paste">
                <ClipboardPaste />
                Paste
              </TabsTrigger>
              <TabsTrigger value="sequence">
                <Hash />
                Sequence
              </TabsTrigger>
              <TabsTrigger value="types">
                <Contact />
                Wi-Fi &amp; more
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv">
              <CsvInput
                sheetFile={g.sheetFile}
                sheetHeaders={g.sheetHeaders}
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

            <TabsContent value="sequence">
              <SequenceInput
                sequence={g.sequence}
                updateSequence={g.updateSequence}
                count={g.sequenceCount}
              />
            </TabsContent>

            <TabsContent value="types">
              <TypedInput setPayload={g.setTypedPayload} setName={g.setTypedName} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <Card>
          <CardTitle>
            <Palette className="size-4 text-primary" />
            Appearance
          </CardTitle>
          <CardContent>
            <StyleOptions
              foreground={g.foreground}
              setForeground={g.setForeground}
              background={g.background}
              setBackground={g.setBackground}
              logo={g.logo}
              setLogo={g.setLogo}
              onError={g.setStatus}
            />
          </CardContent>
        </Card>

        <div className="md:w-56">
          <LivePreview preview={g.preview} itemCount={g.itemCount} />
        </div>
      </div>

      <Card>
        <CardTitle>
          <Settings2 className="size-4 text-primary" />
          Output
        </CardTitle>
        <CardContent>
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
            logoActive={Boolean(g.logo)}
          />

          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={g.handleGenerate}
            disabled={!g.canGenerate || g.isProcessing}
          >
            {g.isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
            {g.isProcessing
              ? 'Processing…'
              : `Generate ${g.itemCount > 0 ? g.itemCount : ''} QR Code${g.itemCount === 1 ? '' : 's'}`}
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
