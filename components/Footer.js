import FooterClient from './FooterClient';
import { getCompanyInfo } from '@/utils/companyInfo';

export default async function Footer({ brand, companyInfo: providedCompanyInfo }) {
  const companyInfo = providedCompanyInfo ?? await getCompanyInfo();
  return <FooterClient brand={brand} companyInfo={companyInfo} />;
}
