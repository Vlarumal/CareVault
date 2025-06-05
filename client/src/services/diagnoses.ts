import axios from 'axios';
import { DiagnosisEntry } from '../types';
import { apiBaseUrl } from '../constants';
import { apiRetry } from '../utils/apiUtils';

const getAllDiagnoses = async () => {
  return apiRetry(() =>
    axios.get<DiagnosisEntry[]>(`${apiBaseUrl}/diagnoses`).then(res => res.data)
  );
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
