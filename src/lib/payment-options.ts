export const paymentTypeOptions = [
  'AllBank Cash-out',
  'AllBank Cash-in',
  'BDO Cash-in',
  'BDO Cash-out',
  'BPI Cash-in',
  'BPI Cash-out',
  'CIMB Cash-in',
  'CIMB Cash-out',
  'EastWest Cash-in',
  'EastWest Cash-out',
  'GCash Cash-in',
  'GCash Cash-out',
  'GCash Load',
  'Gotyme Cash-in',
  'Gotyme Cash-out',
  'Maribank Cash-in',
  'MariBank Cash-out',
  'Maribank Load',
  'Maya Cash-in',
  'Maya Cash-out',
  'Maya Load',
  'Metrobank Cash-in',
  'Metrobank Cash-out',
  'PNB Cash-in',
  'PNB Cash-out',
  'PSBank Cash-in',
  'PSBank Cash-out',
  'RCBC Cash-in',
  'RCBC Cash-out',
  'SecurityBank Cash-in',
  'SecurityBank Cash-out',
  'UnionBank Cash-in',
  'UnionBank Cash-out',
  'UnoBank Cash-in',
  'UnoBank Cash-out',
] as const

export function getPaymentTypesForDevice(device: string): readonly string[] {
  if (device === 'ME') {
    return paymentTypeOptions
  }

  if (device === 'CP2') {
    return [
      'GCash Cash-in',
      'GCash Cash-out',
      'GCash Load',
      'Maya Cash-in',
      'Maya Cash-out',
      'Maya Load',
    ] as const
  }

  if (device === 'CP4') {
    return [
      'GCash Cash-in',
      'GCash Cash-out',
      'GCash Load',
      'Maribank Cash-in',
      'MariBank Cash-out',
      'Maribank Load',
    ] as const
  }

  // CP1, CP3, CP5, CP6, CP7, CP8 - only GCash
  return [
    'GCash Cash-in',
    'GCash Cash-out',
    'GCash Load',
  ] as const
}