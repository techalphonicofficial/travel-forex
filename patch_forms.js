const fs = require('fs');
const path = require('path');

const filesToPatch = [
  { path: 'app/flights/FlightsClient.js', handler: 'const handleSearchSubmit = async (e) => {' },
  { path: 'app/hotels/HotelsClient.js', handler: 'const searchHotels = async (e) => {' },
  { path: 'app/hotels/[id]/HotelDetailClient.js', handler: 'const submitInquiry = async (e) => {' },
  { path: 'app/cruise/CruiseClient.js', handler: 'const handleSearchSubmit = async (e) => {' },
  { path: 'app/events/EventsClient.js', handler: 'const handleSearchSubmit = async (e) => {' },
  { path: 'app/eurorail/EurorailClient.js', handler: 'const handleSearchSubmit = async (e) => {' },
  { path: 'app/conferences/ConferencesClient.js', handler: 'const handleSearchSubmit = async (e) => {' },
  { path: 'app/visa/VisaClient.js', handler: 'const handleInquirySubmit = async (e) => {' },
  { path: 'app/contact/ContactClient.js', handler: 'const handleSubmit = async (e) => {' }
];

const injectCode = `
    const token = getStoredToken();
    if (!token) {
      toast.error('Please login first to continue.');
      router.push(\`/auth/login?redirect=\${encodeURIComponent(window.location.pathname)}\`);
      return;
    }
`;

filesToPatch.forEach(fileDef => {
  const fullPath = path.join(__dirname, fileDef.path);
  if (!fs.existsSync(fullPath)) {
    console.log('Skipping (not found):', fullPath);
    return;
  }

  let code = fs.readFileSync(fullPath, 'utf8');

  // 1. Ensure useRouter is imported
  if (!code.includes('useRouter')) {
    code = code.replace(/import {.*?}.*?from 'next\/navigation';/g, match => {
      if (!match.includes('useRouter')) {
        return match.replace('{', '{ useRouter,');
      }
      return match;
    });
    if (!code.includes('useRouter')) {
      code = code.replace(/(import .*?;\\n)/, "$1import { useRouter } from 'next/navigation';\\n");
    }
  }

  // 2. Ensure toast is imported
  if (!code.includes('react-hot-toast')) {
    code = code.replace(/(import .*?;\\n)/, "$1import toast from 'react-hot-toast';\\n");
  }

  // 3. Ensure getStoredToken is imported
  if (!code.includes('getStoredToken')) {
    code = code.replace(/import {.*?}.*?from '@\/utils\/api';/g, match => {
      if (!match.includes('getStoredToken')) {
        return match.replace('{', '{ getStoredToken,');
      }
      return match;
    });
    if (!code.includes('getStoredToken')) {
      code = code.replace(/(import .*?;\\n)/, "$1import { getStoredToken } from '@/utils/api';\\n");
    }
  }

  // 4. Ensure router is instantiated
  // Find component declaration
  const compRegex = /export default (?:async )?function \w+\(.*?\) \{/;
  const match = compRegex.exec(code);
  if (match) {
    const compStart = match.index + match[0].length;
    const afterComp = code.slice(compStart);
    if (!afterComp.includes('const router = useRouter()')) {
      code = code.slice(0, compStart) + '\\n  const router = useRouter();' + code.slice(compStart);
    }
  }

  // 5. Inject guard in handler
  if (code.includes(fileDef.handler)) {
    const safeInjectCode = injectCode.replace(/\\$/g, '$$$$');
    code = code.replace(fileDef.handler, fileDef.handler + safeInjectCode);
  }

  fs.writeFileSync(fullPath, code);
  console.log('Patched:', fileDef.path);
});
