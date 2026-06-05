const PROJECTS = {
  Travel_Holiday: {
    key: 'Travel_Holiday',
    displayName: 'TRAVELS HOLIDAY',
    legalName: 'ITS TRAVELS AND TOURS',
    logo: '/logooo.png',
    primary: '#026eb5',
    primaryHover: '#005f9f',
    primaryLight: '#c5e5fb',
    primaryBorder: '#7abfee',
    secondary: '#fdce2e',
    secondaryHover: '#f6b800',
  },
  Travel_and_Tour: {
    key: 'Travel_and_Tour',
    displayName: 'ITS TRAVELS AND TOURS',
    legalName: 'ITS TRAVELS AND TOURS',
    logo: '/ITS.webp',
    primary: '#f58220',
    primaryHover: '#d96b09',
    primaryLight: '#fff2e5',
    primaryBorder: '#ffc38a',
    secondary: '#026eb5',
    secondaryHover: '#005f9f',
  },
};

export function getProjectKey() {
  const value = process.env.project || process.env.NEXT_PUBLIC_PROJECT || process.env.PROJECT;
  return PROJECTS[value] ? value : 'Travel_Holiday';
}

export function getProjectConfig() {
  return PROJECTS[getProjectKey()];
}
