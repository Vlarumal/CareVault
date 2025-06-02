import axios from 'axios';
import { DiagnosisEntry } from '../types';
import { apiBaseUrl } from '../constants';

const getAllDiagnoses = async () => {
  const { data } = await axios.get<DiagnosisEntry[]>(
    `${apiBaseUrl}/diagnoses`
  );

  return data;
};

const getDiagnosisByCode = async (code: string) => {
  const { data } = await axios.get<DiagnosisEntry>(
    `${apiBaseUrl}/diagnoses/${code}`
  );

  return data;
};

export default {
  getAllDiagnoses,
  getDiagnosisByCode,
};
