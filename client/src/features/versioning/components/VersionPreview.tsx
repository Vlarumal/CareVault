import React, { useEffect } from 'react';
import { Entry } from '../../../types';
import EntryDetails from '../../../components/PatientPage/EntryDetails';

interface VersionPreviewProps {
  entry: unknown;
  patientId: string;
  onLoad: () => void;
}

const VersionPreview: React.FC<VersionPreviewProps> = ({ entry, patientId, onLoad }) => {
  useEffect(() => {
    onLoad();
  }, []);

  const entryData = entry as Entry;

  return (
    <div className="version-preview">
      <EntryDetails
        entry={entryData}
        patientId={patientId}
        onEditEntry={() => {}}
        onDeleted={() => {}}
      />
    </div>
  );
};

export default VersionPreview;