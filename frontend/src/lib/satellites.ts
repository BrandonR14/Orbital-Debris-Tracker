export interface SatOption {
  name: string;
  norad_id: string;
  category: string;
}

export const SATELLITES: SatOption[] = [
  // Space Stations
  { name: 'ISS (International Space Station)', norad_id: '25544', category: 'Space Stations' },
  { name: 'Tiangong Space Station (CSS)', norad_id: '48274', category: 'Space Stations' },

  // Telescopes & Observatories
  { name: 'Hubble Space Telescope', norad_id: '20580', category: 'Telescopes' },
  { name: 'James Webb Space Telescope', norad_id: '50463', category: 'Telescopes' },
  { name: 'Chandra X-Ray Observatory', norad_id: '25867', category: 'Telescopes' },
  { name: 'Fermi Gamma-ray Space Telescope', norad_id: '33053', category: 'Telescopes' },

  // Earth Observation
  { name: 'Terra (EOS AM-1)', norad_id: '25994', category: 'Earth Observation' },
  { name: 'Aqua (EOS PM-1)', norad_id: '27424', category: 'Earth Observation' },
  { name: 'Landsat 8', norad_id: '39084', category: 'Earth Observation' },
  { name: 'Landsat 9', norad_id: '49260', category: 'Earth Observation' },
  { name: 'Sentinel-1A', norad_id: '39634', category: 'Earth Observation' },
  { name: 'Sentinel-2A', norad_id: '40697', category: 'Earth Observation' },
  { name: 'Sentinel-2B', norad_id: '42063', category: 'Earth Observation' },
  { name: 'Sentinel-3A', norad_id: '41335', category: 'Earth Observation' },
  { name: 'Sentinel-3B', norad_id: '43437', category: 'Earth Observation' },
  { name: 'Sentinel-6A (Michael Freilich)', norad_id: '46984', category: 'Earth Observation' },
  { name: 'NOAA-19', norad_id: '33591', category: 'Earth Observation' },
  { name: 'NOAA-20 (JPSS-1)', norad_id: '43013', category: 'Earth Observation' },
  { name: 'Suomi NPP', norad_id: '37849', category: 'Earth Observation' },
  { name: 'ICESat-2', norad_id: '43613', category: 'Earth Observation' },
  { name: 'GRACE-FO 1', norad_id: '43476', category: 'Earth Observation' },
  { name: 'GRACE-FO 2', norad_id: '43477', category: 'Earth Observation' },

  // Weather
  { name: 'GOES-16', norad_id: '41866', category: 'Weather' },
  { name: 'GOES-17', norad_id: '43226', category: 'Weather' },
  { name: 'GOES-18', norad_id: '51850', category: 'Weather' },
  { name: 'Meteosat-9', norad_id: '28912', category: 'Weather' },
  { name: 'Meteosat-11', norad_id: '38552', category: 'Weather' },
  { name: 'Himawari-8', norad_id: '40267', category: 'Weather' },
  { name: 'Himawari-9', norad_id: '41836', category: 'Weather' },

  // Navigation / GPS
  { name: 'GPS IIR-3 (PRN 11)', norad_id: '25933', category: 'Navigation' },
  { name: 'GPS IIF-1 (PRN 25)', norad_id: '36585', category: 'Navigation' },
  { name: 'GPS III-1 (PRN 04)', norad_id: '43873', category: 'Navigation' },
  { name: 'GPS III-2 (PRN 18)', norad_id: '44506', category: 'Navigation' },
  { name: 'Galileo-1 (GSAT0101)', norad_id: '37846', category: 'Navigation' },
  { name: 'GLONASS-M 730', norad_id: '32275', category: 'Navigation' },

  // Communications
  { name: 'Intelsat 901', norad_id: '26824', category: 'Communications' },
  { name: 'Intelsat 10-02', norad_id: '28358', category: 'Communications' },
  { name: 'Inmarsat-4 F1', norad_id: '28628', category: 'Communications' },
  { name: 'SES-1', norad_id: '36516', category: 'Communications' },
  { name: 'Iridium 180', norad_id: '42803', category: 'Communications' },
  { name: 'Iridium 181', norad_id: '42804', category: 'Communications' },

  // Starlink (sample)
  { name: 'Starlink-1007', norad_id: '44713', category: 'Starlink' },
  { name: 'Starlink-1008', norad_id: '44714', category: 'Starlink' },
  { name: 'Starlink-1009', norad_id: '44715', category: 'Starlink' },
  { name: 'Starlink-1010', norad_id: '44716', category: 'Starlink' },
  { name: 'Starlink-1011', norad_id: '44717', category: 'Starlink' },
  { name: 'Starlink-2003', norad_id: '45178', category: 'Starlink' },
  { name: 'Starlink-2004', norad_id: '45179', category: 'Starlink' },
  { name: 'Starlink-3000', norad_id: '47722', category: 'Starlink' },
  { name: 'Starlink-4001', norad_id: '50800', category: 'Starlink' },
  { name: 'Starlink-5001', norad_id: '53543', category: 'Starlink' },

  // Science / Exploration
  { name: 'OSTM/Jason-2', norad_id: '33105', category: 'Science' },
  { name: 'Jason-3', norad_id: '41240', category: 'Science' },
  { name: 'SWOT', norad_id: '54754', category: 'Science' },
  { name: 'TESS', norad_id: '43435', category: 'Science' },
  { name: 'CHEOPS', norad_id: '44874', category: 'Science' },
  { name: 'Spektr-RG', norad_id: '44432', category: 'Science' },

  // Notable Debris / Defunct
  { name: 'Envisat (defunct)', norad_id: '27386', category: 'Debris / Defunct' },
  { name: 'ERS-2 (defunct)', norad_id: '23560', category: 'Debris / Defunct' },
  { name: 'LDEF (Long Duration Exposure Facility)', norad_id: '13899', category: 'Debris / Defunct' },
];
