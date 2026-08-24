import { getCompanyInfo } from '@/utils/companyInfo';
import { getProjectConfig } from '@/utils/projectConfig';

export const dynamic = 'force-dynamic';

export async function GET() {
  const project = getProjectConfig();
  const companyInfo = await getCompanyInfo();
  const companyName =
    companyInfo?.company_name ||
    companyInfo?.companyName ||
    companyInfo?.name ||
    companyInfo?.legal_name ||
    companyInfo?.legalName ||
    project.legalName;

  return Response.json(
    {
      success: true,
      data: {
        companyName,
        legalName: companyName,
        brandName: project.legalName,
        displayName: project.displayName,
        logo: companyInfo?.company_logo_url || project.logo,
        contact: companyInfo?.contact || {},
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}
