import diagnoses from '../../data/diagnoses';

import { DiagnosisEntry } from '../types';

const getEntries = (): DiagnosisEntry[] => {
  return diagnoses;
};

const findByCode = (code: string): DiagnosisEntry | undefined => {
  const diagnosis = diagnoses.find((d) => d.code === code);
  if (!diagnosis) return;
  return diagnosis;
};

const addDiagnose = () => {
  return null;
};

export default {
  getEntries,
  findByCode,
  addDiagnose,
};
