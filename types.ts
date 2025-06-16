
export interface BloodTestDataPoint {
  date: string;
  value: number;
  unit: string;
  refRange: string | null;
  note?: string;
}

export interface BloodTestData {
  [parameterName: string]: BloodTestDataPoint[];
}

export interface RefRange {
  min: number | null;
  max: number | null;
  text: string;
}

export interface ChartAnnotation {
  type: 'line';
  yMin: number;
  yMax: number;
  borderColor: string;
  borderWidth: number;
  borderDash?: number[];
  label?: {
    content: string;
    display: boolean;
    position: string;
    backgroundColor: string;
    font?: {
      style?: string;
      size?: number;
      weight?: string;
    };
    color?: string;
    padding?: number;
    borderRadius?: number;
  };
}
