import axios from 'axios';
import { DiagnosisEntry } from '../types';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';

const getAllDiagnoses = async () => {
  const diagnoses = await apiRetry(() =>
    axios.get<DiagnosisEntry[]>(`${apiBaseUrl}/diagnoses`).then(res => res.data)
  );

  
  const codesSet = new Set();
  const duplicates = diagnoses.filter(diagnosis => {
    if (codesSet.has(diagnosis.code)) {
      console.warn(`Duplicate diagnosis code found: ${diagnosis.code}`);
      return true;
    }
    codesSet.add(diagnosis.code);
    return false;
  });

  if (duplicates.length > 0) {
    console.error('Duplicate diagnosis codes detected:', duplicates.map(d => d.code));
    
    const uniqueDiagnoses = diagnoses.filter((diagnosis, index, self) =>
      index === self.findIndex(d => d.code === diagnosis.code)
    );
    return uniqueDiagnoses;
  }

  return diagnoses;
};

const getDiagnosisByCode = async (code: string) => {
  return apiRetry(() =>
    axios.get<DiagnosisEntry>(`${apiBaseUrl}/diagnoses/${code}`).then(res => res.data)
  );
};

export default {
  getAllDiagnoses,
  getDiagnosisByCode,
};
