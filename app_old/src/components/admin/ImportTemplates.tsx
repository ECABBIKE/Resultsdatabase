import Button from '../Button';

interface Template {
  name: string;
  filename: string;
  format: string;
  description: string;
  icon: string;
  fields: string[];
}

const templates: Template[] = [
  {
    name: 'DH - Seedning/Kval',
    filename: 'DH_Seedning_Kval.csv',
    format: 'Downhill',
    description: 'För seedning och kvalruns som ger kvalpoäng. Inkluderar upp till 4 splittider.',
    icon: '🏔️',
    fields: ['run_type (seeding/qualification)', 'split1-split4', 'bib_number', 'total_time'],
  },
  {
    name: 'DH - Final',
    filename: 'DH_Final.csv',
    format: 'Downhill',
    description: 'För final runs med placering och kvalpoäng enligt final-mall. Inkluderar upp till 4 splittider.',
    icon: '🏆',
    fields: ['run_type (final)', 'split1-split4', 'bib_number', 'total_time'],
  },
  {
    name: 'DH - Två åk (bästa räknas)',
    filename: 'DH_Tva_Ak.csv',
    format: 'Downhill',
    description: 'För DH där båda åk körs och snabbaste åket ger placering. Varje åkare har 2 rader i CSV.',
    icon: '🎿',
    fields: ['run_number (1 eller 2)', 'run_type (run1/run2)', 'split1-split4', 'bib_number'],
  },
  {
    name: 'Enduro',
    filename: 'Enduro.csv',
    format: 'Enduro',
    description: 'För enduro-tävlingar med upp till 15 stages. Total tid är summan av alla stages.',
    icon: '🚵',
    fields: ['stage1-stage15', 'total_time', 'bib_number'],
  },
];

export default function ImportTemplates() {
  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.BASE_URL}templates/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    templates.forEach((template) => {
      setTimeout(() => handleDownload(template.filename), 100);
    });
  };

  const handleDownloadDocumentation = () => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.BASE_URL}templates/README.md`;
    link.download = 'Import-Guide.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Importmallar</h3>
          <p className="text-sm text-gray-400 mt-1">
            Ladda ner CSV-mallar för att importera resultat korrekt
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadDocumentation}
            icon={<span>📖</span>}
          >
            Dokumentation
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadAll}
            icon={<span>📦</span>}
          >
            Ladda ner alla
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.filename}
            className="card p-5 hover:border-primary-600/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">{template.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white mb-1">{template.name}</h4>
                <div className="inline-block px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded mb-2">
                  {template.format}
                </div>
                <p className="text-sm text-gray-400 mb-3">{template.description}</p>

                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Extra fält:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.fields.map((field, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-dark-700 text-gray-300 text-xs rounded"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(template.filename)}
                  icon={<span>⬇️</span>}
                  fullWidth
                >
                  Ladda ner {template.filename}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="card p-6 bg-gradient-to-br from-gsblue-600/10 to-primary-500/10 border-primary-500/20">
        <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Viktigt att veta</span>
        </h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-primary-400 flex-shrink-0">•</span>
            <span>
              <strong>Obligatoriska fält:</strong> position, first_name (förnamn), last_name (efternamn), class (klass), status
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400 flex-shrink-0">•</span>
            <span>
              <strong>Tidsformat:</strong> HH:MM:SS.mmm eller MM:SS.mmm (t.ex. 00:02:34.567)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400 flex-shrink-0">•</span>
            <span>
              <strong>UCI ID:</strong> Rekommenderas för att undvika dubbletter (t.ex. SWE19920315)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400 flex-shrink-0">•</span>
            <span>
              <strong>Status-koder:</strong> FIN (målgång), DNF (brutit), DNS (startade ej), DSQ (diskad)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400 flex-shrink-0">•</span>
            <span>
              <strong>Delimiter:</strong> Stödjer komma (,), semikolon (;) och tab (\t)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary-400 flex-shrink-0">•</span>
            <span>
              <strong>Två åk (DH):</strong> Varje åkare har 2 rader med samma position men olika run_number
            </span>
          </li>
        </ul>
      </div>

      {/* Example preview */}
      <div className="card p-6">
        <h4 className="text-base font-bold text-white mb-3">Exempel: DH Seedning</h4>
        <div className="bg-dark-800 rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-gray-300 font-mono">
            <code>{`position,first_name,last_name,club,class,uci_id,bib_number,total_time,split1,split2,split3,split4,status,run_type
1,Erik,Andersson,Järvsö CK,Elite Men,SWE19920315,101,00:02:34.567,00:00:45.123,00:00:52.234,00:00:35.678,00:00:21.532,FIN,seeding
2,Anna,Karlsson,Stockholm MTB,Elite Women,SWE19950612,102,00:02:36.789,00:00:46.234,00:00:53.123,00:00:36.234,00:00:21.198,FIN,seeding`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
